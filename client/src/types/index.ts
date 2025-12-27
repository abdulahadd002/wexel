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

export interface Contact {
  id: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  imageUrl: string;
  extractedData: Record<string, any>;
  totalAmount: number | null;
  billDate: string;
  processedAt: string | null;
  createdAt: string;
  contact: {
    displayName: string;
    phoneNumber: string;
  };
}

export interface DailySheet {
  id: string;
  sheetDate: string;
  grossSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  imageUrl: string;
  billDate: string;
  processedAt: string | null;
  createdAt: string;
  contact?: {
    id: string;
    displayName: string;
    phoneNumber: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
