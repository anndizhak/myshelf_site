export const Header = ({ tab, setTab, showSearch, searchQuery, setSearchQuery, onSearch, onAuthClick, currentUser, onLogout, onProfileClick }) => (  <div className="header">
    <div className="header-top">
      <div className="logo">
        MY S<span className="logo-outline">H</span>ELF
      </div>

      {currentUser ? (
        <div className="user-badge" onClick={onProfileClick} title="Профіль">
        <span className="user-nickname">@{currentUser.nickname || currentUser.name}</span>
          <div className="user-avatar">
            {currentUser.photo
              ? <img src={currentUser.photo} alt="avatar" />
              : <span>{(currentUser.nickname || currentUser.name || "?")[0].toUpperCase()}</span>
            }
          </div>
        </div>
      ) : (
        <button className="login-btn" onClick={onAuthClick}>Увійти / Зареєструватися</button>
      )}
    </div>

    <div className="branch-divider" />
    <div className="nav">
      <button className={`nav-tab ${tab === 0 ? "active" : ""}`} onClick={() => setTab(0)}>
        Нова підбірка
      </button>
      <span className="nav-sep">|</span>
      <button className={`nav-tab ${tab === 1 ? "active" : ""}`} onClick={() => setTab(1)}>
        Топові пропозиції
      </button>
      <span className="nav-sep">|</span>
      <button className={`nav-tab ${tab === 2 ? "active" : ""}`} onClick={() => setTab(2)}>
        Обрати книгу за настроєм
      </button>
      <button className="filter-btn">Фільтри</button>
    </div>

    {showSearch && (
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Пошук книги за назвою або автором..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(searchQuery)}
        />
        <button className="search-btn" onClick={() => onSearch(searchQuery)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
    )}
  </div>
);