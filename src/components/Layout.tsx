import { Outlet } from "react-router-dom";
import Header from "./Header";
import NavTabs from "./NavTabs";

interface LayoutProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({ isDarkMode, toggleDarkMode }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div className="container mx-auto px-8 py-8">
        <div className="flex justify-start">
          <NavTabs />
        </div>
        <main className="mt-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
