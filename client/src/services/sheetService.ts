import api from './api';
import { DailySheet, Bill, ApiResponse } from '../types';

interface SheetFilters {
  startDate?: string;
  endDate?: string;
}

interface SheetWithBills {
  sheet: DailySheet;
  bills: Bill[];
}

interface GrossSalesResponse {
  period: string;
  totalGrossSales: number;
  sheets: DailySheet[];
}

export const sheetService = {
  async getSheets(filters?: SheetFilters): Promise<DailySheet[]> {
    const response = await api.get<ApiResponse<{ sheets: DailySheet[] }>>('/sheets', {
      params: filters,
    });
    return response.data.data!.sheets;
  },

  async getSheetByDate(date: string): Promise<SheetWithBills> {
    const response = await api.get<ApiResponse<SheetWithBills>>(`/sheets/${date}`);
    return response.data.data!;
  },

  async exportSheet(date: string): Promise<Blob> {
    const response = await api.get(`/sheets/${date}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getGrossSales(period?: 'week' | 'month' | 'year'): Promise<GrossSalesResponse> {
    const response = await api.get<ApiResponse<GrossSalesResponse>>('/sheets/gross-sales', {
      params: { period },
    });
    return response.data.data!;
  },
};
