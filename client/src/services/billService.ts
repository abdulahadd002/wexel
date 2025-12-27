import api from './api';
import { Bill, ApiResponse } from '../types';

interface BillFilters {
  contactId?: string;
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

  async processBill(imageUrl: string, contactId: string, billDate?: string): Promise<Bill> {
    const response = await api.post<ApiResponse<{ bill: Bill }>>('/bills/process', {
      imageUrl,
      contactId,
      billDate,
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
