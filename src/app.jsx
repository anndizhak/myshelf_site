import { useState, useEffect } from "react";
import { Header }     from "./components/header";
import { Home }       from "./pages/home";
import { BookDetail } from "./pages/bookdetail";
import { MoodPicker } from "./pages/moodpicker";
import { AuthModal }  from "./components/authmodal";
import { Profile }    from "./pages/profile";
import { useBooks }   from "./hooks/usebooks";
import "./styles/global.css";

export default function App() {
  const [tab,          setTab]          = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAuth,     setShowAuth]     = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [currentUser,  setCurrentUser]  = useState(null);

  const { newBooks, topBooks, loading } = useBooks();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setShowProfile(false);
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSelectedBook(null);
  };

  const currentBooks = tab === 0 ? newBooks : topBooks;

  if (selectedBook) {
    return (
      <div className="app">
        <Header tab={tab} setTab={handleTabChange} showSearch={false}
          onAuthClick={() => setShowAuth(true)} currentUser={currentUser}
          onLogout={handleLogout} onProfileClick={() => setShowProfile(true)} />
        <BookDetail book={selectedBook} onBack={() => setSelectedBook(null)} />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
        {showProfile && currentUser && (
          <Profile user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdate={(updatedUser) => setCurrentUser(updatedUser)}/>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <Header tab={tab} setTab={handleTabChange} showSearch={tab !== 2}
        onAuthClick={() => setShowAuth(true)} currentUser={currentUser}
        onLogout={handleLogout} onProfileClick={() => setShowProfile(true)} />
      {tab === 2 ? <MoodPicker /> : <Home books={currentBooks} loading={loading} onSelectBook={setSelectedBook} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
      {showProfile && currentUser && (
        <Profile user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdate={(updatedUser) => setCurrentUser(updatedUser)}/>
      )}
    </div>
  );
}