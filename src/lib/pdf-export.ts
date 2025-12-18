import jsPDF from "jspdf";
import { Job, GradingJob, GradedRequirement } from "./types";
import { OUTPUT_FILES } from "./constants";
import { normalizeRequirementName } from "./requirement-grading-agent";

// PDF Export Constants
const CODE_BG_PADDING = 1;
const CODE_BG_HEIGHT_MULTIPLIER = 0.45;
const CODE_BG_OFFSET = 0.35;
const CODE_BLOCK_LINE_HEIGHT = 5;
const CODE_BLOCK_PADDING = 4;
const FULL_REPORT_PREVIEW_LENGTH = 3000;
const INDENT_SPACES_PER_LEVEL = 2;
const INDENT_WIDTH_PER_LEVEL = 5;

interface ParsedMarkdownLine {
  text: string;
  style: 'normal' | 'bold';
  fontSize: number;
  indent: number;
  color: [number, number, number];
}

// Helper to parse markdown and render with formatting
function parseMarkdownLine(line: string): { text: string; style: 'normal' | 'bold'; fontSize: number; indent: number; color: [number, number, number] } {
  // Headers
  if (line.startsWith('# ')) {
    return { text: line.substring(2), style: 'bold', fontSize: 18, indent: 0, color: [0, 0, 0] };
  }
  if (line.startsWith('## ')) {
    return { text: line.substring(3), style: 'bold', fontSize: 15, indent: 0, color: [0, 0, 0] };
  }
  if (line.startsWith('### ')) {
    return { text: line.substring(4), style: 'bold', fontSize: 13, indent: 0, color: [0, 0, 0] };
  }
  if (line.startsWith('#### ')) {
    return { text: line.substring(5), style: 'bold', fontSize: 12, indent: 0, color: [0, 0, 0] };
  }
  if (line.startsWith('##### ')) {
    return { text: line.substring(6), style: 'bold', fontSize: 11, indent: 0, color: [0, 0, 0] };
  }
  if (line.startsWith('###### ')) {
    return { text: line.substring(7), style: 'bold', fontSize: 10, indent: 0, color: [0, 0, 0] };
  }
  
  // List items
  if (line.match(/^\s*[\*\-\+]\s/)) {
    const indent = (line.match(/^\s*/)?.[0].length || 0) / INDENT_SPACES_PER_LEVEL;
    return { text: '• ' + line.replace(/^\s*[\*\-\+]\s/, ''), style: 'normal', fontSize: 10, indent: indent * INDENT_WIDTH_PER_LEVEL, color: [0, 0, 0] };
  }
  if (line.match(/^\s*\d+\.\s/)) {
    const indent = (line.match(/^\s*/)?.[0].length || 0) / INDENT_SPACES_PER_LEVEL;
    return { text: line, style: 'normal', fontSize: 10, indent: indent * INDENT_WIDTH_PER_LEVEL, color: [0, 0, 0] };
  }
  
  // Horizontal rules
  if (line.match(/^[\-\*_]{3,}$/)) {
    return { text: '', style: 'normal', fontSize: 10, indent: 0, color: [0, 0, 0] };
  }
  
  // Bold text (preserve ** formatting for now, will handle in rendering)
  // Code blocks and inline code (preserve ` formatting)
  
  // Normal paragraph
  return { text: line, style: 'normal', fontSize: 10, indent: 0, color: [0, 0, 0] };
}

