'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { UploadDropzone } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { useAuth } from '@/lib/auth/useAuth';

export default function CreateCliqFormConvex() {
  const router = useRouter();
  const { user } = useAuth();
  const createCliq = useMutation(api.cliqs.createCliq);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'semi_private' | 'public'>('private');
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be logged in to create a cliq');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const cliqId = await createCliq({
        name: name.trim(),
        description: description.trim() || undefined,
        creatorId: user.id as Id<"users">,
        privacy,
        coverImage: coverImage || undefined,
        minAge,
        maxAge,
      });

      router.push(`/cliqs/${cliqId}`);
    } catch (err: any) {
      console.error('[CREATE_CLIQ_ERROR]', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg border shadow"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cliq Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My Birthday Squad"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="What's this cliq about?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Privacy Level
        </label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as 'private' | 'semi_private' | 'public')}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="private">Private - Only invited members</option>
          <option value="semi_private">Semi-Private - Members can invite others</option>
          <option value="public">Public - Anyone can join</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Age
          </label>
          <input
            type="number"
            value={minAge || ''}
            onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : undefined)}
            min="0"
            max="18"
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Age
          </label>
          <input
            type="number"
            value={maxAge || ''}
            onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : undefined)}
            min="0"
            max="18"
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Image
        </label>
        <p className="text-xs text-gray-500 mb-2">Ideal size: 1200 x 630 pixels for best results</p>
        {coverImage ? (
          <div className="space-y-2">
            <img
              src={coverImage}
              alt="Cover preview"
              className="w-full h-32 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove image
            </button>
          </div>
        ) : (
          <UploadDropzone
            endpoint="cliqBanner"
            onClientUploadComplete={(res) => {
              if (res?.[0]?.url) {
                setCoverImage(res[0].url);
              }
            }}
            onUploadError={(error: Error) => {
              setError(`Upload failed: ${error.message}`);
            }}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          />
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Cliq'}
        </button>
      </div>
    </form>
  );
}

