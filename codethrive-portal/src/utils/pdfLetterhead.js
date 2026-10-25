/**
 * CodeThrive Infotech Official PDF & Word Document Engine
 * Generates standardized corporate letterhead with border frame, logo, company credentials,
 * metadata header, and authorized signatory footer.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Company Credentials
export const COMPANY_INFO = {
  name: 'CODETHRIVE INFOTECH',
  legalName: 'CodeThrive Infotech Pvt Ltd',
  address: 'No.1 Srihari Nivas, Indira Nagar, Sungam, Coimbatore - 641045',
  email: 'codethriveinfotech@gmail.com',
  website: 'codethriveinfotech.in',
  phone: '+91 9489510499'
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
        const maxDim = 200;
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
 * Draw Official Page Border Frame
 */
export const drawPageBorder = (doc, pageW = 210, pageH = 297, margin = 8) => {
  // Outer frame
  doc.setDrawColor(30, 41, 59); // Slate-800
  doc.setLineWidth(0.65);
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  // Subtle inner accent border line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.25);
  doc.rect(margin + 1.2, margin + 1.2, pageW - (margin + 1.2) * 2, pageH - (margin + 1.2) * 2);
};

/**
 * Draw Official Company Letterhead (Logo, Title, Address, Divider)
 */
export const drawCompanyHeader = (doc, logoData, pageW = 210, startY = 12) => {
  // 1. Logo on top left
  const logoW = 18;
  const logoH = 18;
  const logoX = 14;
  const logoY = startY;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
    } catch (e) {
      // Fallback geometric emblem if image fails
      doc.setFillColor(14, 116, 144);
      doc.roundedRect(logoX, logoY, logoW, logoH, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CTI', logoX + logoW / 2, logoY + 11, { align: 'center' });
    }
  }

  // 2. Company Name & Details
  const textX = 36;
  
  // "CODETHRIVE INFOTECH"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(2, 132, 199); // Blue
  doc.text('CODETHRIVE', textX, startY + 6);

  const codeThriveWidth = doc.getTextWidth('CODETHRIVE ');
  doc.setTextColor(5, 150, 105); // Green
  doc.text('INFOTECH', textX + codeThriveWidth, startY + 6);

  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // Slate-700
  doc.text(COMPANY_INFO.address, textX, startY + 12);

  // Contact line
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${COMPANY_INFO.email}   |   Website: ${COMPANY_INFO.website}`, textX, startY + 17);

  // 3. Header Divider Line
  const dividerY = startY + 22;
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.6);
  doc.line(8, dividerY, pageW - 8, dividerY);

  return dividerY + 2;
};

/**
 * Draw Document Title & Meta Box
 */
export const drawDocumentTitleAndMeta = (doc, title, metaFields = [], startY = 40, pageW = 210) => {
  let currentY = startY + 5;

  // Title Box / Centered Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.text(title.toUpperCase(), pageW / 2, currentY, { align: 'center' });

  // Underline title
  const titleWidth = doc.getTextWidth(title.toUpperCase());
  doc.setDrawColor(14, 116, 144); // Cyan/Teal underline
  doc.setLineWidth(1);
  doc.line(pageW / 2 - titleWidth / 2 - 2, currentY + 2, pageW / 2 + titleWidth / 2 + 2, currentY + 2);

  currentY += 8;

  // Metadata Box (if fields provided)
  if (metaFields && metaFields.length > 0) {
    const boxX = 12;
    const boxW = pageW - 24;
    const rowHeight = 6;
    const numRows = Math.ceil(metaFields.length / 2);
    const boxH = numRows * rowHeight + 6;

    // Background pill container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, currentY, boxW, boxH, 2.5, 2.5, 'FD');

    doc.setFontSize(8);
    metaFields.forEach((field, idx) => {
      const isLeft = idx % 2 === 0;
      const rowIndex = Math.floor(idx / 2);
      const fieldX = isLeft ? boxX + 6 : boxX + boxW / 2 + 6;
      const fieldY = currentY + 5 + rowIndex * rowHeight;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${field.label}:`, fieldX, fieldY);

      const labelWidth = doc.getTextWidth(`${field.label}: `);
      doc.setFont('helvetica', 'normal');
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
 * Draw Official Signatory Footer
 */
