import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN } from "../types";
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Download,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import StartECRNWizard from "../components/StartECRNWizard";
import CloseECRNModal from "../components/CloseECRNModal";
import { useNavigate } from "react-router-dom";
import { exportECRNSummary } from "../utils/excelExport";
import {
  getDocumentEcrnIdFromPath,
  mergeEcrnCounts,
  normalizePriority,
  sortEcrnsByPriorityAndDeadline,
  type TrackerDocument,
} from "../services/trackerData";

interface StatCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  colorClass: string;
}

function StatCard({ title, count, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:translate-y-[-2px]">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{count}</h3>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [rawEcrns, setRawEcrns] = useState<ECRN[]>([]);
  const [documents, setDocuments] = useState<TrackerDocument[]>([]);
  const [loadingEcrns, setLoadingEcrns] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showStartWizard, setShowStartWizard] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeEcrns = onSnapshot(query(collection(db, "ecrns")), (snapshot) => {
      setRawEcrns(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ECRN)));
      setLoadingEcrns(false);
    });

    const unsubscribeDocuments = onSnapshot(
      query(collectionGroup(db, "documents")),
      (snapshot) => {
        setDocuments(
          snapshot.docs.map(
            (docSnapshot) =>
              ({
                id: docSnapshot.id,
                ecrnId: getDocumentEcrnIdFromPath(docSnapshot.ref.path),
                ...docSnapshot.data(),
              }) as TrackerDocument,
          ),
        );
        setLoadingDocuments(false);
      },
    );

    return () => {
      unsubscribeEcrns();
      unsubscribeDocuments();
    };
  }, []);

  const loading = loadingEcrns || loadingDocuments;
  const allEcrnsForExport = useMemo(
    () => mergeEcrnCounts(rawEcrns, documents),
    [documents, rawEcrns],
  );
  const ecrns = useMemo(
    () =>
      allEcrnsForExport
        .filter((ecrn) => ecrn.status === "Running" || ecrn.status === "Pending")
        .sort(sortEcrnsByPriorityAndDeadline),
    [allEcrnsForExport],
  );
  const stats = useMemo(
    () => ({
      Running: allEcrnsForExport.filter((ecrn) => ecrn.status === "Running").length,
      Completed: allEcrnsForExport.filter((ecrn) => ecrn.status === "Completed").length,
      "With PE": allEcrnsForExport.filter((ecrn) => ecrn.status === "With PE").length,
      "Query Hold": allEcrnsForExport.filter((ecrn) => ecrn.status === "Query Hold").length,
      Pending: allEcrnsForExport.filter((ecrn) => ecrn.status === "Pending").length,
    }),
    [allEcrnsForExport],
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time overview of Engineering Change Requests</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => exportECRNSummary(allEcrnsForExport)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-95"
            title="Export to Excel"
          >
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setShowCloseModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <CheckCircle size={18} className="text-emerald-500" />
            Close ECRN
          </button>
          <button 
            onClick={() => setShowStartWizard(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Plus size={18} />
            Start ECRN
          </button>
        </div>
      </div>

      {showStartWizard && (
        <StartECRNWizard onClose={() => setShowStartWizard(false)} />
      )}

      {showCloseModal && (
        <CloseECRNModal onClose={() => setShowCloseModal(false)} />
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Pending" 
          count={stats.Pending} 
          icon={Clock} 
          colorClass="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400" 
        />
        <StatCard 
          title="Running" 
          count={stats.Running} 
          icon={TrendingUp} 
          colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Completed" 
          count={stats.Completed} 
          icon={CheckCircle} 
          colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          title="With PE" 
          count={stats["With PE"]} 
          icon={HelpCircle} 
          colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" 
        />
        <StatCard 
          title="Query Hold" 
          count={stats["Query Hold"]} 
          icon={AlertCircle} 
          colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" 
        />
      </div>

      {/* Running ECRNs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Currently Running ECRNs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">ECRN Number</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Priority</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Deadline</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">PE Name</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Documents</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Progress</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ecrns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 dark:text-slate-500 italic">
                    {loading ? "Loading ECRNs..." : "No running ECRNs at the moment."}
                  </td>
                </tr>
              ) : (
                ecrns.map((ecrn) => {
                  const priorityLabel = normalizePriority(ecrn.priority);

                  return (
                  <tr 
                    key={ecrn.id} 
                    onClick={() => navigate(`/ecrn/${ecrn.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{ecrn.ecrnNumber}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        priorityLabel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {priorityLabel}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">
                      {ecrn.deadline ? ecrn.deadline.toDate().toLocaleDateString() : "—"}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">{ecrn.productEngineerName}</td>
                    <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">
                      {ecrn.completedDocuments} / {ecrn.totalDocuments}
                    </td>
                    <td className="px-8 py-5 min-w-[140px]">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm shadow-blue-500/30"
                          style={{
                            width: `${Math.round(
                              (ecrn.completedDocuments / (ecrn.totalDocuments || 1)) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                        {Math.round(
                          (ecrn.completedDocuments / (ecrn.totalDocuments || 1)) * 100,
                        )}
                        % COMPLETE
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors translate-x-[-10px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
