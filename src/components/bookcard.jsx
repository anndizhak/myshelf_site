export const BookCard = ({ book, onClick }) => {
  const shortTitle = book.title.length > 40
    ? book.title.slice(0, 40).trimEnd() + "…"
    : book.title;

  // локальні обкладинки не проксуємо
  const coverSrc = book.cover?.startsWith("http://localhost")
    ? book.cover
    : book.cover
      ? `http://localhost:3001/api/cover?url=${encodeURIComponent(book.cover)}`
      : null;

  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="cover-wrap">
        {coverSrc
          ? <img src={coverSrc} alt={book.title} />
          : <div className="cover-placeholder">{shortTitle}</div>
        }
      </div>
      <div className="book-title">{shortTitle}</div>
    </div>
  );
};