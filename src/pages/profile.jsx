import { useState } from "react";

const GENRES = [
  "Фентезі/фантастика", "Нонфікшн", "Любовні романи",
  "Детективи", "Пригоди", "Жахи/трилери",
  "Поезія", "Проза", "Довідникова література", "Іншомовна література"
];

export const Profile = ({ user, onClose, onLogout, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [age, setAge] = useState(user.age || "");
  const [bio, setBio] = useState(user.bio || "");
  const [genres, setGenres] = useState(user.genres || []);
  const [photo, setPhoto] = useState(user.photo || null);
  const [photoPreview, setPhotoPreview] = useState(user.photo || null);
  const [saving, setSaving] = useState(false);

  const toggleGenre = (genre) => {
    setGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, nickname, age, bio, genres, photo })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (onUpdate) onUpdate(data.user);
        setPhotoPreview(photo);
        setEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (editing) {
    return (
      <div className="profile-fullscreen">
        <div className="profile-edit-card">
          <div className="profile-edit-header">
            <div className="profile-logo">
              MY S<span className="logo-outline">H</span>ELF
            </div>
          </div>

          <div className="profile-edit-body">
            <div className="profile-edit-left">
              <label className="modal-label">Ваше ім'я</label>
              <input className="modal-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я" />
              <label className="modal-label">Нікнейм</label>
              <input className="modal-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="@nickname" />
              <label className="modal-label">Вік</label>
              <input className="modal-input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Вік" />
              <label className="modal-label">Біографія/улюблена цитата</label>
              <textarea className="modal-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Біографія..." />
            </div>

            <div className="profile-edit-right">
              <div className="profile-photo-edit" onClick={() => document.getElementById("edit-photo-input").click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="фото" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
                  : <span>Клікніть, щоб додати фото...</span>
                }
                <input id="edit-photo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              </div>

              <div className="profile-label" style={{ marginTop: "16px" }}>Жанри:</div>
              <div className="genre-grid" style={{ marginTop: "8px" }}>
                {GENRES.map(g => (
                  <button key={g} className={`genre-btn ${genres.includes(g) ? "selected" : ""}`} onClick={() => toggleGenre(g)}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-edit-actions">
            <button className="profile-logout" onClick={() => setEditing(false)}>← Назад</button>
            <button className="modal-btn-next" onClick={handleSave} disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page" onClick={onClose}>
        <div className="profile-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="profile-header">
        <div className="profile-logo">
            MY S<span className="profile-logo-outline">H</span>ELF
        </div>
        <div className="profile-info">
            <div className="profile-nickname">@{user.nickname}</div>
            <div className="profile-name">{user.name}, {user.age}</div>
        </div>
        <div className="profile-photo-view">
            {user.photo
            ? <img src={user.photo} alt="фото" />
            : <span>Фото</span>
            }
        </div>
        </div>
        <div style={{ backgroundColor: "var(--cream2)", borderRadius: "12px", marginTop: "-120px", width: "67%", display: "inline-block" }}>
            <img src="/images/profile-banner.png" style={{ width: "100%", maxHeight: "100px", objectFit: "contain", display: "block" }} />
        </div>
        <div className="profile-genres">
          <div className="profile-label">Улюблені жанри:</div>
          <div className="profile-genre-list">
            {(user.genres || []).map(g => (
              <span key={g} className="genre-tag">{g}</span>
            ))}
          </div>
        </div>

        <div className="profile-bio-label">Біографія/улюблена цитата</div>
        <div className="profile-bio-box">{user.bio}</div>

        <div className="profile-actions">
          <button className="profile-logout" onClick={onLogout}>--Вийти з акаунту</button>
          <button className="modal-btn-next" onClick={() => setEditing(true)}>Редагувати</button>
        </div>
      </div>
    </div>
  );
};