import puppeteer from "puppeteer";
import fs from "fs";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── fetchBookDetails ──────────────────────────────────────────
const fetchBookDetails = async (browser, urlKey) => {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");

    let details = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("api2.yakaboo.ua") && url.includes("_search")) {
        try {
          const data = await response.json();
          const s = data.hits?.hits?.[0]?._source;
          if (s && !details) {
            details = {
              description: (s.description || s.short_description || "")
                             .replace(/<[^>]*>/g, "").trim() || null,
              pages:    s.book_page_count_label?.[0]?.label || s.book_page_count || "—",
              language: s.book_lang_label?.[0]?.label || null,
              year:     String(s.book_year_label?.[0]?.label || s.book_year || "—"),
            };
          }
        } catch {}
      }
    });

    await page.goto(
      `https://www.yakaboo.ua/ua/${urlKey}.html`,
      { waitUntil: "domcontentloaded", timeout: 15000 }
    );
    await sleep(4000);

    try {
      fs.mkdirSync("./data/covers", { recursive: true });

      const allImgs = await page.$$eval("img", imgs =>
        imgs.map(img => img.src).filter(src => src.includes("static.yakaboo.ua"))
      );
      const imgUrl = allImgs[0] || null;

      if (imgUrl && !imgUrl.includes("placeholder")) {
        const response = await fetch(imgUrl);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(`./data/covers/${urlKey}.jpg`, Buffer.from(buffer));
        console.log(`  ✅ збережено: ${urlKey}`);
      } else {
        console.log(`  ❌ немає обкладинки: ${urlKey}`);
      }
    } catch (e) {
      console.log(`  ❌ помилка: ${urlKey}`, e.message);
    }

    return details;

  } catch (e) {
    if (!e.message?.includes("Target closed")) {
      console.log(`  ⚠️ помилка ${urlKey}:`, e.message);
    }
    return null;
  } finally {
    try {
      if (page && !page.isClosed()) await page.close();
    } catch {}
  }
};

// ── scrapeYakaboo — через Puppeteer (обхід Cloudflare) ───────
const scrapeYakaboo = async (browser, sortOrder, label) => {
  let page;
  try {
    console.log(`\n[${label}] Запит до API через браузер...`);
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    // Відвідуємо головну, щоб отримати cookies сесії
    await page.goto("https://www.yakaboo.ua/ua/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await sleep(2000);

    const result = await page.evaluate(async (sortOrder) => {
      const res = await fetch(
        "https://api2.yakaboo.ua/api/catalog/vue_storefront_catalog_2/product/_search?_source_include=id,name,author_label,image,price,final_price,url_key,book_publication_label,description,number_of_pages,book_year_label,book_page_count,published_at&from=0&size=80",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Origin": "https://www.yakaboo.ua", "Referer": "https://www.yakaboo.ua/" },
          body: JSON.stringify({
            query: { bool: { filter: [{ term: { status: 1 } }, { term: { "stock.is_in_stock": true } }, { terms: { category_ids: [6327] } }] } },
            sort: [{ [sortOrder]: "desc" }],
            track_total_hits: true
          })
        }
      );
      return { status: res.status, body: await res.text() };
    }, sortOrder);

    if (result.status !== 200) {
      console.log(`  [${label}] HTTP ${result.status}`);
      return [];
    }
    const data = JSON.parse(result.body);
    const hits = data.hits?.hits || [];
    console.log(`  [${label}] отримано: ${hits.length}`);
    return hits.map(h => h._source).filter(Boolean);
  } catch (e) {
    console.log(`  [${label}] помилка:`, e.message);
    return [];
  } finally {
    try { if (page && !page.isClosed()) await page.close(); } catch {}
  }
};

// ── mapBooks ──────────────────────────────────────────────────
const mapBooks = (rawBooks) => {
  const seen = new Set();
  return rawBooks
    .filter(s => {
      if (!s.name) return false;
      const key = s.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s, i) => ({
      id:          "yak_" + (s.id || i),
      title:       s.name,
      author:      Array.isArray(s.author_label)
                     ? s.author_label.map(a => a.label).join(", ")
                     : s.author_label?.label || "—",
      cover:       s.image
                     ? `https://www.yakaboo.ua/media/catalog/product${s.image}`
                     : null,
      year: s.book_publication_label?.label
        || s.book_year_label?.[0]?.label
        || s.published_at?.slice(0, 4) || "—",
      pages: s.number_of_pages || s.book_page_count || "—",
      language:    "українська",
      price:       s.final_price || s.price || null,
      description: s.description ? s.description.replace(/<[^>]*>/g, "").trim() : null,
      urlKey:      s.url_key,
      source:      "yakaboo",
    }));
};

// ── enrichBooks ───────────────────────────────────────────────
const enrichBooks = async (browser, books) => {
  try {

    const BATCH = 3;
    for (let i = 0; i < books.length; i += BATCH) {
      const batch = books.slice(i, i + BATCH);
      await Promise.all(batch.map(async (book) => {
        if (!book.urlKey) return;
        const details = await fetchBookDetails(browser, book.urlKey);
        if (details) {
          if (details.description) book.description = details.description;
          if (details.pages !== "—") book.pages = details.pages;
          if (details.language)     book.language = details.language;
          if (details.year !== "—") book.year = details.year;
        }
        const localCover = `./data/covers/${book.urlKey}.jpg`;
        if (fs.existsSync(localCover)) {
          book.cover = `http://localhost:3001/covers/${book.urlKey}.jpg`;
        }
      }));
      console.log(`  деталі: ${Math.min(i + BATCH, books.length)}/${books.length}`);
      await sleep(1000);
    }
  } catch (e) {
    console.log("  enrichBooks помилка:", e.message);
  }
  return books;
};

// ── run ───────────────────────────────────────────────────────
const run = async () => {
  fs.mkdirSync("./data", { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    // Бестселери
    console.log("\n=== ЗБИРАЄМО БЕСТСЕЛЕРИ ===");
    const rawTop = await scrapeYakaboo(browser, "total_sales", "TOP");
    const topBooks = mapBooks(rawTop).slice(0, 40);
    console.log("\nЗавантажуємо деталі бестселерів...");
    await enrichBooks(browser, topBooks);
    fs.writeFileSync("./data/books-top.json", JSON.stringify({
      updatedAt: new Date().toISOString(),
      books: topBooks
    }, null, 2));
    console.log(`✅ Збережено ${topBooks.length} бестселерів`);

    // Новинки
    console.log("\n=== ЗБИРАЄМО НОВИНКИ ===");
    const rawNew = await scrapeYakaboo(browser, "created_at", "NEW");
    const newBooks = mapBooks(rawNew).slice(0, 40);
    console.log("\nЗавантажуємо деталі новинок...");
    await enrichBooks(browser, newBooks);
    fs.writeFileSync("./data/books-new.json", JSON.stringify({
      updatedAt: new Date().toISOString(),
      books: newBooks
    }, null, 2));
    console.log(`✅ Збережено ${newBooks.length} новинок`);
  } finally {
    try { await browser.close(); } catch {}
  }
};

run();