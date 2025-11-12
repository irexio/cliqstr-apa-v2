'use client';

export const dynamic = 'force-dynamic';

/**
 * 🛠️ Cliq Builder Page — /cliqs/build
 *
 * Purpose:
 *   - Allows users to create a new cliq (name, description, privacy, and banner)
 *   - Uses UploadThing for image upload
 *   - POSTs to /api/cliqs/create
 *
 * Notes:
 *   - Not in a dynamic route, so no ghost fix needed
 *   - APA safety is enforced in the backend route
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { UploadDropzone } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { fetchJson } from '@/lib/fetchJson';
import Image from 'next/image';
import { AvatarLibraryModal } from '@/components/AvatarLibraryModal';

export default function BuildCliqClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'semi' | 'public'>('private');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);

  const stripTags = (input: string) =>
    input.replace(/<[^>]*>?/gm, '').trim(); // 🧽 Strip HTML + trim

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanedName = stripTags(name);
    const cleanedDescription = stripTags(description);

    try {
      const data = await fetchJson('/api/cliqs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanedName,
          description: cleanedDescription,
          privacy,
          coverImage: bannerImage,
          minAge: minAge === '' ? null : minAge,
          maxAge: maxAge === '' ? null : maxAge,
        }),
      });

      // Redirect to My Cliqs dashboard to see the new cliq
      router.push('/my-cliqs-dashboard');
      router.refresh(); // Force refresh to show new cliq
    } catch (err: any) {
      setError(err.message || 'Failed to create cliq.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create a New Cliq</h1>
      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <Label>Cliq Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </div>

        <div>
          <Label>Privacy</Label>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as 'private' | 'semi' | 'public')}
            className="w-full p-2 border rounded-md"
          >
            <option value="private">Private</option>
            <option value="semi">Semi-Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        {/* Age Gating Fields - Available for all cliq types */}
        <div className="bg-black border border-black rounded-lg p-4 text-white">
          <h3 className="text-sm font-semibold text-white mb-3">🛡️ Age Restrictions (Optional)</h3>
          <p className="text-xs text-gray-200 mb-4">
            Set age limits to control who can join your {privacy} cliq. Leave blank for no restrictions.
          </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAge" className="text-sm text-white">Minimum Age</Label>
                <Input
                  id="minAge"
                  type="number"
                  min="1"
                  max="100"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder={privacy === 'private' ? 'e.g., 5' : 'e.g., 13'}
                  className="mt-1 bg-white text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
                  style={{ color: 'black' }}
                />
              </div>
              
              <div>
                <Label htmlFor="maxAge" className="text-sm text-white">Maximum Age</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="1"
                  max="100"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder={privacy === 'private' ? 'e.g., 17' : 'e.g., 65'}
                  className="mt-1 bg-white text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
                  style={{ color: 'black' }}
                />
              </div>
            </div>
            
          {minAge && maxAge && minAge >= maxAge && (
            <p className="text-red-600 text-xs mt-2">⚠️ Minimum age must be less than maximum age</p>
          )}
        </div>

        <div>
          <Label>Banner Image</Label>
          <p className="text-xs text-neutral-500 italic mb-3">
            Ideal size: 1200 x 630 pixels for best results. Max file size: 4MB.
          </p>

          {/* Banner Image Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                const uploadElement = document.querySelector('[class*="uploadthing"]') as HTMLElement;
                uploadElement?.click();
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              <span>📤</span>
              Upload Custom
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarLibrary(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              <span>🎨</span>
              Choose from Library
            </button>
          </div>
        
          {uploading && (
            <div className="mb-4 p-3 bg-black border border-black rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-sm text-white">Uploading image...</span>
              </div>
            </div>
          )}
          
          <UploadDropzone
            endpoint="cliqBanner"
            appearance={{
              container: `border-dashed border-2 p-4 rounded-lg ${
                uploading 
                  ? 'border-black bg-black opacity-50' 
                  : bannerImage 
                    ? 'border-green-300 bg-green-50'
                    : 'border-neutral-300 bg-neutral-50'
              }`,
              button: 'bg-black text-white rounded-full px-4 py-2 text-sm hover:text-[#c032d1] transition',
              label: 'text-sm text-neutral-700',
            }}
            onUploadBegin={(name) => {
              console.log('[CLIQ] Upload beginning:', name);
              setUploading(true);
              setError('');
            }}
            onClientUploadComplete={(res) => {
              console.log('[CLIQ] Banner upload complete:', res);
              setUploading(false);
              if (res && res.length > 0) {
                const fileData = res[0] as any;
                const fileUrl = fileData.url || fileData.fileUrl || fileData.appUrl;
                console.log('[CLIQ] Setting banner URL:', fileUrl);
                setBannerImage(fileUrl);
              }
            }}
            onUploadError={(err: Error) => {
              console.error('[CLIQ] Upload error:', err);
              setUploading(false);
              setError('Image upload failed. Try again.');
            }}
          />
        </div>

        {bannerImage && (
          <div className="mt-4">
            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Banner image uploaded successfully!
            </div>
            <div className="w-full max-w-md">
              <Image
                src={bannerImage}
                alt="Banner Preview"
                width={600}
                height={200}
                className="rounded border object-cover w-full"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={loading || uploading}>
          {uploading ? 'Uploading image...' : loading ? 'Creating...' : 'Create Cliq'}
        </Button>
      </form>

      {/* Avatar Library Modal */}
      <AvatarLibraryModal
        isOpen={showAvatarLibrary}
        onClose={() => setShowAvatarLibrary(false)}
        onSelect={setBannerImage}
        title="Choose a Banner for Your Cliq"
      />
    </div>
  );
}
