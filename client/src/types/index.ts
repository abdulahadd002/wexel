export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Bill {
  id: string;
  imagePath: string;
  extractedData: Record<string, any>;
  totalAmount: number | null;
  billDate: string;
  processedAt: string | null;
  createdAt: string;
}

export interface DailySheet {
  id: string;
  sheetDate: string;
  grossSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}
