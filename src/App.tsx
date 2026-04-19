import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PeoplePage from "./pages/PeoplePage";
import ECRNPage from "./pages/ECRNPage";
import ECRNDetailPage from "./pages/ECRNDetailPage";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { runIntegritySyncOnce } from "./services/trackerWorkflow";
import emersonLogo from "./assets/emerson-logo.png";

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
    if (!user) {
      return;
    }

    void runIntegritySyncOnce().catch((error) => {
      console.error("Failed to reconcile tracker counters:", error);
    });
  }, [user]);

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
          <div className="h-14 w-36 bg-white dark:bg-slate-950 flex items-center justify-center rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-lg">
             <img src={emersonLogo} alt="Emerson Logo" className="h-8 w-auto object-contain" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Securely Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/home" replace /> : <LoginPage />} 
        />

        {/* Protected Routes Wrapper */}
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
