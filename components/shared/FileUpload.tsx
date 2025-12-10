'use client';

import { useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 10,
  label = 'Upload File',
  description,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map((type) => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type;

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return fileType.match(type);
      });

      if (!isAccepted) {
        setError(`File type not accepted. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    if (['pdf'].includes(extension || '')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      {description && <p className="text-sm text-gray-600">{description}</p>}

      {!selectedFile ? (
        <>
          <div className="block md:hidden">
            <Button 
              variant="outline"
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className="w-full h-32 border-dashed border-2 flex flex-col gap-2 hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to select file</span>
              {accept && <span className="text-xs text-muted-foreground/70">Max {maxSize}MB • {accept}</span>}
            </Button>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'hidden md:block border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50',
              error && 'border-red-500'
            )}
            role="button"
            tabIndex={0}
            aria-label="File upload drop zone"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Drag and drop a file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Max file size: {maxSize}MB {accept && `• Accepted: ${accept}`}
              </p>
            </div>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label={label || 'File upload'}
          />
        </>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          {previewUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <img
                src={previewUrl}
                alt={selectedFile.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

