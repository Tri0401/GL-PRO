import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportKopData {
  companyName: string;
  companyTagline: string;
  companyAddress: string;
  companyContact: string;
  documentNumber: string;
  reportTitle: string;
  reportPeriod: string;
  preparedBy: string;
  preparedByRole: string;
  approvedBy: string;
  approvedByRole: string;
  signatureCity: string;
  signatureDate: string;
  notes?: string;
}

export const DEFAULT_REPORT_KOP: ReportKopData = {
  companyName: 'GL PRO PRODUCTION',
  companyTagline: 'Professional Sound System, Lighting, LED Videotron, Stage & Event Production',
  companyAddress: 'Kawasan Pergudangan Logistik Industri, Blok B No. 12-14, Jakarta',
  companyContact: 'Telp: (021) 4890123 / WA: 0812-3456-7890 | Email: operasional@glpro.co.id',
  documentNumber: `GLP/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/01`,
  reportTitle: 'LAPORAN OPERASIONAL & INVENTARIS',
  reportPeriod: `Per ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  preparedBy: 'Bayu Nugroho',
  preparedByRole: 'Admin Gudang & Inventaris',
  approvedBy: 'Hendro Wijaya',
  approvedByRole: 'Operational & Logistics Manager',
  signatureCity: 'Jakarta',
  signatureDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  notes: 'Dokumen ini merupakan laporan resmi operasional GL PRO PRODUCTION yang dicetak dari sistem terintegrasi.'
};

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || !data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName = 'Data') {
  if (!data || !data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Generate a beautifully formatted PDF report with customizable letterhead (KOP)
 * and orange-white themed tables using jsPDF and jspdf-autotable.
 */
export function generateStyledReportPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  kopData: ReportKopData = DEFAULT_REPORT_KOP,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // 1. KOP SURAT (Letterhead)
  // Orange accent badge
  doc.setFillColor(234, 88, 12); // #ea580c (Orange GL PRO)
  doc.roundedRect(marginX, 12, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GL', marginX + 2.5, 18.5);

  // Company Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(kopData.companyName.toUpperCase(), marginX + 13, 17);

  // Subtitle / Tagline
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(kopData.companyTagline, marginX + 13, 21.5);

  // Address & Contact
  doc.setFontSize(7);
  doc.text(`${kopData.companyAddress} | ${kopData.companyContact}`, marginX + 13, 25.5);

  // Right side: Document Number & Date Box
  doc.setFillColor(255, 247, 237); // light orange background
  doc.setDrawColor(254, 215, 170); // border orange-200
  doc.roundedRect(pageWidth - marginX - 58, 11, 58, 16, 1.5, 1.5, 'FD');

  doc.setTextColor(194, 65, 12); // orange-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('NO. DOKUMEN:', pageWidth - marginX - 55, 15.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(kopData.documentNumber, pageWidth - marginX - 55, 19.5);

  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('TANGGAL CETAK:', pageWidth - marginX - 55, 23.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), pageWidth - marginX - 25, 23.5);

  // Double decorative divider lines (Kop separator)
  doc.setDrawColor(234, 88, 12); // orange-600
  doc.setLineWidth(1.2);
  doc.line(marginX, 30, pageWidth - marginX, 30);

  doc.setDrawColor(253, 186, 116); // orange-300
  doc.setLineWidth(0.4);
  doc.line(marginX, 32, pageWidth - marginX, 32);

  // 2. Report Title & Meta
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const activeTitle = kopData.reportTitle || title;
  doc.text(activeTitle.toUpperCase(), marginX, 39);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Periode: ${kopData.reportPeriod}  •  Total Data: ${rows.length} Baris`, marginX, 43.5);

  // 3. Orange-White Styled Table via jspdf-autotable
  autoTable(doc, {
    startY: 47,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12], // Orange-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
      lineWidth: 0.2,
      lineColor: [194, 65, 12] // Darker orange border
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59], // Slate-800
      cellPadding: 2,
      lineColor: [254, 215, 170], // Light orange border
      lineWidth: 0.15,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237] // Light warm orange tint (#fff7ed)
    },
    styles: {
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    margin: { left: marginX, right: marginX, bottom: 35 },
    didDrawPage: (data) => {
      // Footer page numbering & watermark on each page
      const pageStr = `Halaman ${data.pageNumber}`;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(pageStr, pageWidth - marginX - 15, pageHeight - 10);
      doc.text(
        `Dicetak otomatis oleh Sistem Inventaris & Operasional GL PRO PRODUCTION • ${new Date().toLocaleString('id-ID')}`,
        marginX,
        pageHeight - 10
      );
    }
  });

  // 4. Signature Block on final page
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  let signatureY = finalY + 8;

  // If signature block overflows current page, add new page
  if (signatureY + 28 > pageHeight - 15) {
    doc.addPage();
    signatureY = 20;
  }

  // Signature Block
  const sigColWidth = 55;
  const leftSigX = marginX + 10;
  const rightSigX = pageWidth - marginX - sigColWidth - 10;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');

  // Left: Pembuat Laporan
  doc.text('Dibuat & Diverifikasi Oleh,', leftSigX, signatureY);
  doc.text(kopData.preparedByRole, leftSigX, signatureY + 4);
  
  // Right: Mengetahui / Menyetujui
  doc.text(`${kopData.signatureCity}, ${kopData.signatureDate}`, rightSigX, signatureY);
  doc.text('Disetujui Oleh,', rightSigX, signatureY + 4);
  doc.text(kopData.approvedByRole, rightSigX, signatureY + 8);

  // Signature lines
  doc.setDrawColor(203, 213, 225);
  doc.line(leftSigX, signatureY + 22, leftSigX + sigColWidth, signatureY + 22);
  doc.line(rightSigX, signatureY + 22, rightSigX + sigColWidth, signatureY + 22);

  // Names under line
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${kopData.preparedBy} )`, leftSigX, signatureY + 25.5);
  doc.text(`( ${kopData.approvedBy} )`, rightSigX, signatureY + 25.5);

  doc.save(`${filename}.pdf`);
}

export interface DocumentKopData {
  companyName: string;
  companyTagline: string;
  companyAddress: string;
  companyContact: string;
  documentNumber: string;
  documentTitle: string;
  documentDate: string;
  documentTime?: string;
  signatureCity: string;
  signatureDate: string;
  notes?: string;
  warehouseSignerTitle: string;
  warehouseSignerName: string;
  driverSignerTitle: string;
  driverSignerName: string;
  venueSignerTitle: string;
  venueSignerName: string;
}

export const DEFAULT_DOC_KOP: DocumentKopData = {
  companyName: 'GL PRO PRODUCTION',
  companyTagline: 'Professional Sound System, Lighting, LED Videotron, Stage & Event Production',
  companyAddress: 'Kawasan Pergudangan Logistik Industri, Blok B No. 12-14, Jakarta',
  companyContact: 'Telp: (021) 4890123 / WA: 0812-3456-7890 | Email: logistik@glpro.co.id',
  documentNumber: 'SJ-20260927-0001',
  documentTitle: 'SURAT JALAN PENGIRIMAN BARANG',
  documentDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  documentTime: '10:00 WIB',
  signatureCity: 'Jakarta',
  signatureDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  notes: 'Barang yang tercantum telah diverifikasi fisik di gudang. Segala kerusakan atau kekurangan saat tiba wajib dilaporkan segera.',
  warehouseSignerTitle: 'Diserahkan Oleh (Gudang)',
  warehouseSignerName: 'Bayu Nugroho',
  driverSignerTitle: 'Dibawa Oleh (Driver)',
  driverSignerName: 'Agus Santoso',
  venueSignerTitle: 'Diterima Oleh (PIC Venue)',
  venueSignerName: 'Ferry Irawan'
};

/**
 * Backward compatibility alias for generateSimplePDF
 */
export function generateSimplePDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  kopData: ReportKopData = DEFAULT_REPORT_KOP
) {
  generateStyledReportPDF(title, headers, rows, filename, kopData, 'portrait');
}

/**
 * Generate a beautifully formatted Check-in / Check-out PDF document
 * with customizable KOP letterhead, orange-white themed tables, and signature blocks.
 */
export function generateStyledDocumentPDF(
  docData: {
    type: string;
    title: string;
    documentNumber: string;
    date: string;
    time?: string;
    eventName?: string;
    clientName?: string;
    venueName?: string;
    venueAddress?: string;
    driverName?: string;
    vehiclePlate?: string;
    vehicleType?: string;
    warehouseName?: string;
    picName?: string;
    inspectorName?: string;
    crewAssignments?: {
      id?: string;
      crewName: string;
      eventRole: string;
      division?: string;
      contact?: string;
    }[];
    items?: {
      no: number;
      code: string;
      name: string;
      qty: number;
      unit: string;
      condition?: string;
      serialOrCase?: string;
      notes?: string;
      diff?: number;
    }[];
  },
  kop: DocumentKopData = DEFAULT_DOC_KOP,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // 1. KOP SURAT (Letterhead)
  // Orange accent badge
  doc.setFillColor(234, 88, 12); // #ea580c (Orange GL PRO)
  doc.roundedRect(marginX, 12, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GL', marginX + 2.5, 18.5);

  // Company Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(kop.companyName.toUpperCase(), marginX + 13, 17);

  // Subtitle / Tagline
  doc.setTextColor(194, 65, 12); // orange-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(kop.companyTagline, marginX + 13, 21.5);

  // Address & Contact
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${kop.companyAddress} | ${kop.companyContact}`, marginX + 13, 25.5);

  // Right side: Document Number & Date Box
  doc.setFillColor(255, 247, 237); // light orange background
  doc.setDrawColor(254, 215, 170); // border orange-200
  doc.roundedRect(pageWidth - marginX - 60, 11, 60, 16, 1.5, 1.5, 'FD');

  doc.setTextColor(194, 65, 12); // orange-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('NO. DOKUMEN:', pageWidth - marginX - 57, 15.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(kop.documentNumber || docData.documentNumber, pageWidth - marginX - 57, 19.5);

  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('TANGGAL:', pageWidth - marginX - 57, 23.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(kop.documentDate || docData.date, pageWidth - marginX - 25, 23.5);

  // Double decorative divider lines
  doc.setDrawColor(234, 88, 12); // orange-600
  doc.setLineWidth(1.2);
  doc.line(marginX, 30, pageWidth - marginX, 30);

  doc.setDrawColor(253, 186, 116); // orange-300
  doc.setLineWidth(0.4);
  doc.line(marginX, 32, pageWidth - marginX, 32);

  // 2. Title Banner
  const isCheckin = docData.type === 'CHECKIN_RECONCILIATION';
  const defaultTitle = isCheckin
    ? 'BERITA ACARA CHECK-IN & REKONSILIASI GUDANG'
    : 'SURAT JALAN PENGIRIMAN BARANG';
  const displayTitle = kop.documentTitle || docData.title || defaultTitle;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(displayTitle.toUpperCase(), marginX, 38);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Event: ${docData.eventName || '-'}  •  Total Item: ${docData.items?.length || 0} Jenis Peralatan`,
    marginX,
    42.5
  );

  // 3. Metadata Card / Box
  let currentY = 46;
  if (!isCheckin) {
    // Check-out / Surat Jalan Meta Card
    const metaHeaders = ['KETERANGAN PENGIRIMAN', 'DETAIL LOGISTIK & EVENT'];
    const metaRows = [
      [
        `Nama Event: ${docData.eventName || '-'}\nClient: ${docData.clientName || '-'}\nVenue: ${docData.venueName || '-'}\nAlamat: ${docData.venueAddress || '-'}`,
        `Gudang Asal: ${docData.warehouseName || '-'}\nArmada: ${docData.vehicleType || '-'} (${docData.vehiclePlate || '-'})\nDriver: ${docData.driverName || '-'}\nPIC Venue: ${docData.picName || '-'}`
      ]
    ];
    autoTable(doc, {
      startY: currentY,
      head: [metaHeaders],
      body: metaRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 237, 213], // orange-100
        textColor: [154, 52, 18], // orange-800
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
        lineColor: [254, 215, 170]
      },
      margin: { left: marginX, right: marginX }
    });
    currentY = (doc as any).lastAutoTable?.finalY + 4;
  } else {
    // Check-in Meta Card
    const metaHeaders = ['INFORMASI PENGEMBALIAN EVENT', 'STATUS PEMERIKSAAN FISIK'];
    const metaRows = [
      [
        `Nama Event: ${docData.eventName || '-'}\nGudang Penerima: ${docData.warehouseName || '-'}\nTanggal Pengembalian: ${docData.date || '-'} ${docData.time ? `jam ${docData.time} WIB` : ''}`,
        `Pemeriksa / Inspector: ${docData.inspectorName || '-'}\nPIC Penyerahan Event: ${docData.picName || '-'}\nStatus: Pemeriksaan Selesai & Dicatat di Sistem`
      ]
    ];
    autoTable(doc, {
      startY: currentY,
      head: [metaHeaders],
      body: metaRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 237, 213],
        textColor: [154, 52, 18],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
        lineColor: [254, 215, 170]
      },
      margin: { left: marginX, right: marginX }
    });
    currentY = (doc as any).lastAutoTable?.finalY + 4;
  }

  // 3b. Crew Team Assignments on Duty Table
  if (docData.crewAssignments && docData.crewAssignments.length > 0) {
    const crewHeaders = ['NO', 'NAMA ANGGOTA KRU', 'PERAN DI EVENT', 'DIVISI', 'KONTAK / WA'];
    const crewRows = docData.crewAssignments.map((cr, idx) => [
      idx + 1,
      cr.crewName,
      cr.eventRole,
      cr.division || '-',
      cr.contact || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [crewHeaders],
      body: crewRows,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12], // orange-600
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 1.8
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
        lineColor: [254, 215, 170]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold' }
      },
      margin: { left: marginX, right: marginX }
    });
    currentY = (doc as any).lastAutoTable?.finalY + 4;
  }

  // 4. Equipment Table
  if (!isCheckin) {
    // Table Check-out / Surat Jalan
    const tableHeaders = ['NO', 'KODE ALAT', 'NAMA PERALATAN', 'QTY', 'SATUAN', 'KONDISI', 'KETERANGAN / CASE'];
    const tableRows = (docData.items || []).map((it, idx) => [
      idx + 1,
      it.code,
      it.name,
      it.qty,
      it.unit,
      it.condition || 'Baik',
      it.serialOrCase || it.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12], // Orange-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [194, 65, 12]
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2,
        lineColor: [254, 215, 170],
        lineWidth: 0.15,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [255, 247, 237]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 22 }
      },
      margin: { left: marginX, right: marginX, bottom: 42 }
    });
  } else {
    // Table Check-in / Rekonsiliasi
    const tableHeaders = ['NO', 'KODE ALAT', 'NAMA BARANG', 'KELUAR', 'KEMBALI', 'SELISIH', 'KONDISI', 'CATATAN INSPEKSI'];
    const tableRows = (docData.items || []).map((it, idx) => {
      const returned = it.qty - (it.diff || 0);
      const diffStr = (it.diff && it.diff > 0) ? `-${it.diff}` : '0';
      return [
        idx + 1,
        it.code,
        it.name,
        it.qty,
        returned,
        diffStr,
        it.condition || 'Baik',
        it.notes || '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [194, 65, 12]
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2,
        lineColor: [254, 215, 170],
        lineWidth: 0.15,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [255, 247, 237]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 24 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        6: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: marginX, right: marginX, bottom: 42 }
    });
  }

  // 5. Notes & Ketentuan
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  let signatureY = finalY + 6;

  if (signatureY + 34 > pageHeight - 15) {
    doc.addPage();
    signatureY = 20;
  }

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const notesText = kop.notes || docData.time
    ? `${kop.notes || 'Seluruh peralatan di atas telah diverifikasi.'} Dicatat pada ${docData.date} ${docData.time ? `jam ${docData.time} WIB.` : ''}`
    : kop.notes;
  if (notesText) {
    doc.text(notesText, marginX, signatureY);
  }

  // 6. Signatures
  signatureY += 6;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  if (!isCheckin) {
    // 3 Signatures: Gudang, Driver, Venue PIC
    const colW = (pageWidth - marginX * 2 - 16) / 3;
    const col1X = marginX;
    const col2X = marginX + colW + 8;
    const col3X = marginX + (colW + 8) * 2;

    doc.text(kop.warehouseSignerTitle || 'Diserahkan Oleh (Gudang):', col1X, signatureY);
    doc.text(kop.driverSignerTitle || 'Dibawa Oleh (Driver):', col2X, signatureY);
    doc.text(
      `${kop.signatureCity}, ${kop.signatureDate || docData.date}\n${kop.venueSignerTitle || 'Diterima Oleh (PIC Venue):'}`,
      col3X,
      signatureY
    );

    doc.setDrawColor(203, 213, 225);
    doc.line(col1X, signatureY + 18, col1X + colW - 5, signatureY + 18);
    doc.line(col2X, signatureY + 18, col2X + colW - 5, signatureY + 18);
    doc.line(col3X, signatureY + 18, col3X + colW - 5, signatureY + 18);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${kop.warehouseSignerName || docData.warehouseName || 'Staff Gudang'} )`, col1X, signatureY + 22);
    doc.text(`( ${kop.driverSignerName || docData.driverName || 'Driver Ekspedisi'} )`, col2X, signatureY + 22);
    doc.text(`( ${kop.venueSignerName || docData.picName || 'PIC Event'} )`, col3X, signatureY + 22);
  } else {
    // 2 Signatures: Pemeriksa Gudang & PIC Event
    const colW = 60;
    const col1X = marginX + 15;
    const col2X = pageWidth - marginX - colW - 15;

    doc.text(kop.warehouseSignerTitle || 'Pemeriksa Gudang (Inspeksi Fisik):', col1X, signatureY);
    doc.text(
      `${kop.signatureCity}, ${kop.signatureDate || docData.date}\n${kop.venueSignerTitle || 'PIC Penyerahan Event:'}`,
      col2X,
      signatureY
    );

    doc.setDrawColor(203, 213, 225);
    doc.line(col1X, signatureY + 18, col1X + colW, signatureY + 18);
    doc.line(col2X, signatureY + 18, col2X + colW, signatureY + 18);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${kop.warehouseSignerName || docData.inspectorName || 'Staff Inspeksi'} )`, col1X, signatureY + 22);
    doc.text(`( ${kop.venueSignerName || docData.picName || 'PIC Event'} )`, col2X, signatureY + 22);
  }

  // Footer text
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Sistem Terpadu Logistik & Operasional GL PRO PRODUCTION • Dicetak pada ${new Date().toLocaleString('id-ID')}`,
    marginX,
    pageHeight - 8
  );

  const cleanFilename = `${displayTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${(kop.documentNumber || docData.documentNumber || 'doc').replace(/[^a-zA-Z0-9]/g, '_')}`;
  doc.save(`${cleanFilename}.pdf`);
}
