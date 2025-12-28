import React, { useState, useEffect, useCallback } from 'react';
import { Bill } from '../../types';
import { billService } from '../../services/billService';
import { Button } from '../common';
import './DataGrid.css';

interface DataGridProps {
  bills: Bill[];
  onUpdate: () => void;
}

interface Column {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  editable: boolean;
}

export function DataGrid({ bills, onUpdate }: DataGridProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [editingCell, setEditingCell] = useState<{
    billId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fixed column order matching the bill format
    const cols: Column[] = [
      { key: 'partyName', label: 'Party Name', type: 'text', editable: true },
      { key: 'billNo', label: 'Bill No', type: 'text', editable: true },
      { key: 'billDate', label: 'Bill Date', type: 'text', editable: true },
      { key: 'total', label: 'Total', type: 'number', editable: true },
      { key: 'discount', label: 'Discount', type: 'number', editable: true },
      { key: 'netTotal', label: 'Net Total', type: 'number', editable: true },
    ];

    setColumns(cols);
  }, [bills]);

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getCellValue = (bill: Bill, key: string): string => {
    const data = bill.extractedData || {};

    // Handle ledger documents - extract bill info from transactions
    if (data.documentType === 'ledger') {
      const billTxn = data.transactions?.find((t: any) =>
        t.particulars?.toLowerCase().includes('bill') && t.debit > 0
      );

      if (key === 'partyName') return data.partyName || '';
      if (key === 'billNo') return billTxn?.particulars?.match(/#?\d+/)?.[0] || '';
      if (key === 'billDate') return billTxn?.date || '';
      if (key === 'total') return (data.netTotal || billTxn?.debit || 0).toString();
      if (key === 'discount') return '0';
      if (key === 'netTotal') return (data.netTotal || billTxn?.debit || bill.totalAmount || 0).toString();
    }

    // Handle invoice documents
    if (key === 'partyName') {
      return data.partyName || data.supplierName || '';
    }
    if (key === 'netTotal') {
      return (data.netTotal || bill.totalAmount || '').toString();
    }
    if (data[key] !== undefined) {
      return data[key]?.toString() || '';
    }
    return '';
  };

  const startEditing = (billId: string, field: string, currentValue: string) => {
    setEditingCell({ billId, field });
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    setIsSaving(true);
    try {
      const bill = bills.find((b) => b.id === editingCell.billId);
      if (!bill) return;

      const field = editingCell.field;
      const isNumericField = ['total', 'discount', 'netTotal'].includes(field);
      const value = isNumericField ? parseFloat(editValue) || 0 : editValue;

      // Update extractedData with the new value
      const newExtractedData = {
        ...bill.extractedData,
        [field]: value,
      };

      // If editing netTotal, also update totalAmount for gross sales calculation
      const updateData: any = { extractedData: newExtractedData };
      if (field === 'netTotal') {
        updateData.totalAmount = value;
      }

      await billService.updateBill(editingCell.billId, updateData);

      onUpdate();
      cancelEditing();
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleDelete = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      await billService.deleteBill(billId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  return (
    <div className="data-grid-container">
      <table className="data-grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.id}>
              {columns.map((col) => {
                const isEditing =
                  editingCell?.billId === bill.id &&
                  editingCell?.field === col.key;
                const value = getCellValue(bill, col.key);

                return (
                  <td
                    key={col.key}
                    className={`${col.editable ? 'editable' : ''} ${
                      isEditing ? 'editing' : ''
                    }`}
                    onClick={() => {
                      if (col.editable && !isEditing) {
                        startEditing(bill.id, col.key, value);
                      }
                    }}
                  >
                    {isEditing ? (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        autoFocus
                        disabled={isSaving}
                        className="cell-input"
                      />
                    ) : (
                      <span className="cell-value">
                        {['total', 'discount', 'netTotal'].includes(col.key) && value
                          ? parseFloat(value).toLocaleString()
                          : value || '-'}
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="actions-col">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(bill.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            {columns.map((col) => {
              if (col.key === 'netTotal') {
                const netTotalSum = bills.reduce((sum, bill) => {
                  const data = bill.extractedData || {};
                  if (data.documentType === 'ledger') {
                    const billTxn = data.transactions?.find((t: any) =>
                      t.particulars?.toLowerCase().includes('bill') && t.debit > 0
                    );
                    return sum + (data.netTotal || billTxn?.debit || bill.totalAmount || 0);
                  }
                  return sum + (data.netTotal || bill.totalAmount || 0);
                }, 0);
                return (
                  <td key={col.key}>
                    <strong>{netTotalSum.toLocaleString()}</strong>
                  </td>
                );
              }
              if (col.key === 'total') {
                const totalSum = bills.reduce((sum, bill) => {
                  const data = bill.extractedData || {};
                  if (data.documentType === 'ledger') {
                    const billTxn = data.transactions?.find((t: any) =>
                      t.particulars?.toLowerCase().includes('bill') && t.debit > 0
                    );
                    return sum + (data.netTotal || billTxn?.debit || 0);
                  }
                  return sum + (data.total || 0);
                }, 0);
                return (
                  <td key={col.key}>
                    <strong>{totalSum.toLocaleString()}</strong>
                  </td>
                );
              }
              if (col.key === 'discount') {
                const discountSum = bills.reduce(
                  (sum, bill) => sum + (bill.extractedData?.discount || 0),
                  0
                );
                return (
                  <td key={col.key}>
                    <strong>{discountSum.toLocaleString()}</strong>
                  </td>
                );
              }
              if (col.key === 'partyName') {
                return <td key={col.key}><strong>TOTAL</strong></td>;
              }
              return <td key={col.key}>-</td>;
            })}
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
