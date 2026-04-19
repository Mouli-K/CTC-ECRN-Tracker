import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Document, DocumentStatus, ECRN, ECRNStatus, Engineer, Priority } from "../types";
import {
  buildEcrnCounts,
  buildEngineerCounts,
  getDocumentEcrnIdFromPath,
  isActiveEcrnStatus,
  type TrackerDocument,
} from "./trackerData";

const ECRN_NUMBER_INDEX_COLLECTION = "ecrnNumberIndex";

export const DOCUMENT_STAGES: DocumentStatus[] = [
  "WIP",
  "Primary Check",
  "Secondary Check",
  "With PE",
  "Completed",
];

const normalizeEcrnNumber = (value: string) => value.trim().toLowerCase();

const isValidHourEntry = (value: number) =>
  Number.isFinite(value) && value > 0 && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;

export interface CreateEcrnInput {
  details: {
    ecrnNumber: string;
    priority: Priority;
    deadline: string;
    reasonForChange: string;
    stockAction: string;
    productEngineerName: string;
  };
  documents: Array<{
    documentNumber: string;
    assignedEngineerUid: string;
    estimatedHours: number;
  }>;
  engineers: Engineer[];
  actorName: string;
}

export const createEcrn = async ({
  details,
  documents,
  engineers,
  actorName,
}: CreateEcrnInput) => {
  const ecrnNumber = details.ecrnNumber.trim();
  const normalizedEcrnNumber = normalizeEcrnNumber(ecrnNumber);

  if (!ecrnNumber) {
    throw new Error("ECRN number is required.");
  }

  const duplicateSnapshot = await getDocs(
    query(collection(db, "ecrns"), where("ecrnNumber", "==", ecrnNumber)),
  );

  if (!duplicateSnapshot.empty) {
    throw new Error("An ECRN with this number already exists.");
  }

  const ecrnRef = doc(collection(db, "ecrns"));
  const ecrnIndexRef = doc(db, ECRN_NUMBER_INDEX_COLLECTION, normalizedEcrnNumber);
  const engineerActiveCounts: Record<string, number> = {};

  for (const trackerDocument of documents) {
    const assignedEngineer = engineers.find(
      (engineer) => engineer.uid === trackerDocument.assignedEngineerUid,
    );

    if (!assignedEngineer) {
      throw new Error(`Assigned engineer not found for ${trackerDocument.documentNumber}.`);
    }

    engineerActiveCounts[trackerDocument.assignedEngineerUid] =
      (engineerActiveCounts[trackerDocument.assignedEngineerUid] ?? 0) + 1;
  }

  await runTransaction(db, async (transaction) => {
    const indexSnapshot = await transaction.get(ecrnIndexRef);

    if (indexSnapshot.exists()) {
      throw new Error("An ECRN with this number already exists.");
    }

    transaction.set(ecrnIndexRef, {
      ecrnId: ecrnRef.id,
      ecrnNumber,
      createdAt: serverTimestamp(),
    });

    transaction.set(ecrnRef, {
      ecrnNumber,
      priority: details.priority,
      deadline: details.deadline
        ? Timestamp.fromDate(new Date(details.deadline))
        : null,
      reasonForChange: details.reasonForChange.trim(),
      stockAction: details.stockAction.trim(),
      productEngineerName: details.productEngineerName.trim(),
      status: "Running",
      createdAt: serverTimestamp(),
      closedAt: null,
      totalDocuments: documents.length,
      completedDocuments: 0,
    });

    for (const trackerDocument of documents) {
      const assignedEngineer = engineers.find(
        (engineer) => engineer.uid === trackerDocument.assignedEngineerUid,
      );

      if (!assignedEngineer) {
        throw new Error(`Assigned engineer not found for ${trackerDocument.documentNumber}.`);
      }

      const documentRef = doc(collection(db, "ecrns", ecrnRef.id, "documents"));

      transaction.set(documentRef, {
        documentNumber: trackerDocument.documentNumber.trim(),
        assignedEngineerUid: trackerDocument.assignedEngineerUid,
        assignedEngineerName: assignedEngineer.name,
        estimatedHours: trackerDocument.estimatedHours,
        actualHours: null,
        status: "WIP",
        statusHistory: [
          {
            status: "WIP",
            changedAt: Timestamp.now(),
            changedBy: actorName,
          },
        ],
        createdAt: serverTimestamp(),
        completedAt: null,
      });
    }

    for (const [engineerUid, count] of Object.entries(engineerActiveCounts)) {
      const engineerRef = doc(db, "engineers", engineerUid);
      transaction.set(
        engineerRef,
        {
          activeDocuments: increment(count),
        },
        { merge: true },
      );
    }
  });

  return ecrnRef.id;
};