// Helper to process bold and code formatting within text
function processInlineFormatting(text: string): Array<{ text: string; bold: boolean; code: boolean }> {
  const segments: Array<{ text: string; bold: boolean; code: boolean }> = [];
  let current = '';
  let i = 0;
  let inBold = false;
  let inCode = false;
  
  while (i < text.length) {
    // Check for code (single backtick)
    if (text[i] === '`') {
      if (current) {
        segments.push({ text: current, bold: inBold, code: inCode });
        current = '';
      }
      inCode = !inCode;
      i++;
      continue;
    }
    
    // Check for bold (double asterisk or double underscore)
    if (!inCode && ((text[i] === '*' && text[i + 1] === '*') || (text[i] === '_' && text[i + 1] === '_'))) {
      if (current) {
        segments.push({ text: current, bold: inBold, code: inCode });
        current = '';
      }
      inBold = !inBold;
      i += 2;
      continue;
    }
    
    current += text[i];
    i++;
  }
  
  if (current) {
    segments.push({ text: current, bold: inBold, code: inCode });
  }
  
  return segments;
}

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

  const addFormattedText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" = "normal",
    color: [number, number, number] = [0, 0, 0],
    indent: number = 0
  ) => {
    if (!text.trim()) {
      yPosition += fontSize * 0.3;
      return;
    }

    const segments = processInlineFormatting(text);
    const lineHeight = fontSize * 0.5;
    let currentLineWidth = indent;
    let currentLine: Array<{ text: string; bold: boolean; code: boolean }> = [];
    
    for (const segment of segments) {
      const style = segment.bold ? 'bold' : fontStyle;
      const bgColor = segment.code ? [245, 245, 245] : null;
      
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", style);
      
      const words = segment.text.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        const wordWidth = doc.getTextWidth(word);
        
        if (currentLineWidth + wordWidth > maxWidth) {
          // Render current line
          renderLine(currentLine, fontSize, lineHeight, color, indent, margin);
          currentLine = [];
          currentLineWidth = indent;
        }
        
        currentLine.push({ text: word, bold: segment.bold, code: segment.code });
        currentLineWidth += wordWidth;
      }
    }
    
    // Render remaining line
    if (currentLine.length > 0) {
      renderLine(currentLine, fontSize, lineHeight, color, indent, margin);
    }
    
    yPosition += lineHeight * 0.3;
  };
  
  const renderLine = (
    segments: Array<{ text: string; bold: boolean; code: boolean }>,
    fontSize: number,
    lineHeight: number,
    color: [number, number, number],
    indent: number,
    margin: number
  ) => {
    addPageIfNeeded(lineHeight);
    let xPosition = margin + indent;
    
    for (const segment of segments) {
      const style = segment.bold ? 'bold' : 'normal';
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", style);
      doc.setTextColor(...color);
      
      // Add background for code
      if (segment.code) {
        const textWidth = doc.getTextWidth(segment.text);
        doc.setFillColor(...CODE_BG_COLOR);
        doc.rect(
          xPosition - CODE_BG_PADDING, 
          yPosition - fontSize * CODE_BG_OFFSET, 
          textWidth + CODE_BG_PADDING * 2, 
          fontSize * CODE_BG_HEIGHT_MULTIPLIER, 
          'F'
        );
      }
      
      doc.text(segment.text, xPosition, yPosition);
      xPosition += doc.getTextWidth(segment.text);
    }
    
    yPosition += lineHeight;
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

  addFormattedText("Description", 14, "bold", [0, 0, 0], 0);
  addFormattedText(job.description, 11, "normal", [50, 50, 50], 0);
  yPosition += 5;

  if (job.referenceFolders.length > 0) {
    addSeparator();
    addFormattedText("Reference Folders", 14, "bold", [0, 0, 0], 0);
    job.referenceFolders.forEach((folder) => {
      addFormattedText(`• ${folder}`, 10, "normal", [50, 50, 50], 0);
    });
    yPosition += 5;
  }

  // Helper to render markdown content with formatting
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    
    for (const line of lines) {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block - render it
          if (codeBlockContent.length > 0) {
            addPageIfNeeded(15);
            doc.setFillColor(...CODE_BG_COLOR);
            const codeHeight = codeBlockContent.length * CODE_BLOCK_LINE_HEIGHT + CODE_BLOCK_PADDING;
            doc.rect(margin, yPosition - 2, maxWidth, codeHeight, 'F');
            
            doc.setFontSize(9);
            doc.setFont("courier", "normal");
            doc.setTextColor(0, 0, 0);
            
            for (const codeLine of codeBlockContent) {
              addPageIfNeeded(CODE_BLOCK_LINE_HEIGHT);
              doc.text(codeLine, margin + 2, yPosition);
              yPosition += CODE_BLOCK_LINE_HEIGHT;
            }
            yPosition += 3;
          }
          codeBlockContent = [];
        }
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Skip empty lines but add spacing
      if (!line.trim()) {
        yPosition += 3;
        continue;
      }
      
      // Skip horizontal rules (already handled by separators)
      if (line.match(/^[\-\*_]{3,}$/)) {
        addSeparator();
        continue;
      }
      
      // Parse and render line with formatting
      const parsed = parseMarkdownLine(line);
      addFormattedText(parsed.text, parsed.fontSize, parsed.style, parsed.color, parsed.indent);
    }
  };

  if (outputFilename) {
    const outputData = job.outputs[outputFilename];
    if (outputData) {
      const outputFile = OUTPUT_FILES.find((f) => f.filename === outputFilename);
      addSeparator();
      addFormattedText(outputFile?.label || outputFilename, 16, "bold", [37, 99, 235], 0);
      yPosition += 5;

      renderMarkdownContent(outputData);
    }
  } else {
    OUTPUT_FILES.forEach((outputFile) => {
      const outputData = job.outputs[outputFile.filename];
      if (outputData) {
        addSeparator();
        addFormattedText(outputFile.label, 16, "bold", [37, 99, 235], 0);
        yPosition += 5;

        // For full report, render first FULL_REPORT_PREVIEW_LENGTH characters with formatting
        const preview = outputData.substring(0, FULL_REPORT_PREVIEW_LENGTH);
        renderMarkdownContent(preview + (outputData.length > FULL_REPORT_PREVIEW_LENGTH ? "\n\n... (content truncated)" : ""));
        yPosition += 5;
      }
    });
  }

  const filename = outputFilename
    ? `${job.title.replace(/[^a-z0-9]/gi, "_")}_${outputFilename.replace(".md", "")}_v${job.version}.pdf`
    : `${job.title.replace(/[^a-z0-9]/gi, "_")}_Full_Report_v${job.version}.pdf`;

  doc.save(filename);
}

