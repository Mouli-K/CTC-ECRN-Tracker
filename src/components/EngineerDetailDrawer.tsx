import { useEffect, useState } from "react";
import { doc, onSnapshot, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Engineer, Document } from "../types";
import { X, Clock, FileText, ChevronRight, User as UserIcon, Mail, Hash } from "lucide-react";

interface EngineerDetailDrawerProps {
  engineerUid: string;
  onClose: () => void;
}

export default function EngineerDetailDrawer({ engineerUid, onClose }: EngineerDetailDrawerProps) {
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [activeDocs, setActiveDocs] = useState<Document[]>([]);
  const [completedDocs, setCompletedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch engineer basic info
    const unsubEng = onSnapshot(doc(db, "engineers", engineerUid), (snap) => {
      if (snap.exists()) setEngineer(snap.data() as Engineer);
    });

    // Fetch all documents assigned to this engineer across all ECRNs
    // We use collectionGroup for "documents" subcollections
    const fetchDocs = async () => {
      try {
        const docsQuery = query(
          collectionGroup(db, "documents"),
          where("assignedEngineerUid", "==", engineerUid)
        );
        const snapshot = await getDocs(docsQuery);
        const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document));
        
        setActiveDocs(allDocs.filter(d => d.status !== "Completed"));
        setCompletedDocs(allDocs.filter(d => d.status === "Completed"));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching engineer docs:", err);
        setLoading(false);
      }
    };

    fetchDocs();
    return () => unsubEng();
  }, [engineerUid]);

  if (!engineer && !loading) return null;

  const totalEst = completedDocs.reduce((acc, d) => acc + d.estimatedHours, 0);
  const totalAct = completedDocs.reduce((acc, d) => acc + (d.actualHours || 0), 0);

  const DocItem = ({ doc }: { doc: Document }) => (
    <div 
      className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <div>
          <h5 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{doc.documentNumber}</h5>
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            doc.status === 'Completed' ? 'text-emerald-500' : 'text-blue-500'
          }`}>{doc.status}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {doc.status === 'Completed' ? `${doc.actualHours}h` : `${doc.estimatedHours}h est`}
          </p>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[110]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-[120] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Clock className="animate-spin text-slate-300" size={32} />
          </div>
        ) : engineer ? (
          <div className="p-10 space-y-12">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <UserIcon size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{engineer.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Design Engineer</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <Hash size={14} className="text-blue-500" />
                  {engineer.employeeId}
                </div>
              </div>
              <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <Mail size={14} className="text-blue-500" />
                  {engineer.email}
                </div>
              </div>
            </div>

            {/* Workload Summary */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/20">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Efficiency Overview</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-3xl font-black mb-1">{totalEst}h</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimated</p>
                </div>
                <div>
                  <p className="text-3xl font-black mb-1 text-blue-400">{totalAct}h</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Actual</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-xs font-bold text-slate-300">{engineer.completedDocuments} Documents Closed</span>
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {totalAct > 0 ? `${Math.round((totalEst / totalAct) * 100)}% Productivity` : '—'}
                </span>
              </div>
            </div>

            {/* Active Assignments */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Active Assignments</h4>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg">
                  {activeDocs.length}
                </span>
              </div>
              <div className="space-y-3">
                {activeDocs.length > 0 ? (
                  activeDocs.map(d => <DocItem key={d.id} doc={d} />)
                ) : (
                  <p className="p-10 text-center text-sm font-medium text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    No active documents assigned.
                  </p>
                )}
              </div>
            </div>

            {/* Completed Work */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">History Log</h4>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg">
                  {completedDocs.length}
                </span>
              </div>
              <div className="space-y-3 pb-10">
                {completedDocs.map(d => <DocItem key={d.id} doc={d} />)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
