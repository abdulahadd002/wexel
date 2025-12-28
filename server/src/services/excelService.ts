import ExcelJS from 'exceljs';

interface BillData {
  id: string;
  imagePath: string;
  extractedData: any;
  totalAmount: any;
  billDate: Date;
}

// Define the fixed column order for bills/invoices
const INVOICE_COLUMNS = [
  'partyName',
  'billNo',
  'billDate',
  'total',
  'discount',
  'netTotal',
];

export async function generateExcelSheet(
  bills: BillData[],
  sheetDate: Date
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wexel';
  workbook.created = new Date();

  const dateStr = sheetDate.toISOString().split('T')[0];

  // Separate bills by document type
  const invoices = bills.filter((b) => b.extractedData?.documentType !== 'ledger');
  const ledgers = bills.filter((b) => b.extractedData?.documentType === 'ledger');

  // === BILLS SHEET (for invoices and simple ledger entries) ===
  const billsSheet = workbook.addWorksheet(`Bills - ${dateStr}`);
  billsSheet.columns = [
    { header: 'Party Name', key: 'partyName', width: 25 },
    { header: 'Bill No', key: 'billNo', width: 12 },
    { header: 'Bill Date', key: 'billDate', width: 12 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Net Total', key: 'netTotal', width: 15 },
  ];

  applyHeaderStyle(billsSheet.getRow(1));

  for (const bill of bills) {
    const data = bill.extractedData || {};

    // For ledger type, extract bill info from transactions
    if (data.documentType === 'ledger') {
      // Find the bill entry in transactions (debit entries)
      const billTransaction = data.transactions?.find((t: any) =>
        t.particulars?.toLowerCase().includes('bill') && t.debit > 0
      );

      billsSheet.addRow({
        partyName: data.partyName || '',
        billNo: billTransaction?.particulars?.match(/#?\d+/)?.[0] || '',
        billDate: billTransaction?.date || '',
        total: data.netTotal || billTransaction?.debit || 0,
        discount: 0,
        netTotal: data.netTotal || billTransaction?.debit || Number(bill.totalAmount) || 0,
      });
    } else {
      // Invoice type
      billsSheet.addRow({
        partyName: data.partyName || data.supplierName || '',
        billNo: data.billNo || '',
        billDate: data.billDate || '',
        total: data.total || 0,
        discount: data.discount || 0,
        netTotal: data.netTotal || Number(bill.totalAmount) || 0,
      });
    }
  }

  // Add totals row
  const totalNetTotal = bills.reduce(
    (sum, bill) => sum + (Number(bill.extractedData?.netTotal) || Number(bill.totalAmount) || 0),
    0
  );
  const totalDiscount = bills.reduce(
    (sum, bill) => sum + (Number(bill.extractedData?.discount) || 0),
    0
  );

  const totalsRow = billsSheet.addRow({
    partyName: 'TOTAL',
    billNo: '',
    billDate: '',
    total: '',
    discount: totalDiscount,
    netTotal: totalNetTotal,
  });
  totalsRow.font = { bold: true };
  totalsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2EFDA' },
  };

  // === ITEMS SHEET (for invoices with line items) ===
  if (bills.some((b) => b.extractedData?.items?.length > 0)) {
    const itemsSheet = workbook.addWorksheet(`Items - ${dateStr}`);
    itemsSheet.columns = [
      { header: 'Party Name', key: 'partyName', width: 25 },
      { header: 'Bill No', key: 'billNo', width: 12 },
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];

    applyHeaderStyle(itemsSheet.getRow(1));

    for (const bill of bills) {
      const data = bill.extractedData || {};
      const items = data.items || [];
      const partyName = data.partyName || data.supplierName || '';
      const billNo = data.billNo || '';

      for (const item of items) {
        itemsSheet.addRow({
          partyName,
          billNo,
          item: item.item || item.name || '',
          qty: item.qty || item.quantity || 0,
          unitPrice: item.unitPrice || item.price || 0,
          amount: item.amount || 0,
        });
      }
    }
  }

  // === LEDGER TRANSACTIONS SHEET (for ledger documents) ===
  if (ledgers.length > 0) {
    const ledgerSheet = workbook.addWorksheet(`Ledger - ${dateStr}`);
    ledgerSheet.columns = [
      { header: 'Party Name', key: 'partyName', width: 25 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Particulars', key: 'particulars', width: 25 },
      { header: 'Debit (Rs)', key: 'debit', width: 15 },
      { header: 'Credit (Rs)', key: 'credit', width: 15 },
      { header: 'Balance (Rs)', key: 'balance', width: 15 },
    ];

    applyHeaderStyle(ledgerSheet.getRow(1));

    for (const bill of ledgers) {
      const data = bill.extractedData || {};
      const transactions = data.transactions || [];
      const partyName = data.partyName || '';

      for (const txn of transactions) {
        ledgerSheet.addRow({
          partyName,
          date: txn.date || '',
          particulars: txn.particulars || '',
          debit: txn.debit || 0,
          credit: txn.credit || 0,
          balance: txn.balance || 0,
        });
      }
    }
  }

  // === SUMMARY SHEET ===
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  applyHeaderStyle(summarySheet.getRow(1));

  summarySheet.addRow({ metric: 'Date', value: dateStr });
  summarySheet.addRow({ metric: 'Total Documents', value: bills.length });
  summarySheet.addRow({ metric: 'Invoice Documents', value: invoices.length });
  summarySheet.addRow({ metric: 'Ledger Documents', value: ledgers.length });
  summarySheet.addRow({ metric: 'Total Discount', value: totalDiscount });
  summarySheet.addRow({ metric: 'Gross Sales (Net Total)', value: totalNetTotal });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
}
