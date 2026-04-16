import { Sun, Moon } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({ isDarkMode, toggleDarkMode }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-medium tracking-tight">CTC — ECRN Tracker</h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">Chennai Technology Center</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500 rounded font-bold uppercase tracking-widest">
            Emerson
          </div>
        </div>
      </div>
    </header>
  );
}
