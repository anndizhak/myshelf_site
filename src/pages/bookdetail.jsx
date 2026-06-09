import { useState, useEffect } from "react";
import { fetchDescription } from "../api/openLibrary";
import { callClaude, buildAnnotationPrompt } from "../api/claude";
import { Spinner } from "../components/spinner";

const STATUS_OPTIONS = [
  { label: "Хочу прочитати", color: "#E8D5F5", border: "#894a9c" },
  { label: "Улюблена",       color: "#F5C6CB", border: "#e0a0b0" },
  { label: "Читаю зараз",    color: "#C8F5C6", border: "#5aab57" },
];

export const BookDetail = ({ book, onBack }) => {
  const [desc,         setDesc]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showDialog,   setShowDialog]   = useState(false);
  const [savedStatus,  setSavedStatus]  = useState(null);
  const [tempStatus, setTempStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    setDesc(null);

    (async () => {
      if (book.source === "yakaboo" && book.description) {
        setDesc(book.description); setLoading(false); return;
      }
      if (book.workId) {
        const raw = await fetchDescription(book.workId, book.source);
        if (raw) { setDesc(raw); setLoading(false); return; }
      }
      if (book.source === "yakaboo" && book.urlKey && !book.description) {
        try {
          const res  = await fetch(`http://localhost:3001/api/books/${book.urlKey}`);
          const data = await res.json();
          if (data.description) { setDesc(data.description); setLoading(false); return; }
        } catch {}
      }
      try {
        const text = await callClaude(buildAnnotationPrompt(book.title, book.author));
        setDesc(text || "Анотація недоступна.");
      } catch {
        setDesc("Анотація недоступна.");
      }
      setLoading(false);
    })();
  }, [book.id]);

  const handleSave = (label) => {
    setSavedStatus(label);
    setShowDialog(false);
  };

  return (
    <div className="detail">
      {/* Ліва колонка */}
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

      {/* Права колонка */}
      <div className="detail-right">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div className="meta">
            <span>к-сть сторінок: <strong>{book.pages}</strong></span>
            <span>мова: <strong>{book.language}</strong></span>
            <span>рік: <strong>{book.year}</strong></span>
          </div>
          <button className="back-btn" onClick={onBack} style={{ marginTop: "0", flexShrink: 0}}>На головну</button>
        </div>

        <div className="anno-title">Анотація</div>
        <div className={`anno-box ${loading ? "loading" : ""}`}>
          {loading ? <><span>Завантаження анотації…</span><Spinner /></> : desc}
        </div>

        {/* Кнопка статусу / діалог */}
        <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>

          {showDialog && (
            <>
              <div
                onClick={() => setShowDialog(false)}
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
              />

              <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#FFFBED", border: "2px solid #5d4022",
                borderRadius: "16px", padding: "24px 32px",
                zIndex: 10, width: "420px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)"
              }}>
                <span
                  onClick={() => setShowDialog(false)}
                  style={{ position: "absolute", top: "12px", right: "16px", cursor: "pointer", fontWeight: "bold" }}
                >✕</span>

                {/* Кнопки статусів — в колонку */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {STATUS_OPTIONS.slice(0, 2).map(({ label, color, border }) => (
                    <button
                      key={label}
                      onClick={() => setTempStatus(label)}  // тільки виділяємо, не зберігаємо
                      style={{
                        background: color,
                        border: `2px solid ${border}`,
                        borderRadius: "20px", padding: "8px 16px",
                        cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                        alignSelf: "flex-start",
                        opacity: tempStatus === label ? 1 : 0.6,
                        fontWeight: tempStatus === label ? "bold" : "normal",
                      }}
                    >
                      {label}
                    </button>
                  ))}

                  {/* Зберегти справа від останньої кнопки */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setTempStatus("Читаю зараз")}
                      style={{
                        background: STATUS_OPTIONS[2].color,
                        border: `2px solid ${STATUS_OPTIONS[2].border}`,
                        borderRadius: "20px", padding: "8px 16px",
                        cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                        opacity: tempStatus === "Читаю зараз" ? 1 : 0.6,
                        fontWeight: tempStatus === "Читаю зараз" ? "bold" : "normal",
                      }}
                    >
                      Читаю зараз
                    </button>
                    <span
                      onClick={() => { if (tempStatus) { handleSave(tempStatus); } }}
                      style={{
                        textDecoration: "underline", cursor: tempStatus ? "pointer" : "default",
                        fontSize: "14px", whiteSpace: "nowrap",
                        opacity: tempStatus ? 1 : 0.4
                      }}
                    >Зберегти!</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            className="status-btn"
            onClick={() => { setTempStatus(savedStatus); setShowDialog(prev => !prev); }}
            style={{
              background: savedStatus
                ? STATUS_OPTIONS.find(s => s.label === savedStatus)?.color
                : "#F5C6CB",
              border: `2px solid ${savedStatus
                ? STATUS_OPTIONS.find(s => s.label === savedStatus)?.border
                : "#e0a0b0"}`,
              borderRadius: "20px", padding: "8px 20px",
              cursor: "pointer", fontFamily: "inherit", fontSize: "14px"
            }}
          >
            {savedStatus ?? "Статус книги ?"}
          </button>
        </div>
      </div>
    </div>
  );
};