# MY SHELF 📚

A full-stack book discovery web app built with React and Node.js. Browse Ukrainian bestsellers and new releases scraped from Yakaboo.ua, get AI-powered book recommendations based on your mood, and manage a personal reading profile.

---

## Features

- **Bestsellers & New Releases** — real-time book data fetched from Yakaboo.ua with cover images
- **Mood-based AI Recommendations** — describe your mood and get 15 personalized book suggestions powered by Groq (Llama 3.3 70B); no Russian-language books included
- **User Authentication** — register and log in with email and password (JWT + bcrypt)
- **Reading Profile** — set your name, genres, reading goal, bio, and profile photo
- **Book Detail View** — title, author, description, page count, year, price

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Vanilla CSS with custom design system

**Backend**
- Node.js + Express 5
- PostgreSQL via Supabase
- JWT authentication, bcryptjs password hashing

**AI & Data**
- [Groq API](https://groq.com) — Llama 3.3 70B for mood-based recommendations
- [Yakaboo.ua](https://www.yakaboo.ua) — book data scraped with Puppeteer
- Google Books API & Open Library — cover images

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with a `users` table
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
git clone https://github.com/your-username/my-shelf.git
cd my-shelf
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

### Database Setup

Run this in your Supabase SQL editor to create the users table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT '',
  nickname TEXT DEFAULT '',
  age TEXT DEFAULT '',
  genres TEXT[] DEFAULT '{}',
  goal INTEGER DEFAULT 30,
  bio TEXT DEFAULT '',
  photo TEXT
);
```

### Running the App

Start the backend and frontend in two separate terminals:

```bash
# Terminal 1 — backend (port 3001)
npm run server

# Terminal 2 — frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Refresh Book Data

To re-scrape current bestsellers and new releases from Yakaboo.ua:

```bash
node scraper.js
```

This takes several minutes as it fetches cover images for each book via Puppeteer.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with hot reload |
| `npm run server` | Start Express backend on port 3001 |
| `npm run build` | Build production bundle to `/dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
MY_SHELF/
├── src/
│   ├── api/          # Groq and Open Library API clients
│   ├── components/   # Header, BookCard, AuthModal, Spinner
│   ├── hooks/        # useBooks — fetches book data from backend
│   ├── pages/        # Home, BookDetail, MoodPicker, Profile
│   └── styles/       # Global CSS
├── data/
│   ├── books-top.json    # Cached bestsellers
│   ├── books-new.json    # Cached new releases
│   └── covers/           # Downloaded cover images
├── server.js         # Express API server
└── scraper.js        # Puppeteer-based Yakaboo scraper
```

---

## License

MIT
