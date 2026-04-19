import { Sun, Moon, LogOut } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import emersonLogo from "../assets/emerson-logo.png";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({ isDarkMode, toggleDarkMode }: HeaderProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              CTC <span className="text-blue-600 dark:text-blue-400">—</span> ECRN Tracker
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all duration-200 border border-slate-200 dark:border-slate-700 shadow-sm"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="h-10 w-28 flex items-center justify-center">
               <img src={emersonLogo} alt="Emerson Logo" className="h-7 w-auto object-contain dark:brightness-0 dark:invert transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/50">
        <div className="container mx-auto px-6 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chennai Technology Center <span className="mx-2 text-slate-300 dark:text-slate-700">|</span> Engineering Systems
          </span>
        </div>
      </div>
    </header>
  );
}
