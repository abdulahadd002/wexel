import ExcelJS from 'exceljs';

interface BillData {
  id: string;
  imageUrl: string;
  extractedData: any;
  totalAmount: any;
  billDate: Date;
  contact: {
    displayName: string;
    phoneNumber: string;
  };
}

export async function generateExcelSheet(
  bills: BillData[],
  sheetDate: Date
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wexel';
  workbook.created = new Date();

  const dateStr = sheetDate.toISOString().split('T')[0];
  const worksheet = workbook.addWorksheet(`Bills - ${dateStr}`);

  const allFields = new Set<string>();
  allFields.add('Contact');
  allFields.add('Phone');
  allFields.add('Image');
  allFields.add('Total');

  for (const bill of bills) {
    if (bill.extractedData && typeof bill.extractedData === 'object') {
      Object.keys(bill.extractedData).forEach((key) => {
        if (key !== 'total' && key !== 'items') {
          allFields.add(key);
        }
      });
    }
  }

  const columns = Array.from(allFields);
  worksheet.columns = columns.map((col) => ({
    header: formatColumnHeader(col),
    key: col,
    width: col === 'Image' ? 40 : 20,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const bill of bills) {
    const rowData: any = {
      Contact: bill.contact.displayName,
      Phone: bill.contact.phoneNumber,
      Image: bill.imageUrl,
      Total: bill.totalAmount ? Number(bill.totalAmount) : '',
    };

    if (bill.extractedData && typeof bill.extractedData === 'object') {
      Object.entries(bill.extractedData).forEach(([key, value]) => {
        if (key !== 'total' && key !== 'items' && allFields.has(key)) {
          rowData[key] = formatCellValue(value);
        }
      });
    }

    worksheet.addRow(rowData);
  }

  if (bills.some((b) => b.extractedData?.items?.length > 0)) {
    const itemsSheet = workbook.addWorksheet(`Items - ${dateStr}`);
    itemsSheet.columns = [
      { header: 'Bill ID', key: 'billId', width: 15 },
      { header: 'Contact', key: 'contact', width: 20 },
      { header: 'Item Name', key: 'name', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Price', key: 'price', width: 15 },
    ];

    const itemsHeaderRow = itemsSheet.getRow(1);
    itemsHeaderRow.font = { bold: true };
    itemsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    itemsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const bill of bills) {
      const items = bill.extractedData?.items || [];
      for (const item of items) {
        itemsSheet.addRow({
          billId: bill.id.slice(0, 8),
          contact: bill.contact.displayName,
          name: item.name || '',
          quantity: item.quantity || '',
          price: item.price || '',
        });
      }
    }
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const grossSales = bills.reduce(
    (sum, bill) => sum + (Number(bill.totalAmount) || 0),
    0
  );

  summarySheet.addRow({ metric: 'Date', value: dateStr });
  summarySheet.addRow({ metric: 'Total Bills', value: bills.length });
  summarySheet.addRow({ metric: 'Gross Sales', value: grossSales });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function formatColumnHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatCellValue(value: any): string | number {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}
