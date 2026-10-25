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
 * Draw Official Company Letterhead Header (Matching First Screenshot)
 * - Logo on left
 * - CODETHRIVE INFOTECH (Times, Bold, Teal/Navy Branding)
 * - Address line (Times, Normal)
 * - Email | Website (Times, Normal)
 * - Horizontal Divider Line across width
 */
export const drawCompanyHeader = (doc, logoData, pageW = 210, startY = 14) => {
  const margin = 10;
  const logoW = 20;
  const logoH = 20;
  const logoX = 14;
  const logoY = startY;

  // 1. Logo on top-left
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
    } catch (e) {
      // Fallback geometric emblem
      doc.setFillColor(0, 91, 148);
      doc.roundedRect(logoX, logoY, logoW, logoH, 2.5, 2.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.text('CTI', logoX + logoW / 2, logoY + 12, { align: 'center' });
    }
  }

  // 2. Company Name & Credentials in Serif Times font
  const textX = 38;

  // "CODETHRIVE INFOTECH"
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 91, 148); // Corporate Deep Teal / Blue
  doc.text('CODETHRIVE INFOTECH', textX, startY + 6);

  // Address
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(COMPANY_INFO.address, textX, startY + 12.5);

  // Contact line
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Email: ${COMPANY_INFO.email} | Website: ${COMPANY_INFO.website.replace('www.', '')}`, textX, startY + 18);

  // 3. Header Divider Line
  const dividerY = startY + 23;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  return dividerY + 4;
};

/**
 * Draw Document Title & Meta Grid
 */
export const drawDocumentTitleAndMeta = (doc, title, metaFields = [], startY = 42, pageW = 210) => {
  let currentY = startY + 5;

  // Document Title (Centered, Bold, Underlined, Times)
  doc.setFont('times', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), pageW / 2, currentY, { align: 'center' });

  // Underline title
  const titleWidth = doc.getTextWidth(title.toUpperCase());
  doc.setDrawColor(0, 91, 148);
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - titleWidth / 2 - 2, currentY + 2, pageW / 2 + titleWidth / 2 + 2, currentY + 2);

  currentY += 8;

  // Metadata Box (if fields provided)
  if (metaFields && metaFields.length > 0) {
    const boxX = 12;
    const boxW = pageW - 24;
    const rowHeight = 6;
    const numRows = Math.ceil(metaFields.length / 2);
    const boxH = numRows * rowHeight + 6;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(boxX, currentY, boxW, boxH, 2, 2, 'FD');

    doc.setFontSize(8.5);
    metaFields.forEach((field, idx) => {
      const isLeft = idx % 2 === 0;
      const rowIndex = Math.floor(idx / 2);
      const fieldX = isLeft ? boxX + 6 : boxX + boxW / 2 + 6;
      const fieldY = currentY + 5 + rowIndex * rowHeight;

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
 * Draw Authorised Signatory Block (Right-aligned, from Experience Certificate)
 */
export const drawSignatoryBlock = (doc, pageW = 210, y = 230) => {
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Sincerely,', pageW - 22, y, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('For CodeThrive Infotech', pageW - 22, y + 6, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Authorised Signatory', pageW - 22, y + 24, { align: 'right' });
};

/**
 * Draw Official Footer Bar (Matching EXACT Second Screenshot)
 * - Solid Royal Blue Horizontal Bar Line (#0052a5)
 * - 🌐 www.codethriveinfotech.in
 * - 📞 9150781685 (with dark badge + cyan phone)
 * - ✉️ codethriveinfotech@gmail.com (with blue envelope)
 */
export const drawCompanyFooter = (doc, pageW = 210, pageH = 297) => {
  const margin = 10;
  const footerLineY = pageH - 20;

  // 1. Solid Royal Blue Bar Line across the entire width inside margin
  doc.setDrawColor(0, 82, 165); // #0052a5
  doc.setLineWidth(1.3);
  doc.line(margin, footerLineY, pageW - margin, footerLineY);

  // 2. Contact Items below the line (y-center)
  const contentY = footerLineY + 6.5;

  // Item 1 (Left): 🌐 www.codethriveinfotech.in
  const globeX = margin + 5;
  doc.setDrawColor(0, 82, 165);
  doc.setLineWidth(0.35);
  doc.circle(globeX, contentY - 1, 2.7);
  doc.line(globeX - 2.7, contentY - 1, globeX + 2.7, contentY - 1);
  doc.line(globeX, contentY - 3.7, globeX, contentY + 1.7);
  doc.ellipse(globeX, contentY - 1, 1.35, 2.7);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.website, globeX + 4.8, contentY);

  // Item 2 (Center): 📞 9150781685
  const phoneX = pageW > 250 ? pageW / 2 - 15 : 94;
  doc.setFillColor(30, 41, 59);
  doc.circle(phoneX, contentY - 1, 2.7, 'F');

  // Phone handset vector lines in cyan #38bdf8
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.5);
  doc.line(phoneX - 1.2, contentY - 0.2, phoneX - 0.7, contentY - 1.7);
  doc.line(phoneX - 0.7, contentY - 1.7, phoneX - 0.2, contentY - 1.4);
  doc.line(phoneX - 1.2, contentY - 0.2, phoneX + 0.5, contentY + 0.3);
  doc.line(phoneX + 0.5, contentY + 0.3, phoneX + 1.1, contentY - 0.3);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.phone, phoneX + 4.8, contentY);

  // Item 3 (Right): ✉️ codethriveinfotech@gmail.com
  const mailX = pageW > 250 ? pageW - margin - 75 : 142;
  doc.setFillColor(0, 82, 165);
  doc.roundedRect(mailX - 2.7, contentY - 2.8, 5.4, 3.8, 0.4, 0.4, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(mailX - 2.7, contentY - 2.8, mailX, contentY - 0.7);
  doc.line(mailX + 2.7, contentY - 2.8, mailX, contentY - 0.7);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(COMPANY_INFO.email, mailX + 4.8, contentY);
};

/**
 * Standard CodeThrive Corporate Table Theme in Times New Roman
 */
export const getCorporateTableStyles = () => ({
  margin: { left: 12, right: 12 },
  headStyles: {
    fillColor: [0, 82, 165], // Royal Blue
    textColor: [255, 255, 255],
    fontSize: 9,
    font: 'times',
    fontStyle: 'bold',
    halign: 'left',
    cellPadding: 3
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252]
  },
  bodyStyles: {
    textColor: [30, 41, 59],
    fontSize: 8.5,
    font: 'times',
    cellPadding: 2.8,
    lineColor: [226, 232, 240],
    lineWidth: 0.2
  },
  styles: {
    font: 'times',
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
  doc.setFont('times', 'normal');

  const pageW = orientation === 'landscape' ? 297 : 210;
  const pageH = orientation === 'landscape' ? 210 : 297;

  // 1. Load logo
  const logoData = await getLogoDataUrl();

  // 2. Draw border frame on Page 1
  drawPageBorder(doc, pageW, pageH, 10);

  // 3. Draw Header
  const afterHeaderY = drawCompanyHeader(doc, logoData, pageW, 14);

  // 4. Draw Title & Meta
  const startY = drawDocumentTitleAndMeta(doc, title, metaFields, afterHeaderY, pageW);

  // Helper to seal multi-page documents with border & footer
  const finalizeDoc = (filename) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Ensure border on every page
      drawPageBorder(doc, pageW, pageH, 10);
      // Ensure exact footer on every page
      drawCompanyFooter(doc, pageW, pageH);
      // On the final page, draw the Signatory Block if there is space
      if (i === totalPages) {
        const finalContentY = doc.lastAutoTable?.finalY || 160;
        const sigY = Math.min(Math.max(finalContentY + 12, 226), pageH - 48);
        if (sigY <= pageH - 35) {
          drawSignatoryBlock(doc, pageW, sigY);
        }
      }
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
