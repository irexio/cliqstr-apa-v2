'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadDropzone } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { fetchJson } from '@/lib/fetchJson';

interface EditCliqFormProps {
  cliq: {
    id: string;
    name: string;
    description: string | null;
    privacy: string;
    coverImage: string | null;
  };
}

export default function EditCliqForm({ cliq }: EditCliqFormProps) {
  const router = useRouter();
  
  const [name, setName] = useState(cliq.name);
  const [description, setDescription] = useState(cliq.description || '');
  const [privacy, setPrivacy] = useState(cliq.privacy);
  const [coverImage, setCoverImage] = useState(cliq.coverImage || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Cliq name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchJson(`/api/cliqs/${cliq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          privacy,
          coverImage: coverImage || undefined,
        }),
      });

      router.push(`/cliqs/${cliq.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('[CLIQ_EDIT_ERROR]', err);
      setError(err.message || 'Failed to update cliq');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUploadComplete = async (res: any) => {
    if (res?.[0]?.url) {
      setCoverImage(res[0].url);
      setIsUploading(false);
      
      // Auto-save the cliq with the new banner
      try {
        setLoading(true);
        setError('');
        
        await fetchJson(`/api/cliqs/${cliq.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            privacy,
            coverImage: res[0].url,
          }),
        });

        // Show success message briefly
        setError('');
        setSuccessMessage('Banner uploaded and saved successfully!');
        setTimeout(() => {
          router.push(`/cliqs/${cliq.id}`);
          router.refresh();
        }, 2000);
      } catch (err: any) {
        console.error('[CLIQ_BANNER_AUTO_SAVE_ERROR]', err);
        setError('Banner uploaded but failed to save. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      {/* Cliq Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cliq Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Family Fun Time"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          maxLength={50}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this cliq about?"
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/200 characters
        </p>
      </div>

      {/* Privacy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Privacy Level
        </label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="private">Private - Invite only</option>
          <option value="semi_private">Semi-Private - Visible to members of other cliqs</option>
          <option value="public">Public - Anyone can find and join</option>
        </select>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Image (Optional)
        </label>
        {coverImage && (
          <div className="relative mb-4">
            <img
              src={coverImage}
              alt="Cover preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        <UploadDropzone
          endpoint="cliqBanner"
          onUploadBegin={() => {
            setIsUploading(true);
            setError('');
          }}
          onClientUploadComplete={handleBannerUploadComplete}
          onUploadError={(err: Error) => {
            console.error('Cover upload error:', err);
            setError('Failed to upload cover image');
            setIsUploading(false);
          }}
          appearance={{
            container: `border-dashed border-2 rounded-lg p-4 ${
              isUploading 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300'
            }`,
            button: 'bg-black text-white rounded-md px-4 py-2 text-sm hover:bg-gray-800',
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isUploading}
          className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Updating...' : isUploading ? 'Uploading...' : 'Update Cliq'}
        </button>
      </div>
    </form>
  );
}