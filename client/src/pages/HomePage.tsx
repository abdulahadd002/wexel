import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Loader } from '../components/common';
import { DataGrid } from '../components/sheets/DataGrid';
import { sheetService } from '../services/sheetService';
import { DailySheet, Bill } from '../types';
import './HomePage.css';

export function HomePage() {
  const [sheets, setSheets] = useState<DailySheet[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bills, setBills] = useState<Bill[]>([]);
  const [grossSales, setGrossSales] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSheets();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSheetData(selectedDate);
    }
  }, [selectedDate]);

  const loadSheets = async () => {
    try {
      const data = await sheetService.getSheets();
      setSheets(data);
    } catch (error) {
      console.error('Error loading sheets:', error);
    }
  };

  const loadSheetData = async (date: string) => {
    setIsLoading(true);
    try {
      const data = await sheetService.getSheetByDate(date);
      setBills(data.bills);
      setGrossSales(Number(data.sheet.grossSales) || 0);
    } catch (error) {
      console.error('Error loading sheet data:', error);
      setBills([]);
      setGrossSales(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await sheetService.exportSheet(selectedDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wexel-sheet-${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting sheet:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBillUpdate = () => {
    loadSheetData(selectedDate);
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <h1 className="page-title">Daily Sheets</h1>
          <p className="page-subtitle">View and edit your extracted bill data</p>
        </div>
        <div className="home-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
          <Button
            onClick={handleExport}
            isLoading={isExporting}
            disabled={bills.length === 0}
          >
            Export Excel
          </Button>
        </div>
      </div>

      <div className="home-stats">
        <Card className="stat-card">
          <div className="stat-value">{bills.length}</div>
          <div className="stat-label">Bills Today</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">
            {grossSales.toLocaleString('en-US', {
              style: 'currency',
              currency: 'PKR',
              minimumFractionDigits: 0,
            })}
          </div>
          <div className="stat-label">Gross Sales</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{sheets.length}</div>
          <div className="stat-label">Total Sheets</div>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader
          title={`Bills for ${new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`}
          subtitle={`${bills.length} bills recorded`}
        />
        {isLoading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <p>No bills found for this date.</p>
            <p className="empty-state-hint">
              Process images from the Photos page to add bills.
            </p>
          </div>
        ) : (
          <DataGrid bills={bills} onUpdate={handleBillUpdate} />
        )}
      </Card>
    </div>
  );
}
