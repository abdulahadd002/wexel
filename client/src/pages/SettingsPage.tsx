import React, { useState, useEffect, FormEvent } from 'react';
import { Card, CardHeader, Button, Input, Modal, Loader } from '../components/common';
import { contactService } from '../services/contactService';
import { Contact } from '../types';
import './SettingsPage.css';

export function SettingsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ phoneNumber: '', displayName: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ phoneNumber: '', displayName: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      phoneNumber: contact.phoneNumber,
      displayName: contact.displayName,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData({ phoneNumber: '', displayName: '' });
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingContact) {
        await contactService.updateContact(editingContact.id, {
          displayName: formData.displayName,
        });
      } else {
        await contactService.createContact(
          formData.phoneNumber,
          formData.displayName
        );
      }
      closeModal();
      loadContacts();
    } catch (error: any) {
      setFormError(
        error.response?.data?.error?.message || 'Failed to save contact'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (contact: Contact) => {
    try {
      await contactService.updateContact(contact.id, {
        isActive: !contact.isActive,
      });
      loadContacts();
    } catch (error) {
      console.error('Error toggling contact:', error);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Are you sure you want to delete ${contact.displayName}?`)) {
      return;
    }

    try {
      await contactService.deleteContact(contact.id);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your WhatsApp contacts</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="WhatsApp Contacts"
          subtitle="Add contacts to receive bill images from"
          action={
            <Button onClick={openAddModal}>Add Contact</Button>
          }
        />

        {isLoading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <p>No contacts added yet.</p>
            <p className="empty-state-hint">
              Add a contact to start receiving bill images.
            </p>
          </div>
        ) : (
          <div className="contacts-list">
            {contacts.map((contact) => (
              <div key={contact.id} className="contact-item">
                <div className="contact-info">
                  <span className="contact-name">{contact.displayName}</span>
                  <span className="contact-phone">{contact.phoneNumber}</span>
                </div>
                <div className="contact-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={contact.isActive}
                      onChange={() => handleToggleActive(contact)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(contact)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(contact)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="contact-form">
          {formError && <div className="form-error">{formError}</div>}

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="+923001234567"
            helperText="Include country code (e.g., +92 for Pakistan)"
            disabled={!!editingContact}
            required
          />

          <Input
            label="Display Name"
            type="text"
            value={formData.displayName}
            onChange={(e) =>
              setFormData({ ...formData, displayName: e.target.value })
            }
            placeholder="Enter a name for this contact"
            required
          />

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingContact ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
