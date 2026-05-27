import { useState, useEffect } from "react";
import { fetchDescription } from "../api/openLibrary";
import { callClaude, buildAnnotationPrompt } from "../api/claude";
import { Spinner } from "../components/spinner";

// Сторінка з детальною інформацією про книгу
export const BookDetail = ({ book, onBack }) => {
  const [desc,    setDesc]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setDesc(null);
  
    (async () => {
      // 1. Якщо Yakaboo і анотація вже є в даних
      if (book.source === "yakaboo" && book.description) {
        setDesc(book.description);
        setLoading(false);
        return;
      }
  
      // 2. Якщо є workId — беремо з API
      if (book.workId) {
        const raw = await fetchDescription(book.workId, book.source);
        if (raw) { setDesc(raw); setLoading(false); return; }
      }

      // 2.5 Якщо Yakaboo але нема анотації — підвантажуємо з сервера
      if (book.source === "yakaboo" && book.urlKey && !book.description) {
        try {
          const res = await fetch(`http://localhost:3001/api/books/${book.urlKey}`);
          const data = await res.json();
          if (data.description) { setDesc(data.description); setLoading(false); return; }
        } catch {}
      }
  
      // 3. Генеруємо через Gemini
      try {
        const text = await callClaude(buildAnnotationPrompt(book.title, book.author));
        setDesc(text || "Анотація недоступна.");
      } catch {
        setDesc("Анотація недоступна.");
      }
  
      setLoading(false);
    })();
  }, [book.id]);

  return (
    <div className="detail">
      {/* Ліва колонка — обкладинка */}
      <div className="detail-left">
        <div className="detail-cover">
          {book.cover
            ? <img
              src={book.cover?.startsWith("http://localhost") ? book.cover : `http://localhost:3001/api/cover?url=${encodeURIComponent(book.cover)}`}
              alt={book.title}
              />
            : <div className="cover-placeholder" style={{ height: "100%" }}>{book.title}</div>
          }
        </div>
        <div className="detail-book-title">"{book.title}"</div>
        <div className="detail-author">{book.author}</div>
      </div>

      {/* Права колонка — мета + анотація */}
      <div className="detail-right">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
      <div className="meta">
        <span>к-сть сторінок: <strong>{book.pages}</strong></span>
        <span>мова: <strong>{book.language}</strong></span>
        <span>рік: <strong>{book.year}</strong></span>
      </div>
        <button className="back-btn" onClick={onBack} style={{ marginTop: "0", flexShrink: 0 }}>На головну</button>
      </div>
          
        <div className="anno-title">Анотація</div>
        <div className={`anno-box ${loading ? "loading" : ""}`}>
          {loading ? <><span>Завантаження анотації…</span><Spinner /></> : desc}
        </div>
      </div>
    </div>
  );
};