export const advanceDocumentStage = async ({
  ecrnId,
  documentId,
  actorName,
  actualHours,
}: {
  ecrnId: string;
  documentId: string;
  actorName: string;
  actualHours?: number;
}) => {
  const documentRef = doc(db, "ecrns", ecrnId, "documents", documentId);
  const ecrnRef = doc(db, "ecrns", ecrnId);

  return runTransaction(db, async (transaction) => {
    const documentSnapshot = await transaction.get(documentRef);

    if (!documentSnapshot.exists()) {
      throw new Error("Document not found.");
    }

    const trackerDocument = documentSnapshot.data() as Document;
    const currentStageIndex = DOCUMENT_STAGES.indexOf(trackerDocument.status);

    if (currentStageIndex < 0 || currentStageIndex >= DOCUMENT_STAGES.length - 1) {
      throw new Error("This document is already completed.");
    }

    const nextStatus = DOCUMENT_STAGES[currentStageIndex + 1];

    if (nextStatus === "Completed" && !isValidHourEntry(actualHours ?? 0)) {
      throw new Error("Please enter the actual hours worked in 0.5 hour increments.");
    }

    const nextHistory = [
      ...(trackerDocument.statusHistory ?? []),
      {
        status: nextStatus,
        changedAt: Timestamp.now(),
        changedBy: actorName,
      },
    ];

    transaction.update(documentRef, {
      status: nextStatus,
      statusHistory: nextHistory,
      ...(nextStatus === "Completed"
        ? {
            actualHours,
            completedAt: serverTimestamp(),
          }
        : {}),
    });

    const engineerRef = doc(db, "engineers", trackerDocument.assignedEngineerUid);

    if (trackerDocument.status === "WIP") {
      transaction.set(
        engineerRef,
        {
          activeDocuments: increment(-1),
        },
        { merge: true },
      );
    }

    if (nextStatus === "Completed") {
      transaction.set(
        engineerRef,
        {
          completedDocuments: increment(1),
        },
        { merge: true },
      );
      transaction.set(
        ecrnRef,
        {
          completedDocuments: increment(1),
        },
        { merge: true },
      );
    }

    return nextStatus;
  });
};

export const updateEcrnStatus = async (ecrnId: string, newStatus: ECRNStatus) => {
  const ecrnRef = doc(db, "ecrns", ecrnId);
  const [ecrnSnapshot, documentsSnapshot] = await Promise.all([
    getDoc(ecrnRef),
    getDocs(collection(db, "ecrns", ecrnId, "documents")),
  ]);

  if (!ecrnSnapshot.exists()) {
    throw new Error("ECRN not found.");
  }

  const ecrn = ecrnSnapshot.data() as ECRN;

  if (ecrn.status === newStatus) {
    return;
  }

  const wipCountsByEngineer: Record<string, number> = {};

  for (const documentSnapshot of documentsSnapshot.docs) {
    const trackerDocument = documentSnapshot.data() as Document;

    if (trackerDocument.status !== "WIP" || !trackerDocument.assignedEngineerUid) {
      continue;
    }

    wipCountsByEngineer[trackerDocument.assignedEngineerUid] =
      (wipCountsByEngineer[trackerDocument.assignedEngineerUid] ?? 0) + 1;
  }

  const batch = writeBatch(db);
  const wasActive = isActiveEcrnStatus(ecrn.status);
  const isNowActive = isActiveEcrnStatus(newStatus);

  batch.update(ecrnRef, {
    status: newStatus,
    ...(newStatus === "Completed"
      ? { closedAt: serverTimestamp() }
      : ecrn.status === "Completed"
        ? { closedAt: null }
        : {}),
  });

  if (wasActive !== isNowActive) {
    const delta = isNowActive ? 1 : -1;

    for (const [engineerUid, count] of Object.entries(wipCountsByEngineer)) {
      const engineerRef = doc(db, "engineers", engineerUid);
      batch.set(
        engineerRef,
        {
          activeDocuments: increment(delta * count),
        },
        { merge: true },
      );
    }
  }

  await batch.commit();
};

