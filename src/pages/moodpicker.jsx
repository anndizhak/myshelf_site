import { useState } from "react";
import { callClaude, buildMoodPrompt } from "../api/claude";
import { Spinner } from "../components/spinner";

// strip CJK / Hiragana / Katakana / Korean
const cleanReason = (text) =>
  text?.replace(/[぀-ヿ一-鿿가-힯㐀-䶿]/g, "").trim() || text;

const googleCover = async (query) => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    );
    const data = await res.json();
    const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    if (thumb) return thumb.replace("http://", "https://").replace("zoom=1", "zoom=2").replace("&edge=curl", "");
  } catch {}
  return null;
};

const openLibraryCover = async (query) => {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=cover_i`
    );
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  } catch {}
  return null;
};

const fetchCover = async (title, author, originalTitle) => {
  const searches = [
    () => googleCover(`intitle:${originalTitle || title} inauthor:${author}`),
    () => googleCover(`${originalTitle || title} ${author}`),
    () => googleCover(originalTitle || title),
    () => googleCover(`intitle:${title}`),
    () => googleCover(title),
    () => openLibraryCover(`${originalTitle || title} ${author}`),
    () => openLibraryCover(originalTitle || title),
    () => openLibraryCover(title),
  ];
  for (const search of searches) {
    const cover = await search();
    if (cover) return cover;
  }
  return null;
};

export const MoodPicker = () => {
  const [mood,    setMood]    = useState("");
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    setBooks([]);
    setError("");
    try {
      const text = await callClaude(buildMoodPrompt(mood));
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("no json");
      const parsed = JSON.parse(match[0]);
      const withCovers = await Promise.all(
        parsed.map(async (book) => ({
          ...book,
          reason: cleanReason(book.reason),
          cover: await fetchCover(book.title, book.author, book.originalTitle),
        }))
      );
      setBooks(withCovers);
    } catch {
      setError("Помилка зʼєднання з AI. Спробуйте пізніше.");
    }
    setLoading(false);
  };

  return (
    <div className="mood-section">
      <div className="mood-title">📖 Книга під настрій</div>
      <div className="mood-sub">
        Опишіть свій настрій, що вас цікавить або що ви хочете відчути після читання —
        AI підбере ідеальну книгу!
      </div>

      <textarea
        className="mood-textarea"
        placeholder='Наприклад: «Хочу щось захопливе з детективним сюжетом, але не надто темне. Люблю несподіваний фінал...»'
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        rows={5}
      />

      <button
        className="mood-btn"
        onClick={handleSubmit}
        disabled={loading || !mood.trim()}
      >
        {loading ? "Підбираємо…" : "✨ Підібрати книгу"}
      </button>

      {loading && <Spinner />}
      {error && <div className="mood-error">{error}</div>}

      {books.length > 0 && (
        <div className="mood-books">
          {books.map((book, i) => (
            <div key={i} className="mood-book-card">
              {book.cover
                ? <img src={book.cover} alt={book.title} className="mood-book-cover"
                    onError={(e) => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                : null}
              <div className="mood-book-cover mood-book-cover--placeholder"
                style={{display: book.cover ? "none" : "flex"}}>📚</div>
              <div className="mood-book-info">
                <div className="mood-book-title">{book.title}</div>
                <div className="mood-book-author">{book.author}</div>
                <div className="mood-book-reason">{book.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
