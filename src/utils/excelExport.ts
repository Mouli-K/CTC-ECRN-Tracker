import * as XLSX from "xlsx";
import type { ECRN, Engineer, Document } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateECRNPDF = (ecrn: ECRN, documents: Document[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("Engineering Change Request Summary", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

  // ECRN Info Section
  autoTable(doc, {
    startY: 40,
    head: [["Information", "Details"]],
    body: [
      ["ECRN Number", ecrn.ecrnNumber],
      ["Status", ecrn.status],
      ["Priority", ecrn.priority],
      ["Product Engineer", ecrn.productEngineerName],
      ["Deadline", ecrn.deadline ? ecrn.deadline.toDate().toLocaleDateString() : "None"],
      ["Stock Action", ecrn.stockAction],
      ["Reason for Change", ecrn.reasonForChange],
      ["Progress", `${Math.round((ecrn.completedDocuments / ecrn.totalDocuments) * 100)}% (${ecrn.completedDocuments}/${ecrn.totalDocuments} Docs)`]
    ],
    theme: 'striped',
    headStyles: { fillStyle: 'DF', fillColor: [37, 99, 235], textColor: [255, 255, 255] }, // blue-600
  });

  // Documents Table
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Documents Registry", 14, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Doc Number", "Engineer", "Hours (E/A)", "Status"]],
    body: documents.map(d => [
      d.documentNumber,
      d.assignedEngineerName,
      `${d.estimatedHours}h / ${d.actualHours || "—"}h`,
      d.status
    ]),
    headStyles: { fillColor: [51, 65, 85] }, // slate-700
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} — Chennai Technology Center`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`${ecrn.ecrnNumber}_Summary.pdf`);
};

export const exportECRNSummary = (ecrns: ECRN[]) => {
  const summaryData = ecrns.map(e => ({
    "ECRN Number": e.ecrnNumber,
    "Priority": e.priority,
    "Deadline": e.deadline ? e.deadline.toDate().toLocaleDateString() : "—",
    "PE Name": e.productEngineerName,
    "Status": e.status,
    "Total Docs": e.totalDocuments,
    "Completed Docs": e.completedDocuments,
    "Progress %": `${Math.round((e.completedDocuments / e.totalDocuments) * 100)}%`
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  // Auto-fit columns
  const maxWidths = summaryData.reduce((acc: any, row: any) => {
    Object.keys(row).forEach((key, i) => {
      const val = row[key]?.toString() || "";
      acc[i] = Math.max(acc[i] || 0, val.length, key.length);
    });
    return acc;
  }, []);
  wsSummary["!cols"] = maxWidths.map((w: number) => ({ w: w + 2 }));

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.writeFile(wb, `ECRN_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportEngineerWorkload = (engineers: Engineer[]) => {
  const data = engineers.map(e => ({
    "Name": e.name,
    "Employee ID": e.employeeId,
    "Status": e.activeDocuments > 0 ? "Engaged" : "Free",
    "Active Docs": e.activeDocuments,
    "Completed Docs": e.completedDocuments,
    "Efficiency %": e.completedDocuments > 0 ? "100%" : "0%" // Simplified for now
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Engineers");
  XLSX.writeFile(wb, `Engineer_Workload_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportECRNDetail = (ecrn: ECRN, documents: Document[]) => {
  const infoData = [
    ["Field", "Value"],
    ["ECRN Number", ecrn.ecrnNumber],
    ["Priority", ecrn.priority],
    ["Status", ecrn.status],
    ["Product Engineer", ecrn.productEngineerName],
    ["Total Documents", ecrn.totalDocuments],
    ["Completed Documents", ecrn.completedDocuments],
    ["Stock Action", ecrn.stockAction],
    ["Reason for Change", ecrn.reasonForChange]
  ];

  const docData = documents.map(d => ({
    "Document Number": d.documentNumber,
    "Assigned Engineer": d.assignedEngineerName,
    "Estimated Hours": d.estimatedHours,
    "Actual Hours": d.actualHours || "—",
    "Variance": d.actualHours ? d.actualHours - d.estimatedHours : "—",
    "Status": d.status,
    "Completed At": d.completedAt ? d.completedAt.toDate().toLocaleDateString() : "—"
  }));

  const wb = XLSX.utils.book_new();
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  const wsDocs = XLSX.utils.json_to_sheet(docData);

  XLSX.utils.book_append_sheet(wb, wsInfo, "ECRN Info");
  XLSX.utils.book_append_sheet(wb, wsDocs, "Documents");
  XLSX.writeFile(wb, `${ecrn.ecrnNumber}_Report.xlsx`);
};
