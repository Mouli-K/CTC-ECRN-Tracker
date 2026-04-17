import { useEffect, useState } from "react";
import { collection, onSnapshot, query, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN, ECRNStatus } from "../types";
import { Search, Filter, Clock, CheckCircle2, HelpCircle, AlertCircle, User, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportECRNSummary } from "../utils/excelExport";

export default function ECRNPage() {
  const navigate = useNavigate();
  const [ecrns, setEcrns] = useState<ECRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ECRNStatus | 'All'>("Running");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "ecrns"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEcrns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ECRN)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (ecrnId: string, newStatus: ECRNStatus) => {
    try {
      const ecrnRef = doc(db, "ecrns", ecrnId);
      const updates: any = { status: newStatus };
      if (newStatus === "Completed") updates.closedAt = serverTimestamp();
      await updateDoc(ecrnRef, updates);
    } catch (err) {
      console.error("Error updating ECRN status:", err);
      alert("Failed to update status.");
    }
  };

  const filteredEcrns = ecrns.filter(e => {
    const matchesTab = activeTab === 'All' || e.status === activeTab;
    const matchesSearch = e.ecrnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.productEngineerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs: { label: string, value: ECRNStatus | 'All', icon: any, color: string }[] = [
    { label: "Running", value: "Running", icon: Clock, color: "text-blue-500" },
    { label: "With PE", value: "With PE", icon: HelpCircle, color: "text-purple-500" },
    { label: "Query Hold", value: "Query Hold", icon: AlertCircle, color: "text-amber-500" },
    { label: "Completed", value: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "All", value: "All", icon: Filter, color: "text-slate-400" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ECRN Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Manage lifecycle and approvals of change notices</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => exportECRNSummary(filteredEcrns)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} />
            Export List
          </button>
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search ECRN or PE..."
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-[24px] w-fit border border-slate-200/50 dark:border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === tab.value
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-slate-950/50 scale-[1.02]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.value ? tab.color : ""} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ECRN List */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ECRN Number</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Docs</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Engineer</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">Loading registry...</td>
                </tr>
              ) : filteredEcrns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No matching ECRNs found.</td>
                </tr>
              ) : (
                filteredEcrns.map((e) => (
                  <tr 
                    key={e.id} 
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td 
                      onClick={() => navigate(`/ecrn/${e.id}`)}
                      className="px-8 py-5 font-black text-slate-900 dark:text-white tracking-tight"
                    >
                      {e.ecrnNumber}
                    </td>
                    <td onClick={() => navigate(`/ecrn/${e.id}`)} className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        e.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/30' : 
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30'
                      }`}>
                        {e.priority}
                      </span>
                    </td>
                    <td onClick={() => navigate(`/ecrn/${e.id}`)} className="px-8 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                         <span className="text-sm font-black text-slate-700 dark:text-slate-200">{e.completedDocuments} / {e.totalDocuments}</span>
                         <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-blue-600" style={{ width: `${(e.completedDocuments / e.totalDocuments) * 100}%` }} />
                         </div>
                      </div>
                    </td>
                    <td onClick={() => navigate(`/ecrn/${e.id}`)} className="px-8 py-5">
                       <div className="flex items-center gap-2">
                         <User size={14} className="text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{e.productEngineerName}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <select 
                         value={e.status}
                         onChange={(opt) => handleStatusChange(e.id, opt.target.value as ECRNStatus)}
                         className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all cursor-pointer"
                       >
                         <option value="Running">Running</option>
                         <option value="With PE">With PE</option>
                         <option value="Query Hold">Query Hold</option>
                         <option value="Completed">Completed</option>
                       </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
