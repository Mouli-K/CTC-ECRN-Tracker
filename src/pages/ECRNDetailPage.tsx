import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN, Document } from "../types";
import { ChevronLeft, Clock, User, Calendar, FileText, ChevronRight, CheckCircle2, AlertCircle, TrendingUp, Layers } from "lucide-react";
import DocumentDrawer from "../components/DocumentDrawer";

export default function ECRNDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ecrn, setEcrn] = useState<ECRN | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribeEcrn = onSnapshot(doc(db, "ecrns", id), (docSnap) => {
      if (docSnap.exists()) {
        setEcrn({ id: docSnap.id, ...docSnap.data() } as ECRN);
      } else {
        navigate("/home");
      }
    });

    const q = query(collection(db, `ecrns/${id}/documents`), orderBy("createdAt", "asc"));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
      setLoading(false);
    });

    return () => {
      unsubscribeEcrn();
      unsubscribeDocs();
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <Clock className="animate-spin" size={40} />
        <p className="font-bold tracking-widest text-xs uppercase text-slate-500">Loading ECRN Profile...</p>
      </div>
    );
  }

  if (!ecrn) return null;

  const allCompleted = ecrn.completedDocuments === ecrn.totalDocuments;
  const progressPercent = Math.round((ecrn.completedDocuments / ecrn.totalDocuments) * 100);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Sleek Header Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-8 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate("/home")}
                className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-all group"
              >
                <ChevronLeft size={20} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{ecrn.ecrnNumber}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ecrn.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' :
                    ecrn.status === 'Running' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                  }`}>
                    {ecrn.status}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Project Workflow Details</p>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="hidden sm:flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documents</span>
                <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{ecrn.completedDocuments} <span className="text-slate-400 font-medium">/ {ecrn.totalDocuments}</span></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl"><AlertCircle size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ecrn.priority}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl"><Calendar size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ecrn.deadline ? ecrn.deadline.toDate().toLocaleDateString() : 'None'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl"><User size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Eng.</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ecrn.productEngineerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl"><TrendingUp size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Action</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{ecrn.stockAction}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
             <span className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest block mb-2">Reason for Change</span>
             <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
               "{ecrn.reasonForChange}"
             </p>
          </div>
        </div>
      </div>

      {/* Completion Banner - Slimmer */}
      {allCompleted && ecrn.status !== 'Completed' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[28px] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/20 animate-in zoom-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><CheckCircle2 size={24} /></div>
            <p className="font-bold tracking-tight text-lg">All documents are completed. Ready to close this ECRN?</p>
          </div>
          <button className="w-full sm:w-auto px-8 py-3 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition-all shadow-md active:scale-95">
            Close Now
          </button>
        </div>
      )}

      {/* Main Document Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl"><Layers size={20} className="text-blue-500" /></div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Documents Registry</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100 dark:border-slate-750">
            {documents.length} Total Items
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Document No.</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Engineer</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Hours (E/A)</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Workflow</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc, idx) => (
                <tr 
                  key={doc.id} 
                  onClick={() => setSelectedDoc(doc)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-5 text-xs font-bold text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-5 font-black text-slate-900 dark:text-white tracking-tight">{doc.documentNumber}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-black border border-blue-100/50 dark:border-blue-900/30">
                        {doc.assignedEngineerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{doc.assignedEngineerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <span className="text-xs font-bold text-slate-400">{doc.estimatedHours}h</span>
                      <span className="text-slate-200 dark:text-slate-700">|</span>
                      <span className={`text-xs font-black ${doc.actualHours ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300'}`}>
                        {doc.actualHours ? `${doc.actualHours}h` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      doc.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' :
                      doc.status === 'WIP' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && ecrn && (
        <DocumentDrawer 
          ecrnId={ecrn.id}
          docId={selectedDoc.id}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
