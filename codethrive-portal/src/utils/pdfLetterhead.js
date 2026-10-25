/**
 * CodeThrive Infotech Official PDF & Word Document Engine
 * Generates standardized corporate letterhead matching the exact Experience Certificate Header
 * and the Official Royal Blue Bar Footer with Contact Icons (Website, Phone, Email).
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Company Credentials matching official letterhead
export const COMPANY_INFO = {
  name: 'CODETHRIVE INFOTECH',
  legalName: 'CodeThrive Infotech Pvt Ltd',
  address: 'No.1 Srihari Nivas, Indira Nagar, Sungam, Coimbatore - 641045',
  email: 'codethriveinfotech@gmail.com',
  website: 'www.codethriveinfotech.in',
  phone: '9150781685'
};

// Cached Logo Data URL
let cachedLogoDataUrl = null;

export const getLogoDataUrl = () => {
  if (cachedLogoDataUrl) return Promise.resolve(cachedLogoDataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cachedLogoDataUrl = canvas.toDataURL('image/png');
        resolve(cachedLogoDataUrl);
      } catch (e) {
        resolve('/logo.png');
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
};

/**
 * Draw Official Page Border Frame (Clean rectangular frame from sample)
 */
export const drawPageBorder = (doc, pageW = 210, pageH = 297, margin = 10) => {
  doc.setDrawColor(20, 20, 20); // Clean corporate black border
  doc.setLineWidth(0.55);
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
};

/**
 * Draw Official Company Letterhead Header
 * - Horizontally centered block matching reference layout
 * - Company Name enlarged to 24pt ("CODETHRIVE" in Royal Blue #0052a5, "INFOTECH" in Vibrant Green #059669)
 * - Address & Contact lines in crisp serif Times
 * - Clean horizontal divider line closing the header section
 */
export const drawCompanyHeader = (doc, logoData, pageW = 210, startY = 16) => {
  const logoW = 25;
  const logoH = 25;
  const gap = 6;
  const margin = 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  const codeThriveW = doc.getTextWidth('CODETHRIVE ');
  const infoTechW = doc.getTextWidth('INFOTECH');
  const titleTotalW = codeThriveW + infoTechW;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const addressW = doc.getTextWidth(COMPANY_INFO.address);

  doc.setFontSize(9.5);
  const contactText = `Email: ${COMPANY_INFO.email} | Website: ${COMPANY_INFO.website.replace('www.', '')}`;
  const contactW = doc.getTextWidth(contactText);

  // Compute total width of the centered unit
  const maxTextW = Math.max(titleTotalW, addressW, contactW);
  const totalHeaderW = logoW + gap + maxTextW;

  // Horizontally center the block on the page
  const startX = (pageW - totalHeaderW) / 2;
  const logoX = startX;
  const logoY = startY;
  const textX = startX + logoW + gap;

  // 1. Logo (crisp user-uploaded official emblem)
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
    } catch (e) {
      doc.setFillColor(0, 82, 165);
      doc.roundedRect(logoX, logoY, logoW, logoH, 2.5, 2.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.text('CTI', logoX + logoW / 2, logoY + 14, { align: 'center' });
    }
  }

  // 2. Company Name: Prominent 24pt ("CODETHRIVE" in Royal Blue, "INFOTECH" in Green)
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 82, 165); // Corporate Blue #0052a5
  doc.text('CODETHRIVE ', textX, startY + 8);

  doc.setTextColor(5, 150, 105); // Vibrant Green #059669
  doc.text('INFOTECH', textX + codeThriveW, startY + 8);

  // 3. Address Line
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(COMPANY_INFO.address, textX, startY + 15);

  // 4. Contact Line
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(contactText, textX, startY + 21);

  // 5. Header Section Divider Line (cleanly closes the header section)
  const dividerY = startY + logoH + 4;
  doc.setDrawColor(0, 82, 165); // Royal Blue accent line
  doc.setLineWidth(0.75);
  doc.line(margin + 2, dividerY, pageW - margin - 2, dividerY);

  return dividerY + 5;
};

/**
 * Draw Document Title & Meta Grid
 */
