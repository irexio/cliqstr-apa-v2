'use client';

import { useState } from 'react';
import { UploadButton } from '@/lib/uploadthing-client';

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


  const displayBanner = uploadedBanner || currentBanner;

  const handleUploadSuccess = async (res: any[]) => {
    try {
      const uploadedUrl = res[0]?.url;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload');
      }

      setUploadedBanner(uploadedUrl);
      setMessage({ type: 'success', text: 'Banner uploaded! Save the form to apply changes.' });
      
      // Notify parent component of the new banner URL
      onBannerChange?.(uploadedUrl);
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Banner upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload banner' });
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };



  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    setIsUploading(false);
    
    // Clear error message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
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
        <p className="text-xs text-gray-500 mb-4">Ideal size: 1200 x 630 pixels for best results</p>

        {/* Upload Button */}
        <div className="flex justify-center mb-4">
          <div className="!bg-black [&>button]:!bg-black [&>button]:hover:!bg-gray-800 [&>button]:!text-white [&>button]:!px-6 [&>button]:!py-3 [&>button]:!rounded-lg [&>button]:!text-sm [&>button]:!font-medium [&>button]:!transition-colors">
            <UploadButton
              endpoint="banner"
              config={{ mode: 'auto' }}
              onClientUploadComplete={handleUploadSuccess}
              onUploadError={handleUploadError}
              onUploadBegin={() => {
                setIsUploading(true);
                setMessage(null);
              }}
              appearance={{
                button: "!bg-black hover:!bg-gray-800 !text-white !px-6 !py-3 !rounded-lg !text-sm !font-medium !transition-colors",
                allowedContent: "!text-xs !text-gray-500 !mt-2"
              }}
              content={{
                button: isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </div>
                ) : 'Select Cover Photo'
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="mb-4 text-sm text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
            📎 Uploading banner...
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
          📝 JPG or PNG files only, max 4MB. Recommended size: 900x300px for best results
        </p>
      </div>
    </div>
  );
}
