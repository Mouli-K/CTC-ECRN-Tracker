import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Lock, User, ShieldCheck } from "lucide-react";

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
        // Create user for the first time
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/home");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' && !isFirstTime) {
        setError("Account not found. If this is your first time, enable 'First Time Setup'.");
      } else if (err.code === 'auth/email-already-in-use' && isFirstTime) {
        setError("Account already exists. Please sign in normally.");
      } else {
        setError("The credentials you entered don't match our records.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 p-10 relative z-10 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-12 w-32 bg-slate-900 dark:bg-white flex items-center justify-center rounded-xl shadow-lg mb-8">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900">Emerson</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isFirstTime ? "Secure Account" : "Welcome back"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">CTC — ECRN Tracker</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                placeholder="Ex: 123456"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
              {isFirstTime ? "Set Password" : "Password"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isFirstTime && (
             <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-500/25 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Processing..." : isFirstTime ? "Initialize Account" : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => setIsFirstTime(!isFirstTime)}
            className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
          >
            {isFirstTime ? "Back to Login" : "First Time Setup?"}
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Chennai Technology Center — Engineering Systems
        </p>
      </div>
    </div>
  );
}
