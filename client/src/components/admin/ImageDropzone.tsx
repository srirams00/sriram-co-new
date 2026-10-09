'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Link as LinkIcon, Image as ImageIcon, CheckCircle, Plus } from 'lucide-react';
import styles from './ImageDropzone.module.css';

interface ImageDropzoneProps {
  label: string;
  value: string | string[];
  onChange: (value: any) => void;
  isMultiple?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export default function ImageDropzone({
  label,
  value,
  onChange,
  isMultiple = false,
  required = false,
  error,
  hint,
  placeholder = 'https://images.unsplash.com/... or paste image',
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [typedUrl, setTypedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize single vs multiple values
  const singleValue = typeof value === 'string' ? value : '';
  const multiValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (isMultiple) {
        onChange([...multiValues, dataUrl]);
      } else {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // 1. Check for dropped files from file explorer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isMultiple) {
        Array.from(e.dataTransfer.files).forEach((file) => processFile(file));
      } else {
        processFile(e.dataTransfer.files[0]);
      }
      return;
    }

    // 2. Check for dragged image URL or link from browser tab
    const droppedUrl =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('URL');

    if (droppedUrl && droppedUrl.startsWith('http')) {
      if (isMultiple) {
        onChange([...multiValues, droppedUrl.trim()]);
      } else {
        onChange(droppedUrl.trim());
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isMultiple) {
        Array.from(e.target.files).forEach((file) => processFile(file));
      } else {
        processFile(e.target.files[0]);
      }
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedUrl.trim()) return;

    if (isMultiple) {
      onChange([...multiValues, typedUrl.trim()]);
    } else {
      onChange(typedUrl.trim());
    }
    setTypedUrl('');
  };

  const handleRemoveSingle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMultiIndex = (index: number) => {
    const updated = multiValues.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.dropzoneWrapper}>
      <div className={styles.headerRow}>
        <label className={styles.fieldLabel}>
          <span>{label}</span>
          {required && <span className={styles.requiredMarker}>*</span>}
        </label>
        <button
          type="button"
          className={styles.toggleModeBtn}
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? <UploadCloud size={14} /> : <LinkIcon size={14} />}
          <span>{showUrlInput ? 'Switch to Drag & Drop' : 'Enter Image URL directly'}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMultiple}
        onChange={handleFileInputChange}
        className={styles.fileInputHidden}
      />

      {showUrlInput ? (
        /* Direct URL Form */
        <div className={styles.urlInputContainer}>
          <input
            type="url"
            placeholder={placeholder}
            value={typedUrl}
            onChange={(e) => setTypedUrl(e.target.value)}
            className={styles.urlInput}
          />
          <button type="button" onClick={handleApplyUrl} className={styles.urlApplyBtn}>
            {isMultiple ? 'Add URL' : 'Apply URL'}
          </button>
        </div>
      ) : !isMultiple && singleValue ? (
        /* Single Image Active Preview Card */
        <div className={styles.previewCard}>
          <img
            src={singleValue}
            alt="Product Preview"
            className={styles.previewThumbnail}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&q=80';
            }}
          />
          <div className={styles.previewDetails}>
            <span className={styles.previewName}>
              {singleValue.startsWith('data:') ? 'Uploaded Image (Data File)' : singleValue}
            </span>
            <span className={styles.previewBadge}>
              <CheckCircle size={12} />
              <span>Image Ready</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveSingle}
            className={styles.removeBtn}
            title="Remove image"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${styles.dropArea} ${isDragOver ? styles.dropAreaDragActive : ''} ${
            error ? styles.dropAreaHasError : ''
          }`}
        >
          <div className={styles.iconCircle}>
            <UploadCloud size={24} />
          </div>
          <p className={styles.promptText}>
            Drag and drop image here, or <span className={styles.highlightText}>Browse</span>
          </p>
          <span className={styles.subText}>
            Supports PNG, JPG, WebP from your computer or drag from browser
          </span>
        </div>
      )}

      {/* Gallery Grid for Multiple Images */}
      {isMultiple && multiValues.length > 0 && (
        <div className={styles.multiGalleryGrid}>
          {multiValues.map((imgUrl, index) => (
            <div key={index} className={styles.multiThumbCard}>
              <img
                src={imgUrl}
                alt={`Additional ${index + 1}`}
                className={styles.multiThumbImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveMultiIndex(index)}
                className={styles.multiRemoveBtn}
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <span className={styles.errorText}>{error}</span>}
      {hint && !error && <span className={styles.hintText}>{hint}</span>}
    </div>
  );
}
