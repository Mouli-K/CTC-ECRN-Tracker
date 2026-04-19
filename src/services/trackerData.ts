import type { Document, ECRN, ECRNStatus, Engineer, Priority } from "../types";

export interface TrackerDocument extends Document {
  ecrnId: string;
}

export interface EcrnDocumentCounts {
  totalDocuments: number;
  completedDocuments: number;
}

export interface EngineerDocumentCounts {
  activeDocuments: number;
  completedDocuments: number;
}

export const getDocumentEcrnIdFromPath = (path: string) => {
  const segments = path.split("/");
  return segments[1] ?? "";
};

export const isActiveEcrnStatus = (status?: ECRNStatus) =>
  !status || status === "Running" || status === "Pending";

export const isActiveDocumentStatus = (
  status: Document["status"],
  ecrnStatus?: ECRNStatus,
) => status === "WIP" && isActiveEcrnStatus(ecrnStatus);

export const buildEcrnCounts = (documents: TrackerDocument[]) => {
  const counts: Record<string, EcrnDocumentCounts> = {};

  for (const trackerDocument of documents) {
    if (!trackerDocument.ecrnId) {
      continue;
    }

    const current =
      counts[trackerDocument.ecrnId] ?? {
        totalDocuments: 0,
        completedDocuments: 0,
      };

    current.totalDocuments += 1;

    if (trackerDocument.status === "Completed") {
      current.completedDocuments += 1;
    }

    counts[trackerDocument.ecrnId] = current;
  }

  return counts;
};

export const buildEngineerCounts = (
  documents: TrackerDocument[],
  ecrnStatusById: Record<string, ECRNStatus>,
) => {
  const counts: Record<string, EngineerDocumentCounts> = {};

  for (const trackerDocument of documents) {
    if (!trackerDocument.assignedEngineerUid) {
      continue;
    }

    const current =
      counts[trackerDocument.assignedEngineerUid] ?? {
        activeDocuments: 0,
        completedDocuments: 0,
      };

    if (
      isActiveDocumentStatus(
        trackerDocument.status,
        ecrnStatusById[trackerDocument.ecrnId],
      )
    ) {
      current.activeDocuments += 1;
    }

    if (trackerDocument.status === "Completed") {
      current.completedDocuments += 1;
    }

    counts[trackerDocument.assignedEngineerUid] = current;
  }

  return counts;
};

export const mergeEcrnCounts = (
  ecrns: ECRN[],
  documents: TrackerDocument[],
) => {
  const counts = buildEcrnCounts(documents);

  return ecrns.map((ecrn) => {
    const derivedCounts = counts[ecrn.id];

    if (!derivedCounts) {
      return {
        ...ecrn,
        totalDocuments: ecrn.totalDocuments ?? 0,
        completedDocuments: ecrn.completedDocuments ?? 0,
      };
    }

    return {
      ...ecrn,
      totalDocuments: derivedCounts.totalDocuments,
      completedDocuments: derivedCounts.completedDocuments,
    };
  });
};

export const mergeEngineerCounts = (
  engineers: Engineer[],
  documents: TrackerDocument[],
  ecrnStatusById: Record<string, ECRNStatus>,
) => {
  const counts = buildEngineerCounts(documents, ecrnStatusById);

  return engineers.map((engineer) => {
    const derivedCounts = counts[engineer.uid];

    if (!derivedCounts) {
      return {
        ...engineer,
        activeDocuments: engineer.activeDocuments ?? 0,
        completedDocuments: engineer.completedDocuments ?? 0,
      };
    }

    return {
      ...engineer,
      activeDocuments: derivedCounts.activeDocuments,
      completedDocuments: derivedCounts.completedDocuments,
    };
  });
};

export const buildEngineerHighPriorityActiveCounts = (
  documents: TrackerDocument[],
  ecrnsById: Record<string, ECRN>,
) => {
  const counts: Record<string, number> = {};

  for (const trackerDocument of documents) {
    if (!trackerDocument.assignedEngineerUid) {
      continue;
    }

    const parentEcrn = ecrnsById[trackerDocument.ecrnId];

    if (
      !parentEcrn ||
      !isActiveDocumentStatus(trackerDocument.status, parentEcrn.status) ||
      normalizePriority(parentEcrn.priority) !== "High"
    ) {
      continue;
    }

    counts[trackerDocument.assignedEngineerUid] =
      (counts[trackerDocument.assignedEngineerUid] ?? 0) + 1;
  }

  return counts;
};

export const normalizePriority = (priority: Priority): "High" | "Low" =>
  priority === "High" ? "High" : "Low";

export const getPriorityRank = (priority: Priority) => {
  return normalizePriority(priority) === "High" ? 2 : 1;
};

export const sortEcrnsByPriorityAndDeadline = (left: ECRN, right: ECRN) => {
  const priorityDelta = getPriorityRank(right.priority) - getPriorityRank(left.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftDeadline = left.deadline?.toMillis() ?? Number.POSITIVE_INFINITY;
  const rightDeadline = right.deadline?.toMillis() ?? Number.POSITIVE_INFINITY;

  return leftDeadline - rightDeadline;
};