export const drawCompanyFooter = (doc, pageW = 210, pageH = 297) => {
  const footerDividerY = pageH - 24;

  // Divider above footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(8, footerDividerY, pageW - 8, footerDividerY);

  // Left side note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('* This is an official computer-generated document from CodeThrive Infotech Portal.', 12, footerDividerY + 6);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • System Verified`, 12, footerDividerY + 10);
  doc.text('Confidential & Proprietary • Valid without physical seal', 12, footerDividerY + 14);

  // Right side signatory
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('For CodeThrive Infotech', pageW - 14, footerDividerY + 6, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorised Signatory', pageW - 14, footerDividerY + 16, { align: 'right' });
};

/**
 * Standard CodeThrive Corporate Table Theme
 */
export const getCorporateTableStyles = () => ({
  margin: { left: 12, right: 12 },
  headStyles: {
    fillColor: [15, 23, 42], // Deep Navy Slate
    textColor: [255, 255, 255],
    fontSize: 8.5,
    fontStyle: 'bold',
    halign: 'left',
    cellPadding: 3
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] // Light slate
  },
  bodyStyles: {
    textColor: [30, 41, 59],
    fontSize: 8,
    cellPadding: 2.8,
    lineColor: [226, 232, 240],
    lineWidth: 0.2
  },
  styles: {
    font: 'helvetica',
    overflow: 'linebreak'
  }
});

/**
 * Master PDF Builder: Initializes document with borders, letterhead, and multi-page hooks
 */
export const createOfficialCodeThriveDoc = async ({
  title = 'OFFICIAL REPORT',
  metaFields = [],
  orientation = 'portrait' // 'portrait' | 'landscape'
} = {}) => {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageW = orientation === 'landscape' ? 297 : 210;
  const pageH = orientation === 'landscape' ? 210 : 297;

  // 1. Load logo
  const logoData = await getLogoDataUrl();

  // 2. Draw border frame on Page 1
  drawPageBorder(doc, pageW, pageH, 8);

  // 3. Draw Header
  const afterHeaderY = drawCompanyHeader(doc, logoData, pageW, 12);

  // 4. Draw Title & Meta
  const startY = drawDocumentTitleAndMeta(doc, title, metaFields, afterHeaderY, pageW);

  // Helper to seal multi-page documents with border & footer
  const finalizeDoc = (filename) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Ensure border on every page
      drawPageBorder(doc, pageW, pageH, 8);
      // Ensure footer on every page
      drawCompanyFooter(doc, pageW, pageH);
      // Page numbering at bottom center
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: 'center' });
    }
    doc.save(filename);
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
      <td style="font-weight: bold; width: 25%; color: #475569; padding: 4px 8px; border: 1px solid #e2e8f0;">${f.label}:</td>
      <td style="color: #0f172a; padding: 4px 8px; border: 1px solid #e2e8f0;">${f.value || '-'}</td>
    </tr>
  `).join('');

  const tableHeadHtml = tableHeaders.map(h => `
    <th style="background-color: #0f172a; color: #ffffff; padding: 8px 10px; font-size: 11px; text-align: left; border: 1px solid #334155;">${h}</th>
  `).join('');

  const tableRowsHtml = tableRows.map((row, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      ${row.map(cell => `<td style="padding: 6px 10px; font-size: 10.5px; border: 1px solid #cbd5e1; color: #1e293b;">${cell}</td>`).join('')}
    </tr>
  `).join('');

  const fullWordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 24px;
          color: #0f172a;
          background: #ffffff;
        }
        .page-container {
          border: 2px solid #1e293b;
          padding: 24px;
          min-height: 900px;
          position: relative;
        }
        .header-table {
          width: 100%;
          border-bottom: 2px solid #cbd5e1;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 4px 0;
        }
        .doc-title {
          font-size: 16px;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          margin: 16px 0;
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
        .footer-table {
          width: 100%;
          margin-top: 40px;
          border-top: 1px solid #cbd5e1;
          padding-top: 14px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header -->
        <table class="header-table" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 80px;">
              <div style="width: 60px; height: 60px; background-color: #0284c7; color: #ffffff; font-weight: bold; font-size: 18px; text-align: center; line-height: 60px; border-radius: 8px;">CTI</div>
            </td>
            <td style="vertical-align: top;">
              <h1 class="company-title">
                <span style="color: #0284c7;">CODETHRIVE</span>
                <span style="color: #059669;"> INFOTECH</span>
              </h1>
              <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                ${COMPANY_INFO.address}<br>
                Email: ${COMPANY_INFO.email} | Website: ${COMPANY_INFO.website}
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

        <!-- Official Signatory Footer -->
        <table class="footer-table" style="width: 100%; border-collapse: collapse; margin-top: 50px;">
          <tr>
            <td style="vertical-align: bottom; font-size: 9.5px; color: #64748b; width: 60%;">
              * This is an officially generated computer document from CodeThrive Infotech Portal.<br>
              Generated on: ${new Date().toLocaleDateString('en-GB')} • System Verified<br>
              Confidential & Proprietary • Valid without physical seal
            </td>
            <td style="vertical-align: bottom; text-align: right; font-size: 11px; color: #1e293b;">
              Sincerely,<br>
              <strong>For CodeThrive Infotech</strong><br><br><br>
              <strong>Authorised Signatory</strong>
            </td>
          </tr>
        </table>
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

