// useBooks.js
import { useEffect, useState, useRef } from "react";

export const useBooks = () => {
  const [topBooks, setTopBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadBooks = async () => {
      try {
        const [topRes, newRes] = await Promise.all([
          fetch("http://localhost:3001/api/books/top"),
          fetch("http://localhost:3001/api/books/new"),
        ]);

        if (!topRes.ok || !newRes.ok) throw new Error("HTTP error");

        const topData = await topRes.json();
        const newData = await newRes.json();

        setTopBooks(topData.books || []);
        setNewBooks(newData.books || []);
        setError(null);

      } catch (err) {
        console.error("Помилка завантаження книг:", err);
        setError(err.message || "Невідома помилка");
        setTopBooks([]);
        setNewBooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  return { topBooks, newBooks, loading, error };
};