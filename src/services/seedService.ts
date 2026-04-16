import { writeBatch, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export const seedMockData = async () => {
  const batch = writeBatch(db);

  // 1. Seed Mock Engineers
  const engineers = [
    { uid: "eng_1", employeeId: "E1001", name: "John Doe", email: "john.doe@emerson.com", activeDocuments: 2, completedDocuments: 5 },
    { uid: "eng_2", employeeId: "E1002", name: "Jane Smith", email: "jane.smith@emerson.com", activeDocuments: 1, completedDocuments: 12 },
    { uid: "eng_3", employeeId: "E1003", name: "Robert Brown", email: "robert.brown@emerson.com", activeDocuments: 0, completedDocuments: 8 },
  ];

  engineers.forEach((eng) => {
    const engRef = doc(db, "engineers", eng.uid);
    batch.set(engRef, eng);
  });

  // 2. Seed Mock ECRNs
  const ecrnId = "mock_ecrn_1";
  const ecrnRef = doc(db, "ecrns", ecrnId);
  
  batch.set(ecrnRef, {
    ecrnNumber: "ECRN-2026-001",
    priority: "High",
    deadline: Timestamp.fromDate(new Date("2026-05-20")),
    reasonForChange: "Critical update to the valve assembly design to prevent pressure leaks in high-temperature environments.",
    stockAction: "Rework existing stock",
    productEngineerName: "Michael Scott",
    status: "Running",
    createdAt: serverTimestamp(),
    closedAt: null,
    totalDocuments: 3,
    completedDocuments: 1
  });

  // 3. Seed Mock Documents for that ECRN
  const docs = [
    {
      id: "doc_1",
      documentNumber: "DWG-VLV-001",
      assignedEngineerUid: "eng_1",
      assignedEngineerName: "John Doe",
      estimatedHours: 8,
      actualHours: null,
      status: "WIP",
      statusHistory: [{ status: "WIP", changedAt: Timestamp.now(), changedBy: "Admin" }],
      createdAt: serverTimestamp(),
      completedAt: null
    },
    {
      id: "doc_2",
      documentNumber: "DWG-VLV-002",
      assignedEngineerUid: "eng_1",
      assignedEngineerName: "John Doe",
      estimatedHours: 4,
      actualHours: null,
      status: "Primary Check",
      statusHistory: [
        { status: "WIP", changedAt: Timestamp.now(), changedBy: "Admin" },
        { status: "Primary Check", changedAt: Timestamp.now(), changedBy: "John Doe" }
      ],
      createdAt: serverTimestamp(),
      completedAt: null
    },
    {
      id: "doc_3",
      documentNumber: "DWG-VLV-003",
      assignedEngineerUid: "eng_2",
      assignedEngineerName: "Jane Smith",
      estimatedHours: 12,
      actualHours: 10,
      status: "Completed",
      statusHistory: [
        { status: "WIP", changedAt: Timestamp.now(), changedBy: "Admin" },
        { status: "Completed", changedAt: Timestamp.now(), changedBy: "Jane Smith" }
      ],
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp()
    }
  ];

  docs.forEach((d) => {
    const dRef = doc(db, `ecrns/${ecrnId}/documents`, d.id);
    batch.set(dRef, d);
  });

  await batch.commit();
  console.log("Mock data seeded successfully!");
};
