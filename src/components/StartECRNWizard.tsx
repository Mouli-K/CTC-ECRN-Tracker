import { useState, useEffect } from "react";
import { collection, query, getDocs, writeBatch, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { Engineer, Priority } from "../types";
import { X, ChevronRight, ChevronLeft, Loader2, Info } from "lucide-react";

interface StartECRNWizardProps {
  onClose: () => void;
}

export default function StartECRNWizard({ onClose }: StartECRNWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  
  // Step 1 Data
  const [ecrnDetails, setEcrnDetails] = useState({
    ecrnNumber: "",
    priority: "Normal" as Priority,
    deadline: "",
    reasonForChange: "",
    stockAction: "",
    productEngineerName: ""
  });

  // Step 2 Data
  const [numDocs, setNumDocs] = useState(1);
  const [documents, setDocuments] = useState<Array<{
    documentNumber: string;
    assignedEngineerUid: string;
    estimatedHours: number;
  }>>([{ documentNumber: "", assignedEngineerUid: "", estimatedHours: 1 }]);

  useEffect(() => {
    const fetchEngineers = async () => {
      const q = query(collection(db, "engineers"));
      const snapshot = await getDocs(q);
      setEngineers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Engineer)));
    };
    fetchEngineers();
  }, []);

  useEffect(() => {
    // Sync documents array with numDocs
    const newDocs = [...documents];
    if (numDocs > newDocs.length) {
      for (let i = newDocs.length; i < numDocs; i++) {
        newDocs.push({ documentNumber: "", assignedEngineerUid: "", estimatedHours: 1 });
      }
    } else {
      newDocs.splice(numDocs);
    }
    setDocuments(newDocs);
  }, [numDocs]);

  const handleCreateECRN = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const ecrnRef = doc(collection(db, "ecrns"));
      
      const ecrnData = {
        ...ecrnDetails,
        status: "Running",
        createdAt: serverTimestamp(),
        closedAt: null,
        totalDocuments: numDocs,
        completedDocuments: 0,
        deadline: ecrnDetails.deadline ? Timestamp.fromDate(new Date(ecrnDetails.deadline)) : null
      };

      batch.set(ecrnRef, ecrnData);

      documents.forEach(d => {
        const docRef = doc(collection(db, `ecrns/${ecrnRef.id}/documents`));
        const engineer = engineers.find(e => e.uid === d.assignedEngineerUid);
        
        batch.set(docRef, {
          ...d,
          assignedEngineerName: engineer?.name || "Unknown",
          status: "WIP",
          actualHours: null,
          statusHistory: [{
            status: "WIP",
            changedAt: serverTimestamp(),
            changedBy: "Admin" // Replace with actual user name from auth later
          }],
          createdAt: serverTimestamp(),
          completedAt: null
        });

        // Update engineer active count
        if (d.assignedEngineerUid) {
          const engRef = doc(db, "engineers", d.assignedEngineerUid);
          const currentCount = engineer?.activeDocuments || 0;
          batch.update(engRef, { activeDocuments: currentCount + 1 });
        }
      });

      await batch.commit();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create ECRN. Please check console for errors.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = ecrnDetails.ecrnNumber && ecrnDetails.reasonForChange && ecrnDetails.stockAction && ecrnDetails.productEngineerName;
  const isStep2Valid = documents.every(d => d.documentNumber && d.assignedEngineerUid && d.estimatedHours > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Start New ECRN</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Step {step} of 2 — {step === 1 ? 'Details' : 'Documents'}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-10 py-6 flex gap-3">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600 shadow-sm shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600 shadow-sm shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-4 scrollbar-hide">
          {step === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">ECRN Number</label>
                  <input 
                    type="text" 
                    placeholder="Ex: ECRN-2024-001"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold tracking-tight"
                    value={ecrnDetails.ecrnNumber}
                    onChange={e => setEcrnDetails({...ecrnDetails, ecrnNumber: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Priority</label>
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {['High', 'Normal'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEcrnDetails({...ecrnDetails, priority: p as Priority})}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                          ecrnDetails.priority === p 
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                          : 'text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Deadline (Optional)</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={ecrnDetails.deadline}
                    onChange={e => setEcrnDetails({...ecrnDetails, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Product Engineer</label>
                  <input 
                    type="text" 
                    placeholder="Enter PE Name"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={ecrnDetails.productEngineerName}
                    onChange={e => setEcrnDetails({...ecrnDetails, productEngineerName: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Stock Action</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Rework, Scrap, Use As Is"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={ecrnDetails.stockAction}
                    onChange={e => setEcrnDetails({...ecrnDetails, stockAction: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Reason for Change</label>
                  <textarea 
                    rows={3}
                    placeholder="Briefly describe why this change is needed..."
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                    value={ecrnDetails.reasonForChange}
                    onChange={e => setEcrnDetails({...ecrnDetails, reasonForChange: e.target.value})}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[28px] border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Entry for {ecrnDetails.ecrnNumber}</h4>
                    <p className="text-xs font-medium opacity-80">Define the documents and assign engineers below.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Count:</span>
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    className="w-16 px-2 py-1.5 text-center font-bold bg-slate-50 dark:bg-slate-700 rounded-xl outline-none text-blue-600"
                    value={numDocs}
                    onChange={e => setNumDocs(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-[32px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Document Number</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Engineer</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {documents.map((d, i) => (
                      <tr key={i} className="bg-white dark:bg-slate-900">
                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{i + 1}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            placeholder="DOC-000"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-sm transition-all"
                            value={d.documentNumber}
                            onChange={e => {
                              const next = [...documents];
                              next[i].documentNumber = e.target.value;
                              setDocuments(next);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-sm transition-all"
                            value={d.assignedEngineerUid}
                            onChange={e => {
                              const next = [...documents];
                              next[i].assignedEngineerUid = e.target.value;
                              setDocuments(next);
                            }}
                          >
                            <option value="">Select Engineer</option>
                            {engineers.map(eng => (
                              <option key={eng.uid} value={eng.uid}>{eng.name} ({eng.employeeId})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 w-32">
                          <input 
                            type="number" 
                            step={0.5}
                            min={0.5}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-sm text-center font-bold text-blue-600 transition-all"
                            value={d.estimatedHours}
                            onChange={e => {
                              const next = [...documents];
                              next[i].estimatedHours = parseFloat(e.target.value) || 0;
                              setDocuments(next);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <button 
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {step === 1 ? 'Cancel' : <><ChevronLeft size={20} /> Previous</>}
          </button>
          
          <button 
            onClick={() => step === 1 ? setStep(2) : handleCreateECRN()}
            disabled={step === 1 ? !isStep1Valid : (!isStep2Valid || loading)}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] ${
              (step === 1 ? isStep1Valid : isStep2Valid) && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : step === 1 ? <>{'Next Step'} <ChevronRight size={20} /></> : 'Create ECRN'}
          </button>
        </div>
      </div>
    </div>
  );
}