/**
 * Export a grading job to PDF
 */
export function exportGradingJobToPDF(job: GradingJob) {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Helper to check if we need a new page
  const checkNewPage = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Requirements Grading Report", margin, yPosition);
  yPosition += 10;

  // Add job info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Job: ${job.title}`, margin, yPosition);
  yPosition += 6;
  
  if (job.description) {
    const descLines = doc.splitTextToSize(job.description, maxWidth);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 6;
  }
  
  doc.text(`Date: ${new Date(job.updatedAt).toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Add summary
  checkNewPage(30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const totalRequirements = job.gradedRequirements?.length || 0;
  const readyCount = job.gradedRequirements?.filter((r: GradedRequirement) => r.readyForHandoff).length || 0;
  const gradeDistribution = {
    A: job.gradedRequirements?.filter((r: GradedRequirement) => r.grade === 'A').length || 0,
    B: job.gradedRequirements?.filter((r: GradedRequirement) => r.grade === 'B').length || 0,
    C: job.gradedRequirements?.filter((r: GradedRequirement) => r.grade === 'C').length || 0,
    D: job.gradedRequirements?.filter((r: GradedRequirement) => r.grade === 'D').length || 0,
    F: job.gradedRequirements?.filter((r: GradedRequirement) => r.grade === 'F').length || 0,
  };

  doc.text(`Total Requirements: ${totalRequirements}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Ready for Handoff: ${readyCount} (${totalRequirements > 0 ? Math.round(readyCount/totalRequirements*100) : 0}%)`, margin, yPosition);
  yPosition += 6;
  doc.text(`Grade Distribution:`, margin, yPosition);
  yPosition += 6;
  doc.text(`  A (Excellent): ${gradeDistribution.A}`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`  B (Good): ${gradeDistribution.B}`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`  C (Fair): ${gradeDistribution.C}`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`  D (Poor): ${gradeDistribution.D}`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`  F (Unacceptable): ${gradeDistribution.F}`, margin + 5, yPosition);
  yPosition += 12;

  // Add graded requirements
  if (job.gradedRequirements && job.gradedRequirements.length > 0) {
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Graded Requirements", margin, yPosition);
    yPosition += 10;

    job.gradedRequirements.forEach((req: GradedRequirement) => {
      checkNewPage(25);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(`${req.id}: ${req.name}`, maxWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Grade
      doc.text(`Grade: ${req.grade}`, margin, yPosition);
      yPosition += 6;
      
      // Ready for handoff
      doc.text(`Ready for Handoff: ${req.readyForHandoff ? 'Yes' : 'No'}`, margin, yPosition);
      yPosition += 6;
      
      // Assigned team
      if (req.assignedTeam) {
        doc.text(`Assigned Team: ${req.assignedTeam}`, margin, yPosition);
        yPosition += 6;
      }
      
      // Explanation
      const explLines = doc.splitTextToSize(`Explanation: ${req.explanation}`, maxWidth);
      doc.text(explLines, margin, yPosition);
      yPosition += explLines.length * 6 + 4;
    });
  }

  const filename = `${job.title.replace(/[^a-z0-9]/gi, "_")}_Grading_Report.pdf`;
  doc.save(filename);
}
