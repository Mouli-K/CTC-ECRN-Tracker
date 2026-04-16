import { NavLink } from "react-router-dom";

export default function NavTabs() {
  const tabs = [
    { name: "Home", path: "/home" },
    { name: "People", path: "/people" },
    { name: "ECRN", path: "/ecrn" },
  ];

  return (
    <nav className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-[64px] z-40">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              isActive
                ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`
          }
        >
          {tab.name}
        </NavLink>
      ))}
    </nav>
  );
}
