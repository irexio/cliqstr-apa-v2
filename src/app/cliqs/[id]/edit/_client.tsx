'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { uploadFiles } from '@/lib/uploadthing-client';
import { AvatarLibraryModal } from '@/components/AvatarLibraryModal';

export default function EditCliqClient({ cliqId, currentUserId }: { cliqId: string; currentUserId: string; }) {
  const router = useRouter();

  // Get cliq data using Convex
  const cliq = useQuery(api.cliqs.getCliq,
    cliqId ? {
      cliqId: cliqId as Id<'cliqs'>,
      userId: currentUserId as Id<'users'>
    } : 'skip'
  );

  const updateCliq = useMutation(api.cliqs.updateCliq);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'semi_private' | 'public'>('private');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBannerLibrary, setShowBannerLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill form when cliq data loads
  useEffect(() => {
    if (cliq) {
      setName(cliq.name);
      setDescription(cliq.description || '');
      setPrivacy(cliq.privacy);
      setCoverImage(cliq.coverImage || '');
    }
  }, [cliq]);

  if (cliq === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading cliq...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only the owner can edit
  if (cliq === null || cliq.ownerId !== currentUserId) {
    if (cliqId) router.push(`/cliqs/${cliqId}`);
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
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
      const response = await uploadFiles('cliqBanner', {
        files: [compressedFile],
      });

      if (response && response[0]?.url) {
        setCoverImage(response[0].url);
        setError('');
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload banner');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateCliq({
        cliqId: cliqId as Id<'cliqs'>,
        name: name.trim(),
        description: description.trim() || undefined,
        privacy,
        coverImage: coverImage || undefined,
      });

      router.push(`/cliqs/${cliqId}`);
    } catch (err: any) {
      console.error('[UPDATE_CLIQ_ERROR]', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Edit Cliq</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliq Banner Image</label>
            
            {/* Banner Preview */}
            <div className="mb-4 w-full aspect-[3/1] max-h-[200px] bg-gray-200 rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden">
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt="Cliq banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🖼️</div>
                    <div className="text-sm font-medium">No banner image</div>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload and Library Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploadingImage}
                className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Upload Custom
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowBannerLibrary(true)}
                className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>🎨</span>
                Choose from Library
              </button>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border mt-3">
              JPG or PNG files work best. Any file size is fine—large images will be automatically compressed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliq Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="My Birthday Squad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="What's this cliq about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as 'private' | 'semi_private' | 'public')}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="private">Private - Only invited members</option>
              <option value="semi_private">Semi-Private - Members can invite others</option>
              <option value="public">Public - Anyone can join</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 bg-black hover:bg-gray-800 disabled:opacity-70 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/cliqs/${cliqId}`)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Banner Library Modal */}
        <AvatarLibraryModal
          isOpen={showBannerLibrary}
          onClose={() => setShowBannerLibrary(false)}
          onSelect={setCoverImage}
          title="Choose a Banner for Your Cliq"
          type="banner"
        />
      </div>
    </div>
  );
}