export const deleteEcrn = async (ecrnId: string) => {
  const ecrnRef = doc(db, "ecrns", ecrnId);
  const [ecrnSnapshot, documentsSnapshot] = await Promise.all([
    getDoc(ecrnRef),
    getDocs(collection(db, "ecrns", ecrnId, "documents")),
  ]);

  if (!ecrnSnapshot.exists()) {
    throw new Error("ECRN not found.");
  }

  const ecrn = { id: ecrnSnapshot.id, ...ecrnSnapshot.data() } as ECRN;
  const batch = writeBatch(db);

  for (const documentSnapshot of documentsSnapshot.docs) {
    batch.delete(documentSnapshot.ref);
  }

  batch.delete(doc(db, ECRN_NUMBER_INDEX_COLLECTION, normalizeEcrnNumber(ecrn.ecrnNumber)));
  batch.delete(ecrnRef);

  await batch.commit();
  await reconcileDerivedCounters();
};

export const reconcileDerivedCounters = async () => {
  const [ecrnSnapshot, engineerSnapshot, documentSnapshot] = await Promise.all([
    getDocs(collection(db, "ecrns")),
    getDocs(collection(db, "engineers")),
    getDocs(collectionGroup(db, "documents")),
  ]);

  const ecrns = ecrnSnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data(),
  })) as ECRN[];
  const engineers = engineerSnapshot.docs.map((snapshot) => ({
    uid: snapshot.id,
    ...snapshot.data(),
  })) as Engineer[];
  const trackerDocuments = documentSnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ecrnId: getDocumentEcrnIdFromPath(snapshot.ref.path),
    ...snapshot.data(),
  })) as TrackerDocument[];

  const ecrnStatusById = Object.fromEntries(
    ecrns.map((ecrn) => [ecrn.id, ecrn.status]),
  ) as Record<string, ECRNStatus>;
  const ecrnCounts = buildEcrnCounts(trackerDocuments);
  const engineerCounts = buildEngineerCounts(trackerDocuments, ecrnStatusById);
  const batch = writeBatch(db);
  let hasUpdates = false;

  for (const ecrn of ecrns) {
    const derivedCounts = ecrnCounts[ecrn.id] ?? {
      totalDocuments: 0,
      completedDocuments: 0,
    };

    if (
      (ecrn.totalDocuments ?? 0) !== derivedCounts.totalDocuments ||
      (ecrn.completedDocuments ?? 0) !== derivedCounts.completedDocuments
    ) {
      batch.set(
        doc(db, "ecrns", ecrn.id),
        {
          totalDocuments: derivedCounts.totalDocuments,
          completedDocuments: derivedCounts.completedDocuments,
        },
        { merge: true },
      );
      hasUpdates = true;
    }
  }

  for (const engineer of engineers) {
    const derivedCounts = engineerCounts[engineer.uid] ?? {
      activeDocuments: 0,
      completedDocuments: 0,
    };

    if (
      (engineer.activeDocuments ?? 0) !== derivedCounts.activeDocuments ||
      (engineer.completedDocuments ?? 0) !== derivedCounts.completedDocuments
    ) {
      batch.set(
        doc(db, "engineers", engineer.uid),
        {
          activeDocuments: derivedCounts.activeDocuments,
          completedDocuments: derivedCounts.completedDocuments,
        },
        { merge: true },
      );
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }

  return {
    updated: hasUpdates,
    ecrnsChecked: ecrns.length,
    engineersChecked: engineers.length,
  };
};

let integritySyncPromise: Promise<void> | null = null;

export const runIntegritySyncOnce = () => {
  if (!integritySyncPromise) {
    integritySyncPromise = reconcileDerivedCounters()
      .then(() => undefined)
      .catch((error) => {
        integritySyncPromise = null;
        throw error;
      });
  }

  return integritySyncPromise;
};
