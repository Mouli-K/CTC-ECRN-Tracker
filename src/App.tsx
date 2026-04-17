import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PeoplePage from "./pages/PeoplePage";
import ECRNPage from "./pages/ECRNPage";
import ECRNDetailPage from "./pages/ECRNDetailPage";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-28 bg-slate-900 dark:bg-white flex items-center justify-center rounded-lg animate-pulse">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900">Emerson</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Securely Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/home" replace /> : <LoginPage />} 
        />
        <Route 
          path="/" 
          element={user ? <Layout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="ecrn" element={<ECRNPage />} />
          <Route path="ecrn/:id" element={<ECRNDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
