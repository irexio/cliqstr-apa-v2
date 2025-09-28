'use client';

import { useState } from 'react';
import { UploadButton } from '@/lib/uploadthing-client';
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

  const displayImage = uploadedImage || currentImage;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleUploadSuccess = async (res: any[]) => {
    try {
      const uploadedUrl = res[0]?.url;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload');
      }

      setUploadedImage(uploadedUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded! Save the form to apply changes.' });
      
      // Notify parent component of the new image URL
      onImageChange?.(uploadedUrl);
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' });
      
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

        {/* Upload Button */}
        <div className="flex justify-center mb-4">
          <p className="text-xs text-gray-500 mb-3">Ideal size: 400 x 400 pixels (square image works best)</p>
          <UploadButton
            endpoint="avatar"
            config={{ mode: 'auto' }}
            onClientUploadComplete={handleUploadSuccess}
            onUploadError={handleUploadError}
            onUploadBegin={() => {
              setIsUploading(true);
              setMessage(null);
            }}
            appearance={{
              button: "bg-[#c032d1] hover:bg-[#a02ba8] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm",
              allowedContent: "text-xs text-gray-500 mt-2"
            }}
            content={{
              button: isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Uploading...
                </div>
              ) : 'Select Profile Photo'
            }}
          />
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg border border-blue-200">
            📷 Uploading avatar...
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
          📝 JPG or PNG files only, max 1MB. Square images work best
        </p>
      </div>
    </div>
  );
}
