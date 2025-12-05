import jsPDF from "jspdf";
import { Job } from "./types";
import { OUTPUT_FILES } from "./constants";

export function exportJobToPDF(job: Job, outputFilename?: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const addPageIfNeeded = (height: number) => {
    if (yPosition + height > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" = "normal",
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    for (let i = 0; i < lines.length; i++) {
      addPageIfNeeded(lineHeight);
      doc.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }

    yPosition += lineHeight * 0.3;
  };

  const addSeparator = () => {
    addPageIfNeeded(5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(job.title, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Version ${job.version}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Created: ${new Date(job.createdAt).toLocaleString()}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Status: ${job.status.toUpperCase()}`, margin, yPosition);
  yPosition += 15;

  addSeparator();

  addText("Description", 14, "bold", [0, 0, 0]);
  addText(job.description, 11, "normal", [50, 50, 50]);
  yPosition += 5;

  if (job.referenceFolders.length > 0) {
    addSeparator();
    addText("Reference Folders", 14, "bold", [0, 0, 0]);
    job.referenceFolders.forEach((folder) => {
      addText(`• ${folder}`, 10, "normal", [50, 50, 50]);
    });
    yPosition += 5;
  }

  if (outputFilename) {
    const outputData = job.outputs[outputFilename];
    if (outputData) {
      const outputFile = OUTPUT_FILES.find((f) => f.filename === outputFilename);
      addSeparator();
      addText(outputFile?.label || outputFilename, 16, "bold", [37, 99, 235]);
      yPosition += 5;

      const cleanedContent = outputData
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/---+/g, "")
        .trim();

      addText(cleanedContent, 10, "normal", [0, 0, 0]);
    }
  } else {
    OUTPUT_FILES.forEach((outputFile) => {
      const outputData = job.outputs[outputFile.filename];
      if (outputData) {
        addSeparator();
        addText(outputFile.label, 16, "bold", [37, 99, 235]);
        yPosition += 5;

        const cleanedContent = outputData
          .replace(/#{1,6}\s/g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/---+/g, "")
          .trim();

        const preview = cleanedContent.substring(0, 1500);
        addText(preview + (cleanedContent.length > 1500 ? "..." : ""), 10, "normal", [0, 0, 0]);
        yPosition += 5;
      }
    });
  }

  const filename = outputFilename
    ? `${job.title.replace(/[^a-z0-9]/gi, "_")}_${outputFilename.replace(".md", "")}_v${job.version}.pdf`
    : `${job.title.replace(/[^a-z0-9]/gi, "_")}_Full_Report_v${job.version}.pdf`;

  doc.save(filename);
}
