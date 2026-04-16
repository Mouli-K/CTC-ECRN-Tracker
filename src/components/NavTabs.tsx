import { NavLink } from "react-router-dom";
import { Home, Users, FileText } from "lucide-react";

export default function NavTabs() {
  const tabs = [
    { name: "Home", path: "/home", icon: Home },
    { name: "People", path: "/people", icon: Users },
    { name: "ECRN", path: "/ecrn", icon: FileText },
  ];

  return (
    <nav className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl w-fit transition-all duration-300 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-250 ${
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 translate-y-[-1px]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-750"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : ""} />
              {tab.name}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
