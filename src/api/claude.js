// ── Claude API ────────────────────────────────────────────────────────────────
// Документація: https://docs.anthropic.com/en/api/messages

const CLAUDE_API = "http://localhost:3001/api/claude";

export const callClaude = async (prompt) => {
  const res = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
};

// Готові промпти ──────────────────────────────────────────────────────────────

export const buildAnnotationPrompt = (title, author) =>
  `Напиши коротку анотацію (3-4 речення) книги "${title}" автора ${author}. Відповідай українською мовою.`;

export const buildMoodPrompt = (mood) =>
  `Ти — книжковий консультант. Користувач описує свій настрій та вподобання: "${mood}".
Порекомендуй рівно 15 книг. Відповідай ТІЛЬКИ валідним JSON масивом, без будь-якого іншого тексту до або після:
[{"title":"...","author":"...","originalTitle":"...","reason":"..."},...]
Правила:
- title: назва книги українською мовою
- author: ім'я автора латиницею (англійською транслітерацією)
- originalTitle: оригінальна назва книги англійською або мовою оригіналу (для пошуку обкладинки)
- reason: 1-2 речення ВИКЛЮЧНО українською мовою (кирилиця), без жодних китайських, японських чи інших іноземних символів
ЗАБОРОНЕНО: не включай жодної книги російського автора або написаної російською мовою. Це суворо заборонено.
Поле reason пиши ЛИШЕ українською кирилицею. Жодних ієрогліфів.`;
