import api from './api';
import { Contact, ApiResponse } from '../types';

export const contactService = {
  async getContacts(): Promise<Contact[]> {
    const response = await api.get<ApiResponse<{ contacts: Contact[] }>>('/contacts');
    return response.data.data!.contacts;
  },

  async getContact(id: string): Promise<Contact> {
    const response = await api.get<ApiResponse<{ contact: Contact }>>(`/contacts/${id}`);
    return response.data.data!.contact;
  },

  async createContact(phoneNumber: string, displayName: string): Promise<Contact> {
    const response = await api.post<ApiResponse<{ contact: Contact }>>('/contacts', {
      phoneNumber,
      displayName,
    });
    return response.data.data!.contact;
  },

  async updateContact(
    id: string,
    data: { displayName?: string; isActive?: boolean }
  ): Promise<Contact> {
    const response = await api.put<ApiResponse<{ contact: Contact }>>(`/contacts/${id}`, data);
    return response.data.data!.contact;
  },

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`);
  },
};
