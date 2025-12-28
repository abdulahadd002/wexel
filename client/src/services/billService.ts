import api from './api';
import { Bill, ApiResponse } from '../types';

interface BillFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
}

export const billService = {
  async getBills(filters?: BillFilters): Promise<Bill[]> {
    const response = await api.get<ApiResponse<{ bills: Bill[] }>>('/bills', {
      params: filters,
    });
    return response.data.data!.bills;
  },

  async getBill(id: string): Promise<Bill> {
    const response = await api.get<ApiResponse<{ bill: Bill }>>(`/bills/${id}`);
    return response.data.data!.bill;
  },

  async uploadBill(file: File, billDate?: string): Promise<Bill> {
    const formData = new FormData();
    formData.append('image', file);
    if (billDate) {
      formData.append('billDate', billDate);
    }

    const response = await api.post<ApiResponse<{ bill: Bill }>>('/bills/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!.bill;
  },

  async updateBill(
    id: string,
    data: {
      extractedData?: Record<string, any>;
      totalAmount?: number;
      billDate?: string;
    }
  ): Promise<Bill> {
    const response = await api.put<ApiResponse<{ bill: Bill }>>(`/bills/${id}`, data);
    return response.data.data!.bill;
  },

  async deleteBill(id: string): Promise<void> {
    await api.delete(`/bills/${id}`);
  },
};
