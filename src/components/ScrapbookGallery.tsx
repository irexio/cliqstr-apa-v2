'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UploadButton } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

type ScrapbookItem = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: Date;
  isPinned: boolean;
};

type ScrapbookGalleryProps = {
  items: ScrapbookItem[];
  userId: string;
  isOwner: boolean;
  sectionLabel: string;
  layoutStyle?: 'inline' | 'masonry';
  onItemAdded?: () => void;
};

export default function ScrapbookGallery({
  items,
  userId,
  isOwner,
  sectionLabel,
  layoutStyle = 'inline',
  onItemAdded,
}: ScrapbookGalleryProps) {
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // Check for expired items (90 days unless pinned)
  const validItems = items.filter((item) => {
    if (item.isPinned) return true;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return item.createdAt >= ninetyDaysAgo;
  });

  const handleStartUpload = () => {
    setShowCaptionInput(false);
    setIsUploading(true);
  };

  const handleImageUploaded = (url: string) => {
    setTempImageUrl(url);
    setShowCaptionInput(true);
    setIsUploading(false);
  };

  const handleSaveItem = async () => {
    if (!tempImageUrl) return;

    try {
      console.log('[SCRAPBOOK] Saving item with data:', {
        profileId: userId,
        imageUrl: tempImageUrl,
        caption,
      });
      
      const response = await fetch('/api/scrapbook/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: userId, // Note: userId prop is actually profileId
          imageUrl: tempImageUrl,
          caption,
        }),
      });

      console.log('[SCRAPBOOK] API Response status:', response.status);
      console.log('[SCRAPBOOK] API Response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('[SCRAPBOOK] API Error:', error);
        console.error('[SCRAPBOOK] Response status:', response.status);
        throw new Error(error.error || 'Failed to save item');
      }
      
      const result = await response.json();
      console.log('[SCRAPBOOK] Save successful:', result);

      // Reset the form
      setTempImageUrl(null);
      setCaption('');
      setShowCaptionInput(false);

      // Refresh the gallery
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error('Error saving scrapbook item:', error);
      alert('Failed to save item. Please try again.');
    }
  };

  return (
    <div className="mt-8 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{sectionLabel}</h2>
        {isOwner && !showCaptionInput && !isUploading && (
          <button
            onClick={handleStartUpload}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 flex items-center gap-1 font-medium"
          >
            <span className="text-lg">+</span> Add to {sectionLabel}
          </button>
        )}
      </div>

      {isOwner && isUploading && (
        <div className="mb-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <UploadButton
            endpoint="postImage"
            onClientUploadComplete={(res) => {
              console.log('[SCRAPBOOK] Upload complete:', res);
              if (res && res.length > 0) {
                const fileData = res[0] as any;
                const fileUrl = fileData.url || fileData.fileUrl || fileData.appUrl;
                console.log('[SCRAPBOOK] Setting image URL:', fileUrl);
                handleImageUploaded(fileUrl);
              }
            }}
            onUploadError={(error: Error) => {
              console.error('Upload error:', error);
              setIsUploading(false);
            }}
            className="ut-button:bg-black ut-button:ut-readying:bg-gray-500 ut-button:ut-uploading:bg-gray-500"
          />
        </div>
      )}

      {isOwner && showCaptionInput && tempImageUrl && (
        <div className="mb-6 p-6 border border-gray-300 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 relative rounded-md overflow-hidden">
              <Image
                src={tempImageUrl}
                alt="Uploaded image preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add a caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's this about?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setTempImageUrl(null);
                    setShowCaptionInput(false);
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {validItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No items yet in {sectionLabel.toLowerCase()}</p>
          {isOwner && (
            <p className="mt-2 text-sm">
              Click "Add to {sectionLabel}" to upload your first memory!
            </p>
          )}
        </div>
      ) : (
        layoutStyle === 'masonry' ? (
          // Masonry layout (Pinterest-style)
          <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
            {validItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm inline-block w-full mb-6"
                style={{ breakInside: 'avoid' }}
              >
                <div className="relative">
                  <div className="relative aspect-auto" style={{ minHeight: '200px' }}>
                    <Image
                      src={item.imageUrl}
                      alt={item.caption || "User's memory"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  {item.isPinned && (
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded">
                      Pinned
                    </div>
                  )}
                </div>
                {item.caption && (
                  <div className="p-3 bg-white">
                    <p className="text-gray-800">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Default inline grid layout (calm, predictable)
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {validItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || "User's memory"}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {item.isPinned && (
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded">
                      Pinned
                    </div>
                  )}
                </div>
                {item.caption && (
                  <div className="p-3 bg-white">
                    <p className="text-gray-800">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
