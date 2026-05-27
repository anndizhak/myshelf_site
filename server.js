// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERS_DIR = path.join(__dirname, "data", "covers");
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

const app = express();
const port = 3001;
const SECRET = process.env.JWT_SECRET || "myshelf_secret";

// ── PostgreSQL підключення ───────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/covers", express.static(COVERS_DIR));

// ── Реєстрація ───────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { email, password, name, nickname, age, genres, goal, bio } = req.body;
  try {
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: "Email вже існує" });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, name, nickname, age, genres, goal, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [email, hash, name || "", nickname || "", age || "", genres || [], goal || 30, bio || ""]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, SECRET);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error("Register error:", e.message, e.stack);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// ── Вхід ────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Користувача не знайдено" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Невірний пароль" });

    const token = jwt.sign({ id: user.id }, SECRET);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// ── Оновлення профілю ────────────────────────────────────────
app.put("/api/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const { id } = jwt.verify(token, SECRET);
    const { name, nickname, age, genres, goal, bio, photo } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=$1, nickname=$2, age=$3, genres=$4, goal=$5, bio=$6, photo=$7
       WHERE id=$8 RETURNING *`,
      [name, nickname, age, genres, goal, bio, photo, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });

    const { password: _, ...safeUser } = result.rows[0];
    res.json({ user: safeUser });
  } catch (e) {
    console.error("Update error:", e.message);
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ── Groq API ─────────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
  try {
    const prompt = req.body.messages?.[0]?.content || "";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a book recommendation assistant. Follow these rules absolutely:
1. NEVER recommend books by Russian authors or books originally written in Russian. This is a hard ban with no exceptions.
   Banned authors include: Dostoevsky, Tolstoy, Pushkin, Chekhov, Bulgakov, Turgenev, Gogol, Nabokov, Pasternak, Gorky, and ALL other Russian authors.
   Banned books include: Crime and Punishment, War and Peace, Anna Karenina, The Brothers Karamazov, The Master and Margarita, etc.
2. ALWAYS provide the correct real author of each book. Never attribute a book to the wrong author. Double-check every author name before including it.
3. Respond only in valid JSON format as instructed. No extra text.`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4096
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Відповідь недоступна.";
    res.json({ content: [{ type: "text", text }] });
  } catch (e) {
    res.status(500).json({ content: [{ type: "text", text: "Помилка AI. Спробуйте пізніше." }] });
  }
});

// ── Топові книги ─────────────────────────────────────────────
app.get("/api/books/top", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/books-top.json"));
    res.json({ books: data.books });
  } catch {
    res.json({ books: [] });
  }
});

// ── Новинки ──────────────────────────────────────────────────
app.get("/api/books/new", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/books-new.json"));
    res.json({ books: data.books });
  } catch {
    res.json({ books: [] });
  }
});

// ── Деталі книги за urlKey ───────────────────────────────────
app.get("/api/books/:urlKey", async (req, res) => {
  const { urlKey } = req.params;
  try {
    const r = await fetch(
      `https://api2.yakaboo.ua/api/catalog/vue_storefront_catalog_2/product/_search?_source_include=description,number_of_pages,book_publication_label&from=0&size=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.yakaboo.ua/",
          "Origin": "https://www.yakaboo.ua"
        },
        body: JSON.stringify({ query: { term: { url_key: urlKey } } })
      }
    );
    const data = await r.json();
    const s = data.hits?.hits?.[0]?._source;
    if (!s) return res.status(404).json({});
    res.json({
      description: s.description?.replace(/<[^>]*>/g, "").trim() || null,
      pages: s.number_of_pages || "—",
      year: s.book_publication_label?.label || "—",
    });
  } catch {
    res.status(500).json({});
  }
});

// ── Старий endpoint ──────────────────────────────────────────
app.get("/api/books", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/books.json"));
    res.json({ books: data.books });
  } catch {
    res.json({ books: [] });
  }
});

// ── Проксі для обкладинок ────────────────────────────────────
app.get("/api/cover", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).end();
  try {
    const response = await fetch(url, {
      headers: {
        "Referer": "https://www.yakaboo.ua/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(404).end();
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));