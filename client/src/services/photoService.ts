import api from './api';
import { Photo, Contact, ApiResponse, PaginationInfo } from '../types';

interface PhotosResponse {
  photos: Photo[];
  pagination: PaginationInfo;
}

interface ContactPhotosResponse {
  contact: Contact;
  photos: Photo[];
}

export const photoService = {
  async getAllPhotos(page = 1, limit = 20): Promise<PhotosResponse> {
    const response = await api.get<ApiResponse<PhotosResponse>>('/whatsapp/photos', {
      params: { page, limit },
    });
    return response.data.data!;
  },

  async getContactPhotos(contactId: string): Promise<ContactPhotosResponse> {
    const response = await api.get<ApiResponse<ContactPhotosResponse>>(
      `/whatsapp/photos/${contactId}`
    );
    return response.data.data!;
  },
};
