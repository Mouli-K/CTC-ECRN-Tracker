import { useState, useEffect } from "react";
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN } from "../types";
import { X, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface CloseECRNModalProps {
  onClose: () => void;
}

export default function CloseECRNModal({ onClose }: CloseECRNModalProps) {
  const [ecrns, setEcrns] = useState<ECRN[]>([]);
  const [selectedEcrnId, setSelectedEcrnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchEcrns = async () => {
      // Only ECRNs that are Running or With PE can be closed
      const q = query(collection(db, "ecrns"), where("status", "in", ["Running", "With PE"]));
      const snapshot = await getDocs(q);
      setEcrns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ECRN)));
      setFetching(false);
    };
    fetchEcrns();
  }, []);

  const handleCloseECRN = async () => {
    if (!selectedEcrnId) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const ecrnRef = doc(db, "ecrns", selectedEcrnId);
      
      batch.update(ecrnRef, {
        status: "Completed",
        closedAt: serverTimestamp()
      });

      await batch.commit();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to close ECRN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
          <X size={20} />
        </button>

        <div className="p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-[24px] mb-6 shadow-sm">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Close ECRN</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 px-4">
              Has the Product Engineer reviewed and approved all documents in this ECRN?
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Select ECRN to Close</label>
              <select 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white font-bold"
                value={selectedEcrnId}
                onChange={e => setSelectedEcrnId(e.target.value)}
                disabled={fetching}
              >
                <option value="">{fetching ? 'Fetching ECRNs...' : 'Choose an ECRN'}</option>
                {ecrns.map(e => (
                  <option key={e.id} value={e.id}>{e.ecrnNumber} — {e.productEngineerName}</option>
                ))}
              </select>
            </div>

            {selectedEcrnId && (
              <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                <AlertTriangle size={18} className="shrink-0" />
                <p>This action will mark the ECRN as Completed and set the closure timestamp. This cannot be undone.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={onClose}
                className="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCloseECRN}
                disabled={!selectedEcrnId || loading}
                className={`px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  selectedEcrnId && !loading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
