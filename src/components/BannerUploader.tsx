'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadFiles } from '@/lib/uploadthing-client';

interface BannerUploaderProps {
  currentBanner?: string | null;
  onBannerChange?: (url: string | null) => void;
}

export default function BannerUploader({ 
  currentBanner, 
  onBannerChange 
}: BannerUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBanner, setUploadedBanner] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayBanner = uploadedBanner || currentBanner;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];

      // Auto-compress image
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`Original banner size: ${originalSizeMB}MB`);
      
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 2, // Banners can be a bit larger
        maxWidthOrHeight: 1200, // Banner width
        useWebWorker: true,
      });

      const compressedSizeMB = (compressedBlob.size / 1024 / 1024).toFixed(2);
      console.log(`Compressed banner size: ${compressedSizeMB}MB`);

      // Create a File from the compressed blob
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      // Upload using uploadthing hook
      const response = await uploadFiles('banner', {
        files: [compressedFile],
      });

      if (response && response[0]?.url) {
        setUploadedBanner(response[0].url);
        setMessage({ type: 'success', text: 'Banner uploaded! Save the form to apply changes.' });
        onBannerChange?.(response[0].url);
        setTimeout(() => setMessage(null), 5000);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload banner' });
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
    <div className="flex flex-col space-y-4">
      <div className="text-center">
        {/* Banner Preview */}
        <div className="mb-6">
          <div className="w-full aspect-[3/1] max-h-[200px] bg-gray-200 rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden">
            {displayBanner ? (
              <img 
                src={displayBanner} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">🖼️</div>
                  <div className="text-sm font-medium">No banner image</div>
                  <div className="text-xs text-gray-400 mt-1">Upload a banner to personalize your profile</div>
                </div>
              </div>
            )}
          </div>
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
              'Select Cover Photo'
            )}
          </button>
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="mb-4 text-sm text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
            📎 Optimizing and uploading banner...
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
          JPG or PNG files work best. Any file size is fine—large images will be automatically compressed.
        </p>
      </div>
    </div>
  );
}
