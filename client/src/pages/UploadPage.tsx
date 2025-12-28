import React, { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, Button, Loader } from '../components/common';
import { billService } from '../services/billService';
import './UploadPage.css';

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await billService.uploadBill(selectedFile, billDate);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to upload and process image'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1 className="page-title">Upload Bill Image</h1>
        <p className="page-subtitle">
          Upload a photo of a handwritten bill to extract data
        </p>
      </div>

      <Card>
        <CardHeader
          title="Upload Image"
          subtitle="Supported formats: JPEG, PNG, WebP, HEIC (max 10MB)"
        />

        {error && <div className="upload-error">{error}</div>}

        <div
          className={`upload-dropzone ${preview ? 'has-preview' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !preview && fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="clear-button"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="dropzone-icon">📷</div>
              <p className="dropzone-text">
                Drag and drop an image here, or click to select
              </p>
              <p className="dropzone-hint">
                Take a clear photo of the handwritten bill
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        <div className="upload-options">
          <div className="date-field">
            <label htmlFor="billDate">Bill Date</label>
            <input
              id="billDate"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        <div className="upload-actions">
          <Button
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={!selectedFile}
            fullWidth
          >
            {isUploading ? 'Processing...' : 'Upload & Extract Data'}
          </Button>
        </div>

        {isUploading && (
          <div className="processing-info">
            <Loader size="sm" />
            <p>Analyzing image and extracting text...</p>
            <p className="processing-hint">
              This may take a few seconds depending on the image
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
