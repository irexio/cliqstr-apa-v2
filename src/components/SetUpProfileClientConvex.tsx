'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { UploadDropzone } from '@/lib/uploadthing-client';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { useAuth } from '@/lib/auth/useAuth';

export default function SetUpProfileClientConvex({
  isEdit = false,
}: {
  isEdit?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const createProfile = useMutation(api.profiles.createProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const getProfile = useQuery(api.profiles.getProfileByUserId, 
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  );

  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitedRole, setInvitedRole] = useState('');
  const [cliqId, setCliqId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If editing, prefill data
  useEffect(() => {
    if (isEdit && getProfile) {
      setUsername(getProfile.username || '');
      setBirthdate(getProfile.account?.birthdate ? new Date(getProfile.account.birthdate).toISOString().split('T')[0] : '');
      setAvatarUrl(getProfile.image || '');
      setBannerUrl(getProfile.bannerImage || '');
    }
  }, [isEdit, getProfile]);

  // For invited users (create mode only)
  useEffect(() => {
    if (isEdit) return;

    const code = sessionStorage.getItem('inviteCode');
    const role = sessionStorage.getItem('invitedRole');
    const cliq = sessionStorage.getItem('cliqId');

    if (code && role && cliq) {
      setInviteCode(code);
      setInvitedRole(role);
      setCliqId(cliq);
    } else {
      router.push('/sign-up');
    }
  }, [router, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to create a profile');
      return;
    }

    if (!username || !birthdate) {
      setError('Please fill out all fields.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setError('Username must be 3–15 characters, letters, numbers, or underscores only.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit && getProfile) {
        // Update existing profile
        await updateProfile({
          profileId: getProfile._id,
          updates: {
            username: username.toLowerCase(),
            image: avatarUrl || undefined,
            bannerImage: bannerUrl || undefined,
          },
        });
      } else {
        // Create new profile
        await createProfile({
          userId: user.id as Id<"users">,
          username: username.toLowerCase(),
          image: avatarUrl || undefined,
          bannerImage: bannerUrl || undefined,
          showMonthDay: true, // Default: show birthday to cliq members
        });
      }

      router.push('/my-cliqs');
    } catch (err: any) {
      console.error('[❌] Profile error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.id) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins">
          Please log in
        </h1>
        <p className="text-gray-600">You need to be logged in to set up your profile.</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16 space-y-6">
      <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins">
        {isEdit ? 'Edit Your Profile' : 'Finish Setting Up'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a fun name"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Birthdate */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthdate</label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Avatar</label>
          <p className="text-xs text-neutral-500 italic mb-2">Recommended: square image, 400×400px</p>
          <UploadDropzone
            endpoint="avatar"
            appearance={{
              button: 'bg-black text-white rounded-full px-4 py-2 text-sm hover:text-[#c032d1] transition',
              container: 'border-dashed border-2 border-neutral-300 p-4 rounded-lg bg-neutral-50',
            }}
            onClientUploadComplete={(res: any) => {
              if (res && res[0]?.url) setAvatarUrl(res[0].url);
            }}
            onUploadError={(err: any) => alert(`Avatar upload error: ${err.message}`)}
          />
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              className="mt-2 w-20 h-20 object-cover rounded-full border"
            />
          )}
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Banner</label>
          <p className="text-xs text-neutral-500 italic mb-2">Ideal size: 1200 x 630 pixels for best results</p>
          <UploadDropzone
            endpoint="banner"
            appearance={{
              button: 'bg-black text-white rounded-full px-4 py-2 text-sm hover:text-[#c032d1] transition',
              container: 'border-dashed border-2 border-neutral-300 p-4 rounded-lg bg-neutral-50',
            }}
            onClientUploadComplete={(res: any) => {
              if (res && res[0]?.url) setBannerUrl(res[0].url);
            }}
            onUploadError={(err: any) => alert(`Banner upload error: ${err.message}`)}
          />
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt="Banner Preview"
              className="mt-2 w-full h-32 object-cover rounded border"
            />
          )}
        </div>

        {/* Invite Info */}
        {!isEdit && inviteCode && (
          <div className="text-sm text-gray-600">
            You're joining a cliq as a <strong>{invitedRole}</strong> using an invite code.
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:text-[#c032d1] text-sm transition"
        >
          {loading
            ? isEdit
              ? 'Saving...'
              : 'Finishing...'
            : isEdit
            ? 'Save Changes'
            : 'Create My Profile'}
        </button>
      </form>
    </main>
  );
}

