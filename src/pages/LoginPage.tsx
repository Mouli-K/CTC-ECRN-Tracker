import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Lock, User, ShieldCheck } from "lucide-react";
import emersonLogo from "../assets/emerson-logo.png";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = `${employeeId}@ctc-tracker.local`;

    try {
      if (isFirstTime) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/home");
    } catch (err: unknown) {
      console.error(err);
      const errorCode =
        typeof err === "object" && err && "code" in err ? String(err.code) : "";

      if (errorCode === 'auth/user-not-found' && !isFirstTime) {
        setError("Account not found. Use 'First Time Setup' to initialize.");
      } else if (errorCode === 'auth/email-already-in-use' && isFirstTime) {
        setError("Account already exists. Please sign in.");
      } else {
        setError("Authentication failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="w-full max-w-[480px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white dark:border-slate-800 p-8 md:p-12 relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="h-16 w-40 bg-white dark:bg-slate-950 flex items-center justify-center rounded-2xl shadow-xl mb-10 transform transition-transform hover:scale-105 border border-slate-200/80 dark:border-slate-800">
             <img src={emersonLogo} alt="Emerson Logo" className="h-9 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            {isFirstTime ? "Initialize" : "Sign In"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            CTC — ECRN Tracker
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                placeholder="Ex: 123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {isFirstTime ? "Set Password" : "Password"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isFirstTime && (
             <div className="space-y-2 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded-2xl animate-in zoom-in duration-300 text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-blue-500/30 disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
          >
            {loading ? "Processing..." : isFirstTime ? "Create Account" : "Access Tracker"}
          </button>
        </form>

        <div className="mt-10 flex justify-center">
          <button 
            onClick={() => setIsFirstTime(!isFirstTime)}
            className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-[0.2em] py-2 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {isFirstTime ? "Already have an account?" : "First Time Access?"}
          </button>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Chennai Technology Center <span className="mx-2 text-slate-200 dark:text-slate-700">|</span> Systems
          </p>
        </div>
      </div>
    </div>
  );
}
