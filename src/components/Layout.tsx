import { Outlet } from "react-router-dom";
import Header from "./Header";
import NavTabs from "./NavTabs";

interface LayoutProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({ isDarkMode, toggleDarkMode }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div className="container mx-auto px-4 py-6">
        <NavTabs />
        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
