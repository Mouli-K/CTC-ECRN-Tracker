import { useEffect, useMemo, useState } from "react";
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ECRN, Engineer } from "../types";
import {
  Search,
  UserCheck,
  UserMinus,
  SearchCheck,
  Briefcase,
  CheckCircle2,
  User,
  Hash,
  ExternalLink,
  Download,
  Plus,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import EngineerDetailDrawer from "../components/EngineerDetailDrawer";
import { exportEngineerWorkload } from "../utils/excelExport";
import {
  getDocumentEcrnIdFromPath,
  mergeEngineerCounts,
  type TrackerDocument,
} from "../services/trackerData";

export default function PeoplePage() {
  const [rawEngineers, setRawEngineers] = useState<Engineer[]>([]);
  const [rawEcrns, setRawEcrns] = useState<ECRN[]>([]);
  const [documents, setDocuments] = useState<TrackerDocument[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(true);
  const [loadingEcrns, setLoadingEcrns] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEngineerUid, setSelectedEngineerUid] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Engineer Form State
  const [newEng, setNewEng] = useState({ name: "", employeeId: "", email: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribeEngineers = onSnapshot(query(collection(db, "engineers")), (snapshot) => {
      setRawEngineers(snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as Engineer)));
      setLoadingEngineers(false);
    });
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
      unsubscribeEngineers();
      unsubscribeEcrns();
      unsubscribeDocuments();
    };
  }, []);

  const handleAddEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEng.name || !newEng.employeeId) return;
    
    setAdding(true);
    try {
      const uid = `eng_${Date.now()}`;
      await setDoc(doc(db, "engineers", uid), {
        uid,
        ...newEng,
        activeDocuments: 0,
        completedDocuments: 0,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewEng({ name: "", employeeId: "", email: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add engineer.");
    } finally {
      setAdding(false);
    }
  };

  const loading = loadingEngineers || loadingEcrns || loadingDocuments;
  const ecrnStatusById = useMemo(
    () =>
      Object.fromEntries(rawEcrns.map((ecrn) => [ecrn.id, ecrn.status])) as Record<
        string,
        ECRN["status"]
      >,
    [rawEcrns],
  );
  const engineers = useMemo(
    () => mergeEngineerCounts(rawEngineers, documents, ecrnStatusById),
    [documents, ecrnStatusById, rawEngineers],
  );
  const filteredEngineers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return engineers;
    }

    const matchedEcrnIds = new Set(
      rawEcrns
        .filter((ecrn) => ecrn.ecrnNumber.toLowerCase().includes(normalizedSearch))
        .map((ecrn) => ecrn.id),
    );
    const matchedEngineerIdsFromAssignments = new Set(
      documents
        .filter(
          (trackerDocument) =>
            trackerDocument.documentNumber.toLowerCase().includes(normalizedSearch) ||
            matchedEcrnIds.has(trackerDocument.ecrnId),
        )
        .map((trackerDocument) => trackerDocument.assignedEngineerUid),
    );

    return engineers.filter((engineer) => {
      const matchesProfile =
        engineer.name.toLowerCase().includes(normalizedSearch) ||
        engineer.employeeId.toLowerCase().includes(normalizedSearch) ||
        (engineer.email ?? "").toLowerCase().includes(normalizedSearch);

      return matchesProfile || matchedEngineerIdsFromAssignments.has(engineer.uid);
    });
  }, [documents, engineers, rawEcrns, searchQuery]);

  const EngineerList = ({ list, title, icon: Icon, colorClass, badgeClass }: { list: Engineer[], title: string, icon: LucideIcon, colorClass: string, badgeClass: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 ml-2">
        <Icon size={18} className={colorClass} />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
        <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${badgeClass}`}>
          {list.length}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee ID</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Workload</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium">No personnel in this category.</td>
              </tr>
            ) : (
              list.map((eng) => (
                <tr 
                  key={eng.uid} 
                  onClick={() => setSelectedEngineerUid(eng.uid)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white tracking-tight">{eng.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 lowercase">{eng.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-750 rounded-xl w-fit">
                       <Hash size={12} className="text-slate-400" />
                       <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-wider">{eng.employeeId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Docs</span>
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-blue-500" />
                          <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{eng.activeDocuments}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Completed</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{eng.completedDocuments}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                       <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personnel Bandwidth</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Real-time resource allocation and history</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Plus size={18} />
            Add Engineer
          </button>
          <button 
            onClick={() => exportEngineerWorkload(filteredEngineers)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} />
            Export Bandwidth
          </button>
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search name, ID or assignment..."
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">New Engineer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEngineer} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: John Doe"
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  value={newEng.name}
                  onChange={e => setNewEng({...newEng, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Employee ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: E12345"
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  value={newEng.employeeId}
                  onChange={e => setNewEng({...newEng, employeeId: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="engineer@emerson.com"
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  value={newEng.email}
                  onChange={e => setNewEng({...newEng, email: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                disabled={adding}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {adding ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Register Personnel</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
          <div className="animate-spin"><SearchCheck size={40} /></div>
          <p className="text-xs font-black uppercase tracking-widest">Compiling Team Data...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {searchQuery ? (
            <EngineerList 
              list={filteredEngineers}
              title="Search Results"
              icon={Search}
              colorClass="text-blue-500"
              badgeClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30"
            />
          ) : (
            <>
              <EngineerList 
                list={engineers.filter(e => (e.activeDocuments || 0) > 0)}
                title="Engaged Engineers"
                icon={UserMinus}
                colorClass="text-amber-500"
                badgeClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30"
              />

              <EngineerList 
                list={engineers.filter(e => (e.activeDocuments || 0) <= 0)}
                title="Available Personnel"
                icon={UserCheck}
                colorClass="text-emerald-500"
                badgeClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30"
              />
            </>
          )}
        </div>
      )}

      {selectedEngineerUid && (
        <EngineerDetailDrawer 
          engineerUid={selectedEngineerUid} 
          onClose={() => setSelectedEngineerUid(null)} 
        />
      )}
    </div>
  );
}
