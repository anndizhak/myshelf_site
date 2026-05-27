import { useState } from "react";

const GENRES = [
  "Фентезі/фантастика", "Нонфікшн", "Любовні романи",
  "Детективи", "Пригоди", "Жахи/трилери",
  "Поезія", "Проза", "Довідникова література", "Іншомовна література"
];

export const AuthModal = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState("main");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [goal, setGoal] = useState(30);
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleRegister = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, nickname, age, genres: selectedGenres, goal, bio })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
      onClose();
    } catch {
      setError("Помилка сервера");
    }
  };

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
      onClose();
    } catch {
      setError("Помилка сервера");
    }
  };

  return (
    <div className="modal-fullscreen">
      <img src="/images/modal-bg.jpg" className="modal-deco-bottom" />

      <div className="modal-logo">
        MY S<span style={{ WebkitTextStroke: "2px #ebc213", color: "transparent" }}>H</span>ELF
      </div>

      <div className={`modal-box ${mode === "register" && step === 4 ? "modal-box-wide" : ""}`}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* ── Головне меню ── */}
        {mode === "main" && (
          <>
            <button className="modal-btn-primary" onClick={() => { setMode("register"); setStep(1); }}>
              Зареєструватися!
            </button>
            <p className="modal-hint">Вже маєте акаунт?</p>
            <button className="modal-btn-secondary" onClick={() => setMode("login")}>
              Увійти
            </button>
          </>
        )}

        {/* ── Вхід ── */}
        {mode === "login" && (
          <>
            <h2 className="modal-title">Вхід</h2>
            <input className="modal-input" type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input className="modal-input" type="password" placeholder="Пароль" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            {error && <p style={{ color: "red", fontSize: ".85rem" }}>{error}</p>}
            <button className="modal-btn-primary" onClick={handleLogin}>Увійти</button>
            <button className="modal-back" onClick={() => { setMode("main"); setError(""); }}>← Назад</button>
          </>
        )}

        {/* ── Крок 1: email + пароль ── */}
        {mode === "register" && step === 1 && (
          <>
            <h2 className="modal-title">Реєстрація</h2>
            <input className="modal-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="modal-input" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p style={{ color: "red", fontSize: ".85rem" }}>{error}</p>}
            <div className="modal-nav">
              <button className="modal-back" onClick={() => { setMode("main"); setError(""); }}>← Назад</button>
              <button className="modal-btn-next" onClick={() => {
                if (!email || !password) { setError("Заповніть всі поля"); return; }
                setError(""); setStep(2);
              }}>Далі →</button>
            </div>
          </>
        )}

        {/* ── Крок 2: жанри ── */}
        {mode === "register" && step === 2 && (
          <>
            <h2 className="modal-title">Оберіть жанри, які вам подобаються:</h2>
            <div className="genre-grid">
              {GENRES.map(g => (
                <button
                  key={g}
                  className={`genre-btn ${selectedGenres.includes(g) ? "selected" : ""}`}
                  onClick={() => toggleGenre(g)}
                >{g}</button>
              ))}
            </div>
            <div className="modal-nav">
              <button className="modal-back" onClick={() => setStep(1)}>← Назад</button>
              <button className="modal-btn-next" onClick={() => setStep(3)}>Далі →</button>
            </div>
          </>
        )}

        {/* ── Крок 3: ціль ── */}
        {mode === "register" && step === 3 && (
          <>
            <h2 className="modal-title">Вкажіть ціль на день (к-сть прочитаних сторінок):</h2>
            <div className="goal-display">{goal}</div>
            <input
              type="range" min="5" max="200" step="5" value={goal}
              onChange={e => setGoal(Number(e.target.value))}
              className="goal-slider"
            />
            <div className="modal-nav">
              <button className="modal-back" onClick={() => setStep(2)}>← Назад</button>
              <button className="modal-btn-next" onClick={() => setStep(4)}>Далі →</button>
            </div>
          </>
        )}

        {/* ── Крок 4: профіль ── */}
        {mode === "register" && step === 4 && (
          <>
            <div className="profile-form">
              <div className="profile-form-left">
                <label className="modal-label">Ваше ім'я</label>
                <input className="modal-input" type="text" placeholder="Ім'я" value={name} onChange={e => setName(e.target.value)} />
                <label className="modal-label">Додайте нікнейм</label>
                <input className="modal-input" type="text" placeholder="@nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
                <label className="modal-label">Ваш вік:</label>
                <input className="modal-input" type="number" placeholder="Вік" value={age} onChange={e => setAge(e.target.value)} />
                <label className="modal-label">Додайте біографію/улюблену цитату</label>
                <textarea className="modal-textarea" placeholder="Біографія..." value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="profile-photo-box" onClick={() => document.getElementById("photo-input").click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="фото" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
                  : <span>Клікніть, щоб додати фото...</span>
                }
                <input id="photo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              </div>
            </div>
            {error && <p style={{ color: "red", fontSize: ".85rem" }}>{error}</p>}
            <div className="modal-nav" style={{ marginTop: "auto", paddingTop: "16px" }}>
                <button className="modal-back" onClick={() => setStep(3)}>← Назад</button>
                <button className="modal-btn-next" onClick={handleRegister}>Готово!</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};