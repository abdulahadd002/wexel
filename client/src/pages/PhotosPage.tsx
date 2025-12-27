import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Loader, Modal } from '../components/common';
import { photoService } from '../services/photoService';
import { billService } from '../services/billService';
import { contactService } from '../services/contactService';
import { Photo, Contact } from '../types';
import './PhotosPage.css';

export function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [selectedContact]);

  const loadContacts = async () => {
    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      if (selectedContact === 'all') {
        const data = await photoService.getAllPhotos();
        setPhotos(data.photos);
      } else {
        const data = await photoService.getContactPhotos(selectedContact);
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPhoto = async () => {
    if (!selectedPhoto) return;

    setIsProcessing(true);
    setProcessError('');

    try {
      await billService.processBill(
        selectedPhoto.imageUrl,
        selectedPhoto.contact?.id || selectedContact,
        selectedPhoto.billDate
      );
      setSelectedPhoto(null);
      loadPhotos();
    } catch (error: any) {
      setProcessError(
        error.response?.data?.error?.message || 'Failed to process image'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="photos-page">
      <div className="photos-header">
        <div>
          <h1 className="page-title">WhatsApp Photos</h1>
          <p className="page-subtitle">
            View and process bill images from your contacts
          </p>
        </div>
        <div className="photos-filter">
          <select
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            className="contact-select"
          >
            <option value="all">All Contacts</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <p>No photos found.</p>
            <p className="empty-state-hint">
              Photos received via WhatsApp will appear here.
            </p>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-card"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.imageUrl}
                  alt="Bill"
                  className="photo-image"
                />
                <div className="photo-info">
                  <span className="photo-contact">
                    {photo.contact?.displayName || 'Unknown'}
                  </span>
                  <span className="photo-date">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {photo.processedAt && (
                  <div className="photo-processed-badge">Processed</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Process Bill Image"
        size="lg"
      >
        {selectedPhoto && (
          <div className="photo-modal">
            <img
              src={selectedPhoto.imageUrl}
              alt="Bill"
              className="photo-modal-image"
            />
            <div className="photo-modal-info">
              <p>
                <strong>Contact:</strong>{' '}
                {selectedPhoto.contact?.displayName || 'Unknown'}
              </p>
              <p>
                <strong>Received:</strong>{' '}
                {new Date(selectedPhoto.createdAt).toLocaleString()}
              </p>
              {selectedPhoto.processedAt && (
                <p>
                  <strong>Already Processed:</strong>{' '}
                  {new Date(selectedPhoto.processedAt).toLocaleString()}
                </p>
              )}
            </div>

            {processError && (
              <div className="process-error">{processError}</div>
            )}

            <div className="photo-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setSelectedPhoto(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessPhoto}
                isLoading={isProcessing}
                disabled={!!selectedPhoto.processedAt}
              >
                {selectedPhoto.processedAt ? 'Already Processed' : 'Extract Data'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
