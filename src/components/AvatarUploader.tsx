'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadFiles } from '@/lib/uploadthing-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploaderProps {
  currentImage?: string | null;
  userName?: string;
  onImageChange?: (url: string | null) => void;
}

export default function AvatarUploader({ 
  currentImage, 
  userName = 'User',
  onImageChange 
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = uploadedImage || currentImage;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];

      // Auto-compress image
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`Original file size: ${originalSizeMB}MB`);
      
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 0.8, // Keep well under 1MB limit
        maxWidthOrHeight: 400, // Ideal profile photo size
        useWebWorker: true,
      });

      const compressedSizeMB = (compressedBlob.size / 1024 / 1024).toFixed(2);
      console.log(`Compressed file size: ${compressedSizeMB}MB`);

      // Create a File from the compressed blob
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      // Upload using uploadthing hook
      const response = await uploadFiles('avatar', {
        files: [compressedFile],
      });

      if (response && response[0]?.url) {
        setUploadedImage(response[0].url);
        setMessage({ type: 'success', text: 'Avatar uploaded! Save the form to apply changes.' });
        onImageChange?.(response[0].url);
        setTimeout(() => setMessage(null), 5000);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        {/* Avatar Preview */}
        <div className="mb-6">
          <Avatar className="w-32 h-32 mx-auto border-2 border-gray-300 shadow-sm">
            <AvatarImage src={displayImage || undefined} alt="Profile photo" />
            <AvatarFallback className="bg-gray-500 text-white text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Description Text */}
        <p className="text-xs text-gray-500 mb-4">Any image size works—we'll automatically optimize it for you</p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Custom Upload Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="bg-black hover:bg-gray-800 disabled:opacity-70 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Uploading...
              </>
            ) : (
              'Select Profile Photo'
            )}
          </button>
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="mb-4 text-sm text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
            📷 Optimizing and uploading avatar...
          </div>
        )}

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? '✓ ' : '⚠️ '}{message.text}
          </div>
        )}

        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
          JPG or PNG files work best. Any file size is fine—large photos will be automatically compressed.
        </p>
      </div>
    </div>
  );
}
