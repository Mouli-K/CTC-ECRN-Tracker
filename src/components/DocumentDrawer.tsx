import { useEffect, useState } from "react";
import { doc, onSnapshot, writeBatch, serverTimestamp, increment, arrayUnion, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { Document, DocumentStatus } from "../types";
import { X, Check, User, ArrowRight, Loader2 } from "lucide-react";

interface DocumentDrawerProps {
  ecrnId: string;
  docId: string;
  onClose: () => void;
}

const STAGES: DocumentStatus[] = ["WIP", "Primary Check", "Secondary Check", "With PE", "Completed"];

export default function DocumentDrawer({ ecrnId, docId, onClose }: DocumentDrawerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHoursCapture, setShowHoursCapture] = useState(false);
  const [actualHours, setActualHours] = useState<number>(0);

  const currentUser = auth.currentUser;
  const currentUserName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Unknown User";

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, `ecrns/${ecrnId}/documents`, docId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Document;
        setDocument(data);
        setActualHours(data.estimatedHours);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [ecrnId, docId]);

  const handleMoveStage = async () => {
    if (!document) return;
    const currentIndex = STAGES.indexOf(document.status);
    const nextStatus = STAGES[currentIndex + 1];

    if (nextStatus === "Completed") {
      setShowHoursCapture(true);
      return;
    }

    await performMove(nextStatus);
  };

  const performMove = async (nextStatus: DocumentStatus, finalHours?: number) => {
    if (!document) return;
    setUpdating(true);
    try {
      const batch = writeBatch(db);
      const docRef = doc(db, `ecrns/${ecrnId}/documents`, docId);
      const ecrnRef = doc(db, "ecrns", ecrnId);

      const historyUpdate = {
        status: nextStatus,
        changedAt: Timestamp.now(),
        changedBy: currentUserName
      };

      const updates: any = {
        status: nextStatus,
        statusHistory: arrayUnion(historyUpdate)
      };

      if (nextStatus === "Completed" && finalHours !== undefined) {
        updates.actualHours = finalHours;
        updates.completedAt = serverTimestamp();
        
        // Increment completed count on ECRN
        batch.update(ecrnRef, { completedDocuments: increment(1) });
        
        // Update engineer stats
        const engRef = doc(db, "engineers", document.assignedEngineerUid);
        batch.update(engRef, { 
          activeDocuments: increment(-1),
          completedDocuments: increment(1)
        });
      }

      // If moving FROM WIP to anything else, decrement active documents
      if (document.status === "WIP") {
        const engRef = doc(db, "engineers", document.assignedEngineerUid);
        batch.update(engRef, { activeDocuments: increment(-1) });
      }

      batch.update(docRef, updates);
      await batch.commit();
      
      if (nextStatus === "Completed") onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
      setShowHoursCapture(false);
    }
  };

  if (loading) return null;
  if (!document) return null;

  const currentStageIndex = STAGES.indexOf(document.status);

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[110]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-[120] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-100 dark:border-slate-800">
        <div className="p-10 space-y-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2">Document Detail</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{document.documentNumber}</h3>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Visual Flowchart */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Workflow Status</h4>
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-10" />
              {STAGES.map((stage, i) => {
                const isCompleted = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;

                return (
                  <div key={stage} className="flex flex-col items-center gap-3 relative group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                      isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                      isCurrent ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 shadow-lg shadow-blue-500/20' :
                      'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      {isCompleted ? <Check size={16} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter absolute -bottom-6 whitespace-nowrap ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-black">
                   {document.assignedEngineerName.split(' ').map(n => n[0]).join('')}
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

          {/* Action Button / Hours Capture */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            {!showHoursCapture ? (
              <button 
                onClick={handleMoveStage}
                disabled={document.status === "Completed" || updating}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                  document.status === "Completed" 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-slate-900/10 active:scale-[0.98]'
                } disabled:opacity-50`}
              >
                {updating ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    {document.status === "Completed" ? "Workflow Finalized" : `Move to ${STAGES[currentStageIndex + 1]}`}
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
                    onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-xs font-bold text-blue-400">
                    Est: {document.estimatedHours}h
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowHoursCapture(false)}
                    className="py-3.5 bg-white dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => performMove("Completed", actualHours)}
                    disabled={actualHours <= 0 || updating}
                    className="py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Log */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Activity Log</h4>
            <div className="space-y-6 relative pl-4">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-50 dark:bg-slate-800 -translate-x-1/2" />
              {[...document.statusHistory].reverse().map((log, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-[-1.5px] top-1 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 shadow-sm" />
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{log.status}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {log.changedAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
