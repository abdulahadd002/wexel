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
    const cols: Column[] = [
      { key: 'contact', label: 'Contact', type: 'text', editable: false },
      { key: 'total', label: 'Total', type: 'number', editable: true },
    ];

    const dynamicFields = new Set<string>();
    bills.forEach((bill) => {
      if (bill.extractedData && typeof bill.extractedData === 'object') {
        Object.keys(bill.extractedData).forEach((key) => {
          if (key !== 'total' && key !== 'items') {
            dynamicFields.add(key);
          }
        });
      }
    });

    dynamicFields.forEach((field) => {
      cols.push({
        key: field,
        label: formatLabel(field),
        type: 'text',
        editable: true,
      });
    });

    setColumns(cols);
  }, [bills]);

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getCellValue = (bill: Bill, key: string): string => {
    if (key === 'contact') {
      return bill.contact.displayName;
    }
    if (key === 'total') {
      return bill.totalAmount?.toString() || '';
    }
    return bill.extractedData?.[key]?.toString() || '';
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

      if (editingCell.field === 'total') {
        await billService.updateBill(editingCell.billId, {
          totalAmount: parseFloat(editValue) || 0,
        });
      } else {
        const newExtractedData = {
          ...bill.extractedData,
          [editingCell.field]: editValue,
        };
        await billService.updateBill(editingCell.billId, {
          extractedData: newExtractedData,
        });
      }

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
                        {col.key === 'total' && value
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
            <td>
              <strong>Total</strong>
            </td>
            <td>
              <strong>
                {bills
                  .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
                  .toLocaleString()}
              </strong>
            </td>
            {columns.slice(2).map((col) => (
              <td key={col.key}>-</td>
            ))}
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
