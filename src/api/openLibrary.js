// ── популярні категорії для рекомендацій ─────────────────────────────────────
const SUBJECTS = [
  "fantasy",
  "romance",
  "thriller",
  "science fiction",
  "mystery",
  "historical fiction",
  "young adult",
  "bestseller",
  "classic literature",
  "drama"
];

const randomSubject = () =>
  SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];


// ── Google Books ─────────────────────────────────────────────────────────────
const fetchFromGoogle = async (query, limit = 20) => {
  try {

    const safeLimit = Math.min(limit, 40); // 🔹 обмеження до 40
    const startIndex = Math.floor(Math.random() * 80);

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${safeLimit}&startIndex=${startIndex}`
    );

    if (!res.ok) return [];

    const data = await res.json();

    return (data.items || []).map((item) => {
      const info = item.volumeInfo;

      return {
        id: "google_" + item.id,
        title: info.title || "Без назви",
        author: info.authors?.[0] || "Невідомий автор",
        cover: info.imageLinks?.thumbnail
          ?.replace("http://", "https://")
          ?.replace("zoom=1", "zoom=2")
          ?.replace("&edge=curl", "") || null,
        year: info.publishedDate?.slice(0, 4) || "—",
        pages: info.pageCount || "—",
        language:
          info.language === "uk"
            ? "українська"
            : info.language === "en"
            ? "англійська"
            : info.language || "—",
        workId: item.id,
        source: "google",
      };
    });

  } catch {
    return [];
  }
};


// ── OpenLibrary ──────────────────────────────────────────────────────────────
const fetchFromOpenLibrary = async (query, limit = 20) => {
  try {

    const page = Math.floor(Math.random() * 10) + 1;

    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median,language`
    );

    if (!res.ok) return [];

    const data = await res.json();

    return (data.docs || []).map((b) => {

      const lang = b.language?.[0];

      return {
        id: "ol_" + b.key,
        title: b.title || "Без назви",
        author: b.author_name?.[0] || "Невідомий автор",
        cover: b.cover_i
          ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
          : null,
        year: b.first_publish_year || "—",
        pages: b.number_of_pages_median || "—",
        language:
          lang === "ukr"
            ? "українська"
            : lang === "eng"
            ? "англійська"
            : lang || "—",
        workId: b.key?.replace("/works/", ""),
        source: "openlibrary",
      };

    });

  } catch {
    return [];
  }
};


// ── універсальний fetch ──────────────────────────────────────────────────────
const fetchBooks = async (query, limit = 20) => {

  const [googleBooks, olBooks] = await Promise.all([
    fetchFromGoogle(query, limit),
    fetchFromOpenLibrary(query, limit),
  ]);

  const seen = new Set();
  const combined = [];

  for (const book of [...googleBooks, ...olBooks]) {

    const key = (book.title + book.author).toLowerCase().trim();

    if (!seen.has(key)) {
      seen.add(key);
      combined.push(book);
    }

    if (combined.length >= limit) break;
  }

  return combined;
};


// ── ТОПОВІ КНИГИ (40) ────────────────────────────────────────────────────────
export const fetchTopBooks = async () => {

  const subject = randomSubject();

  const books = await fetchBooks(subject, 40);

  return books;
};


// ── НОВА ПІДБІРКА (60) ───────────────────────────────────────────────────────
export const fetchNewCollection = async (excludeIds = []) => {

  const subject = randomSubject();

  const books = await fetchBooks(subject, 80);

  // фільтруємо щоб не повторювались з топом
  return books
    .filter(b => !excludeIds.includes(b.id))
    .slice(0, 60);
};


// ── АНОТАЦІЯ ─────────────────────────────────────────────────────────────────
export const fetchDescription = async (workId, source) => {

  if (source === "google") {
    try {

      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${workId}`
      );

      if (!res.ok) return null;

      const data = await res.json();

      return data.volumeInfo?.description || null;

    } catch {
      return null;
    }
  }

  if (source === "openlibrary") {
    try {

      const res = await fetch(
        `https://openlibrary.org/works/${workId}.json`
      );

      if (!res.ok) return null;

      const data = await res.json();

      const desc = data.description;

      if (!desc) return null;
      if (typeof desc === "string") return desc;
      if (desc.value) return desc.value;

    } catch {
      return null;
    }
  }

  return null;
};