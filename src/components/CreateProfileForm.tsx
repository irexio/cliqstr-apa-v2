'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadDropzone } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { fetchJson } from '@/lib/fetchJson';

export default function CreateProfileForm() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [about, setAbout] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [showYear, setShowYear] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !username || !birthdate) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setError('Username must be 3-15 characters, letters, numbers, or underscores only.');
      return;
    }

    setLoading(true);
    setError('');

    const profileData = {
      username,
      firstName,
      lastName,
      birthdate,
      about,
      image: avatarUrl,
      bannerImage: bannerUrl,
      showYear,
    };

    console.log('[PROFILE] Submitting profile data:', profileData);

    try {
      const response = await fetchJson('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      // Redirect to the user's completed profile
      if (response.username) {
        router.push(`/profile/${response.username}`);
      } else {
        router.push('/my-cliqs-dashboard'); // fallback
      }
      router.refresh();
    } catch (err: any) {
      console.error('[PROFILE_CREATE_ERROR]', err);
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Your Profile</h1>
        <p className="text-gray-600">
          Set up your social profile that will be visible to your cliq members
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          This is how you'll appear to your cliq members
        </p>

        {/* Birthdate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birthday
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Your age group determines privacy settings
          </p>
          
          {/* Show Year Toggle */}
          <div className="mt-3 flex items-center">
            <input
              type="checkbox"
              id="showYear"
              checked={showYear}
              onChange={(e) => setShowYear(e.target.checked)}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="showYear" className="ml-2 text-sm text-gray-700">
              Show my birth year on my profile
            </label>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choose Your Username
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="username"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              maxLength={15}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            3-15 characters, letters, numbers, and underscores only
          </p>
        </div>

        {/* About/Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            About You (Optional)
          </label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell your cliq members a bit about yourself..."
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            maxLength={280}
          />
          <p className="text-xs text-gray-500 mt-1">
            {about.length}/280 characters
          </p>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">Ideal size: 400 x 400 pixels (square image works best)</p>
          <p className="text-xs text-gray-500 mb-3">
            Choose a fun photo of yourself or something that represents you. This will be shown to your cliq members. You can skip this — we'll give you a fun avatar if you don't pick one!
          </p>
          <div className="flex items-start gap-4">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            )}
            <div className="flex-1">
              <UploadDropzone
                endpoint="avatar"
                config={{ mode: 'auto' }}
                onClientUploadComplete={(res) => {
                  console.log('[PROFILE] Avatar upload complete:', res);
                  setUploadingAvatar(false);
                  if (res && res.length > 0) {
                    // UploadThing v7 returns the URL in res[0].url or res[0].fileUrl
                    const fileData = res[0] as any;
                    const fileUrl = fileData.url || fileData.fileUrl || fileData.appUrl;
                    console.log('[PROFILE] Setting avatar URL:', fileUrl);
                    setAvatarUrl(fileUrl);
                  }
                }}
                onUploadError={(err: Error) => {
                  console.error('[PROFILE] Avatar upload error:', err);
                  setError('Failed to upload avatar: ' + err.message);
                  setUploadingAvatar(false);
                }}
                onUploadBegin={() => {
                  console.log('[PROFILE] Beginning avatar upload');
                  setUploadingAvatar(true);
                  setError('');
                }}
                appearance={{
                  container: 'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#c032d1] transition-colors',
                  button: 'bg-[#c032d1] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#a02ba8] transition-colors text-base',
                  label: 'text-gray-600 text-sm mb-2 block',
                  allowedContent: 'text-xs text-gray-500 mt-2'
                }}
                content={{
                  button: uploadingAvatar ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </div>
                  ) : 'Select Profile Picture',
                  label: 'Drop your profile picture here or click to browse',
                  allowedContent: 'PNG, JPG up to 4MB - uploads automatically when selected'
                }}
              />
              {uploadingAvatar && (
                <p className="text-sm text-gray-600 mt-2">Uploading avatar...</p>
              )}
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Photo (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">Ideal size: 1200 x 630 pixels for best results</p>
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
          )}
          <UploadDropzone
            endpoint="banner"
            config={{ mode: 'auto' }}
            onClientUploadComplete={(res) => {
              console.log('[PROFILE] Banner upload complete:', res);
              setUploadingBanner(false);
              if (res && res.length > 0) {
                // UploadThing v7 returns the URL in res[0].url or res[0].fileUrl
                const fileData = res[0] as any;
                const fileUrl = fileData.url || fileData.fileUrl || fileData.appUrl;
                console.log('[PROFILE] Setting banner URL:', fileUrl);
                setBannerUrl(fileUrl);
              }
            }}
            onUploadError={(err: Error) => {
              console.error('[PROFILE] Banner upload error:', err);
              setError('Failed to upload banner: ' + err.message);
              setUploadingBanner(false);
            }}
            onUploadBegin={() => {
              console.log('[PROFILE] Beginning banner upload');
              setUploadingBanner(true);
              setError('');
            }}
            appearance={{
              container: 'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors',
              button: 'bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-base',
              label: 'text-gray-600 text-sm mb-2 block',
              allowedContent: 'text-xs text-gray-500 mt-2'
            }}
            content={{
              button: uploadingBanner ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Uploading...
                </div>
              ) : 'Select Cover Photo',
              label: 'Drop your cover photo here or click to browse',
              allowedContent: 'PNG, JPG up to 4MB - uploads automatically when selected'
            }}
          />
          {uploadingBanner && (
            <p className="text-sm text-gray-600 mt-2">Uploading banner...</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 h-12 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 h-12 px-6 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}