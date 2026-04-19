import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Document, ECRN, Engineer } from "../types";
import { X, Clock, FileText, ChevronRight, User as UserIcon, Mail, Hash } from "lucide-react";
import { getDocumentEcrnIdFromPath } from "../services/trackerData";

interface EngineerDetailDrawerProps {
  engineerUid: string;
  onClose: () => void;
}

interface EngineerDocument extends Document {
  ecrnId: string;
}

export default function EngineerDetailDrawer({ engineerUid, onClose }: EngineerDetailDrawerProps) {
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [assignedDocs, setAssignedDocs] = useState<EngineerDocument[]>([]);
  const [ecrnsById, setEcrnsById] = useState<Record<string, ECRN>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeEngineer = onSnapshot(doc(db, "engineers", engineerUid), (snapshot) => {
      if (snapshot.exists()) {
        setEngineer({ uid: snapshot.id, ...snapshot.data() } as Engineer);
      }
    });

    const unsubscribeEcrns = onSnapshot(collection(db, "ecrns"), (snapshot) => {
      setEcrnsById(
        Object.fromEntries(
          snapshot.docs.map((docSnapshot) => [
            docSnapshot.id,
            { id: docSnapshot.id, ...docSnapshot.data() } as ECRN,
          ]),
        ),
      );
    });

    const docsQuery = query(
      collectionGroup(db, "documents"),
      where("assignedEngineerUid", "==", engineerUid),
    );
    const unsubscribeDocuments = onSnapshot(
      docsQuery,
      (snapshot) => {
        setAssignedDocs(
          snapshot.docs.map(
            (docSnapshot) =>
              ({
                id: docSnapshot.id,
                ecrnId: getDocumentEcrnIdFromPath(docSnapshot.ref.path),
                ...docSnapshot.data(),
              }) as EngineerDocument,
          ),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching engineer docs:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeEngineer();
      unsubscribeEcrns();
      unsubscribeDocuments();
    };
  }, [engineerUid]);

  const activeDocs = useMemo(
    () =>
      assignedDocs.filter((document) => {
        const ecrnStatus = ecrnsById[document.ecrnId]?.status;
        return document.status !== "Completed" && ecrnStatus !== "Completed";
      }),
    [assignedDocs, ecrnsById],
  );
  const completedDocs = useMemo(
    () => assignedDocs.filter((document) => document.status === "Completed"),
    [assignedDocs],
  );

  if (!engineer && !loading) {
    return null;
  }

  const totalEst = completedDocs.reduce((accumulator, document) => accumulator + document.estimatedHours, 0);
  const totalAct = completedDocs.reduce(
    (accumulator, document) => accumulator + (document.actualHours || 0),
    0,
  );

  const DocItem = ({ document }: { document: EngineerDocument }) => {
    const parentEcrn = ecrnsById[document.ecrnId];

    return (
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <h5 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{document.documentNumber}</h5>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {parentEcrn?.ecrnNumber || "ECRN"} · {document.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {document.status === "Completed" ? `${document.actualHours}h` : `${document.estimatedHours}h est`}
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    );
  };

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
                  <span className="text-xs font-bold text-slate-300">{completedDocs.length} Documents Closed</span>
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {totalAct > 0 ? `${Math.round((totalEst / totalAct) * 100)}% Productivity` : "—"}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Active Assignments</h4>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg">
                  {activeDocs.length}
                </span>
              </div>
              <div className="space-y-3">
                {activeDocs.length > 0 ? (
                  activeDocs.map((document) => <DocItem key={document.id} document={document} />)
                ) : (
                  <p className="p-10 text-center text-sm font-medium text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    No active documents assigned.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">History Log</h4>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg">
                  {completedDocs.length}
                </span>
              </div>
              <div className="space-y-3 pb-10">
                {completedDocs.map((document) => (
                  <DocItem key={document.id} document={document} />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
