import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { Document } from "../types";
import { X, Check, User, ArrowRight, Loader2 } from "lucide-react";
import { advanceDocumentStage, DOCUMENT_STAGES } from "../services/trackerWorkflow";

interface DocumentDrawerProps {
  ecrnId: string;
  docId: string;
  onClose: () => void;
}

export default function DocumentDrawer({ ecrnId, docId, onClose }: DocumentDrawerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHoursCapture, setShowHoursCapture] = useState(false);
  const [actualHours, setActualHours] = useState<number>(0);
  const [actionError, setActionError] = useState("");

  const currentUser = auth.currentUser;
  const currentUserName =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "Unknown User";

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, `ecrns/${ecrnId}/documents`, docId),
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({ id: snapshot.id, ...snapshot.data() } as Document);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [docId, ecrnId]);

  const performMove = async (finalHours?: number) => {
    setUpdating(true);
    setActionError("");

    try {
      const nextStatus = await advanceDocumentStage({
        ecrnId,
        documentId: docId,
        actorName: currentUserName,
        actualHours: finalHours,
      });

      setShowHoursCapture(false);

      if (nextStatus === "Completed") {
        onClose();
      }
    } catch (error) {
      console.error(error);
      setActionError(
        error instanceof Error ? error.message : "Failed to update the document status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleMoveStage = async () => {
    if (!document) {
      return;
    }

    const currentStageIndex = DOCUMENT_STAGES.indexOf(document.status);
    const nextStatus = DOCUMENT_STAGES[currentStageIndex + 1];

    if (nextStatus === "Completed") {
      setActualHours(document.actualHours ?? document.estimatedHours);
      setActionError("");
      setShowHoursCapture(true);
      return;
    }

    await performMove();
  };

  if (loading || !document) {
    return null;
  }

  const currentStageIndex = DOCUMENT_STAGES.indexOf(document.status);
  const hasValidActualHours =
    actualHours > 0 && Math.abs(actualHours * 2 - Math.round(actualHours * 2)) < 1e-9;

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[110]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-[120] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-100 dark:border-slate-800">
        <div className="p-10 space-y-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2">Document Detail</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{document.documentNumber}</h3>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Workflow Status</h4>
            <div className="space-y-2 relative pl-4">
              <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />
              {DOCUMENT_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isFeedback = stage.toLowerCase().startsWith("feedback");

                return (
                  <div key={stage} className="flex items-center gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-500 border-2 z-10 ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isCurrent
                          ? "bg-white dark:bg-slate-900 border-blue-600 text-blue-600 shadow-lg shadow-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}>
                      {isCompleted ? <Check size={14} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-tight ${
                      isCurrent ? "text-blue-600 dark:text-blue-400" :
                      isCompleted ? "text-emerald-500" :
                      "text-slate-400"
                    } ${isFeedback ? "italic" : ""}`}>
                      {stage}
                      {isCurrent && <span className="ml-2 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-md normal-case not-italic">Current</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-black">
                  {document.assignedEngineerName.split(" ").map((name) => name[0]).join("")}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{document.assignedEngineerName}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Time</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{document.estimatedHours}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            {!showHoursCapture ? (
              <button
                onClick={handleMoveStage}
                disabled={document.status === "Completed" || updating}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                  document.status === "Completed"
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-slate-900/10 active:scale-[0.98]"
                } disabled:opacity-50`}
              >
                {updating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {document.status === "Completed"
                      ? "Workflow Finalized"
                      : `Move to ${DOCUMENT_STAGES[currentStageIndex + 1]}`}
                    {document.status !== "Completed" && <ArrowRight size={18} />}
                  </>
                )}
              </button>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[32px] border border-blue-100 dark:border-blue-900/30 space-y-6 animate-in zoom-in duration-300">
                <div>
                  <h5 className="font-black text-blue-600 dark:text-blue-400 text-sm uppercase tracking-widest mb-1">Actual Hours Worked</h5>
                  <p className="text-xs text-blue-500/70 font-medium">How many hours did this document actually take?</p>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step={0.5}
                    min={0.5}
                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl outline-none focus:border-blue-500 font-black text-2xl text-blue-600 text-center"
                    value={actualHours}
                    onChange={(event) => setActualHours(parseFloat(event.target.value) || 0)}
                  />
                  <div className="text-xs font-bold text-blue-400">
                    Est: {document.estimatedHours}h
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowHoursCapture(false);
                      setActionError("");
                    }}
                    className="py-3.5 bg-white dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => performMove(actualHours)}
                    disabled={!hasValidActualHours || updating}
                    className="py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            )}

            {actionError ? (
              <p className="mt-4 text-xs font-bold text-red-600 dark:text-red-400">
                {actionError}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Activity Log</h4>
            <div className="space-y-6 relative pl-4">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-50 dark:bg-slate-800 -translate-x-1/2" />
              {[...(document.statusHistory ?? [])].reverse().map((log, index) => (
                <div key={`${log.status}-${index}`} className="relative pl-10">
                  <div className="absolute left-[-1.5px] top-1 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 shadow-sm" />
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{log.status}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {log.changedAt?.toDate
                          ? log.changedAt.toDate().toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Pending sync"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <User size={12} />
                      {log.changedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
