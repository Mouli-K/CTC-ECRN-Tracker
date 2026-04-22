import { Timestamp } from "firebase/firestore";

export type ECRNStatus = "Running" | "Completed" | "With PE" | "Query Hold" | "Pending";
export type DocumentStatus =
  | "WIP"
  | "Primary Check"
  | "Feedback from Primary Check"
  | "Secondary Check"
  | "Feedback from Secondary Check"
  | "With PE"
  | "Feedback from PE"
  | "Completed";
export type Priority = "High" | "Medium" | "Low" | "Normal";

export interface ECRN {
  id: string;
  ecrnNumber: string;
  priority: Priority;
  deadline: Timestamp | null;
  reasonForChange: string;
  stockAction: string;
  productEngineerName: string;
  status: ECRNStatus;
  createdAt: Timestamp;
  closedAt: Timestamp | null;
  totalDocuments: number;
  completedDocuments: number;
}

export interface Document {
  id: string;
  documentNumber: string;
  assignedEngineerUid: string;
  assignedEngineerName: string;
  estimatedHours: number;
  actualHours: number | null;
  status: DocumentStatus;
  statusHistory: Array<{
    status: string;
    changedAt: Timestamp;
    changedBy: string;
  }>;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface Engineer {
  uid: string;
  employeeId: string;
  name: string;
  email: string;
  activeDocuments: number;
  completedDocuments: number;
}

export interface User {
  uid: string;
  employeeId: string;
  role: "admin" | "engineer";
  name: string;
}