export const drawDocumentTitleAndMeta = (doc, title, metaFields = [], startY = 48, pageW = 210) => {
  let currentY = startY + 3;

  // Document Title (Centered, Bold, Royal Blue matching Reference)
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 82, 165); // #0052a5 Navy / Royal Blue
  doc.text(title.toUpperCase(), pageW / 2, currentY, { align: 'center' });

  currentY += 7;

  // Metadata Box (if fields provided)
  if (metaFields && metaFields.length > 0) {
    const boxX = 14;
    const boxW = pageW - 28;
    const rowHeight = 7;
    const numRows = Math.ceil(metaFields.length / 2);
    const boxH = numRows * rowHeight + 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(boxX, currentY, boxW, boxH, 2, 2, 'FD');

    doc.setFontSize(9.2);
    metaFields.forEach((field, idx) => {
      const isLeft = idx % 2 === 0;
      const rowIndex = Math.floor(idx / 2);
      const fieldX = isLeft ? boxX + 6 : boxX + boxW / 2 + 6;
      const fieldY = currentY + 5.5 + rowIndex * rowHeight;

      doc.setFont('times', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${field.label}:`, fieldX, fieldY);

      const labelWidth = doc.getTextWidth(`${field.label}: `);
      doc.setFont('times', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(String(field.value || '-'), fieldX + labelWidth, fieldY);
    });

    currentY += boxH + 6;
  } else {
    currentY += 4;
  }

  return currentY;
};

/**
 * Draw Official Footer Bar
 * - Positioned safely inside the bottom page border with zero overlapping lines
 * - Solid Royal Blue Horizontal Bar Line (#0052a5)
 * - 🌐 www.codethriveinfotech.in
 * - 📞 9150781685 (vector badge + cyan phone)
 * - ✉️ codethriveinfotech@gmail.com (vector envelope)
 * - Clean page number and verification note sitting above bottom border
 */
export const drawCompanyFooter = (doc, pageW = 210, pageH = 297, currentPage = 1, totalPages = 1) => {
  const margin = 10;
  // Border bottom is at pageH - margin (287mm in A4 portrait).
  // Footer line is safely at pageH - 24 (273mm)
  const footerLineY = pageH - 24;

  // 1. Solid Royal Blue Bar Line across the entire width inside margin
  doc.setDrawColor(0, 82, 165); // #0052a5
  doc.setLineWidth(1.1);
  doc.line(margin + 2, footerLineY, pageW - margin - 2, footerLineY);

  // 2. Contact Items below the line (y-center at 278.5mm)
  const contentY = footerLineY + 5.5;

  // Item 1 (Left): 🌐 www.codethriveinfotech.in
  const globeX = margin + 5;
  const globeCenterY = contentY - 1;
  doc.setDrawColor(0, 82, 165);
  doc.setLineWidth(0.4);
  doc.circle(globeX, globeCenterY, 2.3);
  doc.line(globeX - 2.3, globeCenterY, globeX + 2.3, globeCenterY);
  doc.line(globeX, globeCenterY - 2.3, globeX, globeCenterY + 2.3);
  doc.ellipse(globeX, globeCenterY, 1.15, 2.3);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.website, globeX + 4.5, contentY);

  // Item 2 (Center): 📞 9150781685
  const phoneX = pageW > 250 ? pageW / 2 - 15 : 92;
  const phoneCenterY = contentY - 1;
  doc.setFillColor(30, 41, 59);
  doc.circle(phoneX, phoneCenterY, 2.4, 'F');

  // Phone handset vector lines in cyan #38bdf8
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.5);
  doc.line(phoneX - 1.0, phoneCenterY - 0.2, phoneX - 0.6, phoneCenterY - 1.4);
  doc.line(phoneX - 0.6, phoneCenterY - 1.4, phoneX - 0.2, phoneCenterY - 1.1);
  doc.line(phoneX - 1.0, phoneCenterY - 0.2, phoneX + 0.4, phoneCenterY + 0.3);
  doc.line(phoneX + 0.4, phoneCenterY + 0.3, phoneX + 0.9, phoneCenterY - 0.2);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.phone, phoneX + 4.5, contentY);

  // Item 3 (Right): ✉️ codethriveinfotech@gmail.com
  const mailX = pageW > 250 ? pageW - margin - 75 : 142;
  const mailCenterY = contentY - 1;
  doc.setFillColor(0, 82, 165);
  doc.roundedRect(mailX - 2.4, mailCenterY - 1.7, 4.8, 3.4, 0.4, 0.4, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(mailX - 2.4, mailCenterY - 1.7, mailX, mailCenterY + 0.1);
  doc.line(mailX + 2.4, mailCenterY - 1.7, mailX, mailCenterY + 0.1);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.email, mailX + 4.5, contentY);

  // 3. Sub-footer verification & page counter (Inside page border at 283.5mm, 3.5mm above border at 287mm)
  const subY = contentY + 5.2;
  doc.setFont('times', 'italic');
  doc.setFontSize(7.8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an official computer-generated document from CodeThrive Infotech Portal.', margin + 5, subY);
  if (totalPages > 0) {
    doc.text(`Page ${currentPage} of ${totalPages}`, pageW - margin - 5, subY, { align: 'right' });
  }
};

/**
 * Standard CodeThrive Corporate Table Theme in Times New Roman
 * Sharp, crisp lines, comfortable cell padding, and executive styling
 */
export const getCorporateTableStyles = () => ({
  margin: { left: 14, right: 14 },
  tableLineWidth: 0.35,
  tableLineColor: [0, 82, 165],
  headStyles: {
    fillColor: [0, 82, 165], // Royal Blue
    textColor: [255, 255, 255],
    fontSize: 10,
    font: 'times',
    fontStyle: 'bold',
    halign: 'left',
    cellPadding: 4.2,
    lineColor: [0, 82, 165],
    lineWidth: 0.35
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252]
  },
  bodyStyles: {
    textColor: [30, 41, 59],
    fontSize: 9.5,
    font: 'times',
    cellPadding: 3.8,
    lineColor: [226, 232, 240],
    lineWidth: 0.25
  },
  styles: {
    font: 'times',
    overflow: 'linebreak'
  }
});

/**
 * Generate Sequential Document Filename:
 * Format: <UserName>_<ReportType>_<SequentialCount>.pdf
 * Each reportType maintains its own independent counter in localStorage starting from 1.
 * e.g., Kirubakaran_Attendance_Report_1.pdf, Kirubakaran_Attendance_Report_2.pdf
 * e.g., Kirubakaran_Payslip_1.pdf, Kirubakaran_Payslip_2.pdf
 */
export const generateOfficialPdfFilename = (userName = 'Employee', reportType = 'Report') => {
  let rawName = String(userName || 'User').trim();

  // Allow natural space between name and initial, but remove unwanted symbols/dots/underscores
  // e.g. "Kirubakaran V", "Kirubakaran V.", "Kirubakaran_V" -> "Kirubakaran V"
  let cleanName = rawName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanName) cleanName = 'User';

  let cleanReport = String(reportType || 'Report')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  const storageKey = `cti_pdf_seq_${cleanReport.toLowerCase()}`;
  let currentSeq = 0;
  try {
    const val = localStorage.getItem(storageKey);
    currentSeq = parseInt(val, 10);
    if (isNaN(currentSeq) || currentSeq < 0) {
      currentSeq = 0;
    }
  } catch (e) {
    currentSeq = 0;
  }

  const nextSeq = currentSeq + 1;
  try {
    localStorage.setItem(storageKey, String(nextSeq));
  } catch (e) {}

  return `${cleanName}_${cleanReport}_${nextSeq}.pdf`;
};

/**
 * Master PDF Builder: Initializes document with borders, letterhead, and multi-page hooks
 */
export const createOfficialCodeThriveDoc = async ({
  title = 'OFFICIAL REPORT',
  metaFields = [],
  orientation = 'portrait', // 'portrait' | 'landscape'
  userName = 'Employee',
  reportType = 'Report'
} = {}) => {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });
  doc.setFont('times', 'normal');

  const pageW = orientation === 'landscape' ? 297 : 210;
  const pageH = orientation === 'landscape' ? 210 : 297;

  // 1. Load logo
  const logoData = await getLogoDataUrl();

  // 2. Draw border frame on Page 1
  drawPageBorder(doc, pageW, pageH, 10);

  // 3. Draw Centered Header with closing divider line
  const afterHeaderY = drawCompanyHeader(doc, logoData, pageW, 16);

  // 4. Draw Title & Meta
  const startY = drawDocumentTitleAndMeta(doc, title, metaFields, afterHeaderY, pageW);

  // Helper to seal multi-page documents with border & footer (No signature block)
  const finalizeDoc = (filenameOverride) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Ensure border on every page
      drawPageBorder(doc, pageW, pageH, 10);
      // Ensure exact footer on every page
      drawCompanyFooter(doc, pageW, pageH, i, totalPages);
    }
    const finalFilename = filenameOverride || generateOfficialPdfFilename(userName, reportType);
    doc.save(finalFilename);
    return finalFilename;
  };

  return { doc, startY, pageW, pageH, logoData, finalizeDoc };
};

/**
 * Standardized HTML-to-Word / Word (.doc) Exporter
 * Generates an official Microsoft Word file with the exact company letterhead, border, and footer!
 */
export const exportOfficialWordDoc = ({
  title = 'OFFICIAL REPORT',
  metaFields = [],
  tableHeaders = [],
  tableRows = [],
  customHtmlContent = '',
  fileName = 'CodeThrive_Document.doc'
}) => {
  const metaHtml = metaFields.map(f => `
    <tr>
      <td style="font-weight: bold; width: 25%; color: #475569; padding: 4px 8px; border: 1px solid #e2e8f0; font-family: 'Times New Roman', Times, serif;">${f.label}:</td>
      <td style="color: #0f172a; padding: 4px 8px; border: 1px solid #e2e8f0; font-family: 'Times New Roman', Times, serif;">${f.value || '-'}</td>
    </tr>
  `).join('');

  const tableHeadHtml = tableHeaders.map(h => `
    <th style="background-color: #0052a5; color: #ffffff; padding: 8px 10px; font-size: 11px; text-align: left; border: 1px solid #004085; font-family: 'Times New Roman', Times, serif;">${h}</th>
  `).join('');

  const tableRowsHtml = tableRows.map((row, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      ${row.map(cell => `<td style="padding: 6px 10px; font-size: 10.5px; border: 1px solid #cbd5e1; color: #1e293b; font-family: 'Times New Roman', Times, serif;">${cell}</td>`).join('')}
    </tr>
  `).join('');

  const fullWordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 0;
          padding: 20px;
          color: #0f172a;
          background: #ffffff;
        }
        .page-container {
          border: 1.5px solid #1e293b;
          padding: 24px 28px;
          min-height: 950px;
          position: relative;
        }
        .header-table {
          width: 100%;
          border-bottom: 1.5px solid #1e293b;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 22px;
          font-weight: bold;
          color: #005b94;
          letter-spacing: 0.5px;
          margin: 0 0 3px 0;
        }
        .doc-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          text-decoration: underline;
          margin: 18px 0;
          color: #0f172a;
          text-transform: uppercase;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background-color: #f8fafc;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header (Matching Experience Certificate) -->
        <table class="header-table" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle; width: 75px;">
              <div style="width: 60px; height: 60px; background-color: #005b94; color: #ffffff; font-weight: bold; font-size: 18px; text-align: center; line-height: 60px; border-radius: 6px;">CTI</div>
            </td>
            <td style="vertical-align: middle; padding-left: 10px;">
              <div class="company-title">CODETHRIVE INFOTECH</div>
              <div style="font-size: 11px; color: #1e293b; line-height: 1.4;">
                ${COMPANY_INFO.address}<br>
                Email: ${COMPANY_INFO.email} | Website: ${COMPANY_INFO.website.replace('www.', '')}
              </div>
            </td>
          </tr>
        </table>

        <!-- Document Title -->
        <div class="doc-title">${title}</div>

        <!-- Metadata -->
        ${metaFields.length > 0 ? `
          <table class="meta-table">
            ${metaHtml}
          </table>
        ` : ''}

        <!-- Custom Content or Table -->
        ${customHtmlContent || ''}

        ${tableHeaders.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>${tableHeadHtml}</tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        ` : ''}

        <!-- Official Signatory Block -->
        <div style="text-align: right; margin-top: 35px; font-family: 'Times New Roman', Times, serif;">
          <div style="font-size: 11.5px; color: #1e293b;">Sincerely,</div>
          <div style="font-size: 12px; font-weight: bold; color: #1e293b; margin-top: 2px;">For CodeThrive Infotech</div>
          <div style="margin-top: 50px; font-size: 12px; font-weight: bold; color: #1e293b;">Authorised Signatory</div>
        </div>

        <!-- Official Footer Bar (Matching Second Screenshot) -->
        <div style="margin-top: 30px; border-top: 3.5px solid #0052a5; padding-top: 12px; font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #1e293b;">
          <table style="width: 100%; border: none; border-collapse: collapse;">
            <tr>
              <td style="border: none; text-align: left; width: 36%; vertical-align: middle;">
                <span style="color: #0052a5; font-size: 13pt; vertical-align: middle;">&#127760;</span>
                <span style="vertical-align: middle; margin-left: 4px;">${COMPANY_INFO.website}</span>
              </td>
              <td style="border: none; text-align: center; width: 28%; vertical-align: middle;">
                <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; text-align: center; font-size: 10pt; vertical-align: middle;">&#128222;</span>
                <span style="vertical-align: middle; margin-left: 4px;">${COMPANY_INFO.phone}</span>
              </td>
              <td style="border: none; text-align: right; width: 36%; vertical-align: middle;">
                <span style="color: #0052a5; font-size: 13pt; vertical-align: middle;">&#9993;</span>
                <span style="vertical-align: middle; margin-left: 4px;">${COMPANY_INFO.email}</span>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + fullWordHtml], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.doc') ? fileName : `${fileName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatCurrencyINR = (val) => {
  const num = Number(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN')}`;
};
