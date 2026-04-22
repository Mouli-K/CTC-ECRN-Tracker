import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN } from "../types";
import { useUserRole } from "../contexts/UserRoleContext";
import DocumentDrawer from "../components/DocumentDrawer";
import { getDocumentEcrnIdFromPath } from "../services/trackerData";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import type { TrackerDocument } from "../services/trackerData";

const STATUS_COLORS: Record<string, string> = {
  "WIP": "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800/30",
  "Primary Check": "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800/30",
  "Feedback from Primary Check": "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800/30",
  "Secondary Check": "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 border-violet-100 dark:border-violet-800/30",
  "Feedback from Secondary Check": "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800/30",
  "With PE": "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 border-teal-100 dark:border-teal-800/30",
  "Feedback from PE": "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800/30",
  "Completed": "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30",
};

const isFeedbackStage = (status: string) => status.toLowerCase().startsWith("feedback");

export default function EngineerDashboard() {
  const { engineer } = useUserRole();
  const [allDocuments, setAllDocuments] = useState<TrackerDocument[]>([]);
  const [ecrns, setEcrns] = useState<Record<string, ECRN>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<{ ecrnId: string; docId: string } | null>(null);

  useEffect(() => {
    const unsubscribeEcrns = onSnapshot(query(collection(db, "ecrns")), (snapshot) => {
      const ecrnMap: Record<string, ECRN> = {};
      snapshot.docs.forEach((d) => {
        ecrnMap[d.id] = { id: d.id, ...d.data() } as ECRN;
      });
      setEcrns(ecrnMap);
    });

    const unsubscribeDocs = onSnapshot(
      query(collectionGroup(db, "documents")),
      (snapshot) => {
        setAllDocuments(
          snapshot.docs.map((d) => ({
            id: d.id,
            ecrnId: getDocumentEcrnIdFromPath(d.ref.path),
            ...d.data(),
          } as TrackerDocument))
        );
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEcrns();
      unsubscribeDocs();
    };
  }, []);

  const myDocs = useMemo(() => {
    if (!engineer) return [];
    return allDocuments.filter(
      (d) => d.assignedEngineerUid === engineer.uid && d.status !== "Completed"
    );
  }, [allDocuments, engineer]);

  const completedDocs = useMemo(() => {
    if (!engineer) return [];
    return allDocuments.filter(
      (d) => d.assignedEngineerUid === engineer.uid && d.status === "Completed"
    );
  }, [allDocuments, engineer]);

  const feedbackDocs = useMemo(
    () => myDocs.filter((d) => isFeedbackStage(d.status)),
    [myDocs]
  );

  const activeDocs = useMemo(
    () => myDocs.filter((d) => !isFeedbackStage(d.status)),
    [myDocs]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <Clock className="animate-spin" size={40} />
        <p className="font-bold tracking-widest text-xs uppercase text-slate-500">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Engineer Portal</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {engineer?.name ?? "Engineer"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              ID: {engineer?.employeeId}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{myDocs.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-amber-500">{feedbackDocs.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-500">{completedDocs.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Attention Banner */}
      {feedbackDocs.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[28px] p-6 text-white flex items-center gap-4 shadow-xl shadow-orange-400/20 animate-in zoom-in duration-500">
          <div className="p-3 bg-white/20 rounded-2xl flex-shrink-0">
            <MessageSquare size={22} />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest">
              {feedbackDocs.length} document{feedbackDocs.length > 1 ? "s" : ""} need your attention
            </p>
            <p className="text-white/80 text-xs font-medium mt-0.5">
              Feedback received — review and advance the workflow
            </p>
          </div>
        </div>
      )}

      {/* Feedback Docs */}
      {feedbackDocs.length > 0 && (
        <DocTable
          title="Feedback — Action Required"
          docs={feedbackDocs}
          ecrns={ecrns}
          icon={MessageSquare}
          iconClass="text-orange-500"
          onSelect={(ecrnId, docId) => setSelectedDoc({ ecrnId, docId })}
        />
      )}

      {/* Active Docs */}
      <DocTable
        title="Active Documents"
        docs={activeDocs}
        ecrns={ecrns}
        icon={Layers}
        iconClass="text-blue-500"
        onSelect={(ecrnId, docId) => setSelectedDoc({ ecrnId, docId })}
      />

      {/* Completed Docs */}
      {completedDocs.length > 0 && (
        <DocTable
          title="Completed"
          docs={completedDocs}
          ecrns={ecrns}
          icon={CheckCircle2}
          iconClass="text-emerald-500"
          onSelect={(ecrnId, docId) => setSelectedDoc({ ecrnId, docId })}
        />
      )}

      {myDocs.length === 0 && completedDocs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <ClipboardList size={48} className="opacity-30" />
          <p className="font-bold tracking-widest text-xs uppercase">No documents assigned yet</p>
        </div>
      )}

      {selectedDoc && (
        <DocumentDrawer
          ecrnId={selectedDoc.ecrnId}
          docId={selectedDoc.docId}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

function DocTable({
  title,
  docs,
  ecrns,
  icon: Icon,
  iconClass,
  onSelect,
}: {
  title: string;
  docs: TrackerDocument[];
  ecrns: Record<string, ECRN>;
  icon: React.ElementType;
  iconClass: string;
  onSelect: (ecrnId: string, docId: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Icon size={20} className={iconClass} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100 dark:border-slate-750">
          {docs.length} items
        </span>
      </div>

      {docs.length === 0 ? (
        <div className="px-8 py-16 text-center text-slate-400 italic font-medium text-sm">
          No documents in this category.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Document No.</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ECRN</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Hours (E/A)</th>
                <th className="px-8 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {docs.map((doc) => {
                const parentEcrn = ecrns[doc.ecrnId];
                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelect(doc.ecrnId, doc.id)}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-5 font-black text-slate-900 dark:text-white tracking-tight">
                      {doc.documentNumber}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        {parentEcrn?.ecrnNumber ?? doc.ecrnId}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[doc.status] ?? ""}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                        <span className="text-xs font-bold text-slate-400">{doc.estimatedHours}h</span>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className={`text-xs font-black ${doc.actualHours ? "text-blue-600 dark:text-blue-400" : "text-slate-300"}`}>
                          {doc.actualHours ? `${doc.actualHours}h` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
