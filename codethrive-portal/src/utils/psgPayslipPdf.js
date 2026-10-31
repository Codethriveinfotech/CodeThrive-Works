/**
 * CodeThrive Dot-Matrix / PSG Hospital Style Compact Payslip PDF Generator
 * Matches the exact PSG Hospital reference voucher structure:
 * - Dotted dividing lines
 * - Compact monospaced/courier presentation or crisp sans font
 * - Clean layout: Header, Employee Identity Bar, 4-column Details, Earnings vs Deductions, Leave Status Table, GROSS | TOT DED | NET AMT summary bar
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_INFO } from './pdfLetterhead.js';

export const generatePsgStylePayslipPdf = async ({
  payslip,
  overrideMonth,
  overrideDate,
  currentUser
}) => {
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape perfectly fits the PSG 4-column + Leave layout!
    unit: 'mm',
    format: 'a4' // 297mm x 210mm
  });

  const pageW = 297;
  const pageH = 210;
  const margin = 12;
  const contentW = pageW - margin * 2; // 273mm

  const monthStr = overrideMonth || payslip.month || 'October 2026';
  const issueDateStr = overrideDate ? new Date(overrideDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  const empName = payslip.employee?.fullName || currentUser?.fullName || currentUser?.name || 'Kirubakaran V';
  const empId = payslip.employee?.employeeId || currentUser?.employeeId || 'CTI-2026-001';
  const empDept = payslip.employee?.department || currentUser?.department || 'INFORMATION TECHNOLOGY';
  const empDesg = payslip.employee?.designation || currentUser?.designation || 'PROGRAM ANALYST';

  const basic = Number(payslip.basicSalary || 0);
  const da = Number(payslip.allowanceDetails?.da || Math.round(basic * 0.1) || 0);
  const hra = Number(payslip.allowanceDetails?.hra || Math.round(basic * 0.25) || 0);
  const ca = Number(payslip.allowanceDetails?.conveyance || 3000);
  const aa = Number(payslip.allowanceDetails?.academicAllowance || payslip.allowanceDetails?.travel || 0);
  const allow = Number(payslip.allowanceDetails?.other || payslip.allowanceDetails?.medical || 0);
  const misEngs1 = Number(payslip.allowanceDetails?.misEngs1 || 0);
  const misEngs2 = Number(payslip.allowanceDetails?.misEngs2 || 0);

  const epfMem = Number(payslip.deductionDetails?.pf || Math.round(basic * 0.12) || 0);
  const epfE = epfMem;
  const epsMem = Number(payslip.deductionDetails?.epsMem || 0);
  const epsE = Number(payslip.deductionDetails?.epsE || 0);
  const itDed = Number(payslip.deductionDetails?.incomeTax || 0);
  const esi = Number(payslip.deductionDetails?.esi || 0);
  const misDeds1 = Number(payslip.deductionDetails?.loanAdvance || 0);
  const misDeds2 = Number(payslip.deductionDetails?.professionalTax || 150);
  const misDeds3 = Number(payslip.deductionDetails?.other || 0);

  const grossSalary = Number(payslip.grossSalary || (basic + da + hra + ca + aa + allow + misEngs1 + misEngs2));
  const totDed = Number(payslip.deductions || (epfMem + itDed + esi + misDeds1 + misDeds2 + misDeds3));
  const netSalary = Number(payslip.netPayable || (grossSalary - totDed));

  const empInfo = payslip.employeeInfo || {};
  const dob = empInfo.dob ? (empInfo.dob.includes('-') ? empInfo.dob.toUpperCase() : empInfo.dob) : '23-JAN-03';
  const doj = empInfo.doj ? (empInfo.doj.includes('-') ? empInfo.doj.toUpperCase() : empInfo.doj) : '03-APR-26';
  const bkAcNo = empInfo.bankAcNo || 'XXXX-XXXX-4521';
  const pfPercent = empInfo.pfPercent || 12;
  const pfNo = empInfo.pfNo || '12';
  const esiNo = empInfo.esiNo || '-';

  const leave = payslip.leaveStatus || {
    cl: { eligible: 9.0, availed: 0.0, balance: 9.0 },
    el: { eligible: 0.0, availed: 0.0, balance: 0.0 },
    ml: { eligible: 0.0, availed: 0.0, balance: 0.0 },
    lop: 0.0
  };

  // Helper for dashed rule
  const drawDashedLine = (y) => {
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([1.5, 1.2], 0);
    doc.line(margin, y, pageW - margin, y);
    doc.setLineDashPattern([], 0); // Reset
  };

  // Helper for solid clean rule
  const drawSolidLine = (y, color = [40, 40, 40], width = 0.3) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(width);
    doc.line(margin, y, pageW - margin, y);
  };

  // Outer border box (Professional slip outline)
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.4);
  doc.rect(margin - 2, margin - 2, contentW + 4, 186, 'S');

  let curY = margin + 4;

  // 1. Top Right Page# indicator (Just like PSG)
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.rect(pageW - margin - 22, curY - 3, 22, 6);
  doc.text('Page#: 1', pageW - margin - 20, curY + 1.2);

  curY += 6;
  drawDashedLine(curY);
  curY += 5;

  // 2. Organization Header Bar
  // Left: CODETHRIVE INFOTECH, COIMBATORE-45 | Center: PAYSLIP | Right: Month & Year : April-2026   S No : 1
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('CODETHRIVE INFOTECH, COIMBATORE-45', margin + 2, curY);

  doc.setFontSize(10.5);
  doc.text('PAYSLIP', pageW / 2 - 12, curY);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  const sNoStr = String(payslip.payslipId || '1').replace(/[^0-9]/g, '') || '1';
  doc.text(`Month & Year :   ${monthStr}          S No :  ${sNoStr}`, pageW - margin - 95, curY);

  curY += 6;

  // 3. Employee Identification Line
  // ADM NO : 214359   NAME : JIDENDRAN NATARAJAN   F/H: NATARAJAN   DEPT : INFORMATION TECHNOLOGY   DESG : PROGRAM ANALYST
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('ADM NO  :', margin + 2, curY);
  doc.setFont('courier', 'normal');
  doc.text(String(empId).toUpperCase(), margin + 20, curY);

  doc.setFont('courier', 'bold');
  doc.text('NAME :', margin + 55, curY);
  doc.setFont('courier', 'normal');
  doc.text(String(empName).toUpperCase(), margin + 70, curY);

  doc.setFont('courier', 'bold');
  doc.text('F/H: -', margin + 140, curY);

  doc.setFont('courier', 'bold');
  doc.text('DEPT :', margin + 162, curY);
  doc.setFont('courier', 'normal');
  doc.text(String(empDept).toUpperCase(), margin + 177, curY);

  doc.setFont('courier', 'bold');
  doc.text('DESG :', margin + 230, curY);
  doc.setFont('courier', 'normal');
  const shortDesg = String(empDesg).toUpperCase().substring(0, 18);
  doc.text(shortDesg, margin + 244, curY);

  curY += 4;
  drawDashedLine(curY);
  curY += 6;

  // 4. Main Body: 5 Columns Grid
  // Col 1: Personal Info (DOB, DOJ, BASIC, DA, BK AC No, PF %, PF No, ESI No)
  // Col 2: Earnings (Ear Basic, Ear DA, Ear HRA, Ear CA, Ear AA, Ear Allow, Mis Engs1, Mis Engs2)
  // Col 3: Deductions (EPF MEM, EPS MEM, IT Ded, ESI, Mis Deds1, Mis Deds2, Mis Deds3)
  // Col 4: Employer Contribution (EPF(E), EPS(E))
  // Col 5: Leave Status Table (CL, EL, ML, LOP | Eligible, Availed, Balance)

  const col1X = margin + 2;
  const col2X = margin + 52;
  const col3X = margin + 115;
  const col4X = margin + 175;
  const col5X = margin + 215;

  const rowHeight = 4.7;

  // Header for Leave Status
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('Leave Status', col5X + 16, curY);

  // Leave Status Table sub-columns
  doc.setFontSize(8.5);
  doc.text('CL', col5X + 22, curY + 4);
  doc.text('EL', col5X + 33, curY + 4);
  doc.text('ML', col5X + 44, curY + 4);
  doc.text('LOP', col5X + 54, curY + 4);

  // Line under CL EL ML LOP
  doc.setLineWidth(0.3);
  doc.setDrawColor(80, 80, 80);
  doc.line(col5X + 12, curY + 5.5, pageW - margin - 2, curY + 5.5);

  const startBodyY = curY;

  // Left Column: Personal details
  const personalData = [
    ['DOB', dob],
    ['DOJ', doj],
    ['BASIC', String(basic)],
    ['DA', String(da)],
    ['BK AC No', bkAcNo],
    ['PF %', String(pfPercent)],
    ['PF No', pfNo],
    ['ESI No', esiNo]
  ];

  personalData.forEach((row, i) => {
    const y = startBodyY + i * rowHeight;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${row[0].padEnd(9, ' ')}:  ${row[1]}`, col1X, y);
  });

  // Col 2: Earnings
  const earningsData = [
    ['Ear Basic', basic],
    ['Ear DA', da],
    ['Ear HRA', hra],
    ['Ear CA', ca],
    ['Ear AA', aa],
    ['Ear Allow', allow],
    ['Mis Engs1', misEngs1],
    ['Mis Engs2', misEngs2]
  ];

  earningsData.forEach((row, i) => {
    const y = startBodyY + i * rowHeight;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    const label = `${row[0].padEnd(10, ' ')}:`;
    doc.text(label, col2X, y);
    doc.text(String(row[1]).padStart(8, ' '), col2X + 38, y, { align: 'right' });
  });

  // Col 3: Deductions
  const deductionsData = [
    ['EPF MEM', epfMem],
    ['EPS MEM', epsMem],
    ['IT Ded', itDed],
    ['ESI', esi],
    ['Mis Deds1', misDeds1],
    ['Mis Deds2', misDeds2],
    ['Mis Deds3', misDeds3]
  ];

  deductionsData.forEach((row, i) => {
    const y = startBodyY + i * rowHeight;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    const label = `${row[0].padEnd(10, ' ')}:`;
    doc.text(label, col3X, y);
    doc.text(String(row[1]).padStart(8, ' '), col3X + 38, y, { align: 'right' });
  });

  // Col 4: Employer Share
  const employerData = [
    ['EPF(E) :', epfE],
    ['EPS(E) :', epsE]
  ];

  employerData.forEach((row, i) => {
    const y = startBodyY + i * rowHeight;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text(row[0], col4X, y);
    doc.text(String(row[1]).padStart(6, ' '), col4X + 26, y, { align: 'right' });
  });

  // Col 5: Leave Status Rows
  const leaveRows = [
    { label: 'Eligible', cl: leave.cl?.eligible ?? 9.0, el: leave.el?.eligible ?? 0.0, ml: leave.ml?.eligible ?? 0.0, lop: '' },
    { label: 'Availed', cl: leave.cl?.availed ?? 0.0, el: leave.el?.availed ?? 0.0, ml: leave.ml?.availed ?? 0.0, lop: (leave.lop ?? 0.0).toFixed(1) },
    { label: 'Balance', cl: leave.cl?.balance ?? 9.0, el: leave.el?.balance ?? 0.0, ml: leave.ml?.balance ?? 0.0, lop: '' }
  ];

  leaveRows.forEach((row, i) => {
    const y = startBodyY + 10 + i * rowHeight;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text(row.label.padEnd(9, ' '), col5X, y);
    doc.text(Number(row.cl).toFixed(1), col5X + 24, y, { align: 'right' });
    doc.text(Number(row.el).toFixed(1), col5X + 35, y, { align: 'right' });
    doc.text(Number(row.ml).toFixed(1), col5X + 46, y, { align: 'right' });
    if (row.lop !== '') {
      doc.text(row.lop, col5X + 57, y, { align: 'right' });
    }
  });

  // Month LOP Indicator below leave table
  const lopY = startBodyY + 10 + 3 * rowHeight + 4;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${monthStr}`, col5X, lopY);
  doc.text('LOP', col5X + 36, lopY);
  doc.setFont('courier', 'normal');
  doc.text(Number(leave.lop || 0).toFixed(1), col5X + 57, lopY, { align: 'right' });

  // 5. Bottom Dashed Rule & Summary Row
  const bottomRuleY = startBodyY + 9 * rowHeight + 3;
  drawDashedLine(bottomRuleY);

  const summaryY = bottomRuleY + 6;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('GROSS AMT  :', col2X, summaryY);
  doc.setFont('courier', 'normal');
  doc.text(String(grossSalary).padStart(8, ' '), col2X + 38, summaryY, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.text('TOT DED    :', col3X, summaryY);
  doc.setFont('courier', 'normal');
  doc.text(String(totDed).padStart(8, ' '), col3X + 38, summaryY, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.text('NET AMT: ', col4X, summaryY);
  doc.text(String(netSalary).padStart(8, ' '), col4X + 32, summaryY, { align: 'right' });

  const finalRuleY = summaryY + 5;
  drawDashedLine(finalRuleY);

  // 6. Professional Bottom Verification Note & Company Address
  const subFootY = finalRuleY + 8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(`Official Computer-Generated Salary Voucher — CodeThrive Infotech | Generated on: ${issueDateStr}`, margin + 2, subFootY);
  doc.text(`Website: ${COMPANY_INFO.website}  |  Email: ${COMPANY_INFO.email}  |  Phone: ${COMPANY_INFO.phone}`, pageW - margin - 2, subFootY, { align: 'right' });

  // Save PDF
  const cleanEmp = empName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `CodeThrive_Payslip_${cleanEmp}_${monthStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
};
