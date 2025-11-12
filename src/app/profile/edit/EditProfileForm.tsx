'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarLibraryModal } from '@/components/AvatarLibraryModal';

interface MyProfile {
  id: string;
  firstName: string | null; // Read-only from Account
  lastName: string | null;  // Read-only from Account
  username: string;
  displayName?: string | null; // Nickname for social display
  about: string | null;
  birthdate: Date | null;   // Read-only from Account
  showYear: boolean;
}

interface EditProfileFormProps {
  profile: MyProfile;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

export default function EditProfileForm({ profile, avatarUrl, bannerUrl }: EditProfileFormProps) {
  const router = useRouter();
  
  // firstName, lastName, and birthdate are read-only from Account
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState((profile as any).displayName || '');
  const [about, setAbout] = useState(profile.about || '');
  const [showYear, setShowYear] = useState(profile.showYear);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);
  const [showBannerLibrary, setShowBannerLibrary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        // firstName, lastName, and birthdate are managed by Account - not editable here
        username: username.trim(),
        displayName: displayName.trim() || null, // Nickname for social display
        about: about.trim() || null,
        showYear,
        image: avatarUrl,
        bannerImage: bannerUrl,
      };

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Redirect to the user's updated profile
      if (data.username) {
        router.push(`/profile/${data.username}`);
      } else {
        router.push('/my-cliqs-dashboard'); // fallback
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* First Name - Read Only */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name
        </label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
          {profile.firstName || 'Not set'}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          First name is managed in your Account settings and cannot be changed here.
        </p>
      </div>

      {/* Last Name - Read Only */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name
        </label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
          {profile.lastName || 'Not set'}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Last name is managed in your Account settings and cannot be changed here.
        </p>
      </div>

      {/* Username */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 px-2">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="username"
            required
          />
        </div>
      </div>

      {/* Display Name (Nickname) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Name <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nickname or preferred name"
          maxLength={50}
        />
        <p className="text-xs text-gray-500 mt-1">
          This is how you'll appear in Cliqs. Leave blank to use your account name.
        </p>
      </div>

      {/* About */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-gray-500 mt-2">
          {about.length}/500 characters
        </p>
      </div>

      {/* Avatar Library */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Avatar
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAvatarLibrary(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            <span>🎨</span>
            Choose from Library
          </button>
        </div>
        {avatarUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Current avatar:</p>
            <img src={avatarUrl} alt="Profile Avatar" className="w-16 h-16 rounded-lg" />
          </div>
        )}
      </div>

      {/* Banner Library */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Banner
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowBannerLibrary(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            <span>🎨</span>
            Choose from Library
          </button>
        </div>
        {bannerUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Current banner:</p>
            <img src={bannerUrl} alt="Profile Banner" className="w-full h-24 rounded-lg object-cover" />
          </div>
        )}
      </div>

      {/* Birthdate - Read Only */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Birthdate
        </label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
          {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString('en-US', { 
            timeZone: 'UTC',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Not set'}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Birthdate is managed in your Account settings and cannot be changed here.
        </p>
      </div>

      {/* Show Year Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          id="showYear"
          checked={showYear}
          onChange={(e) => setShowYear(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="showYear" className="text-sm font-medium text-gray-700">
          Show birth year publicly
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Avatar Library Modal */}
      <AvatarLibraryModal
        isOpen={showAvatarLibrary}
        onClose={() => setShowAvatarLibrary(false)}
        onSelect={(imageUrl) => {
          // Extract just the avatar ID from the URL for avatar usage
          const avatarId = imageUrl.split('/').pop()?.replace('.png', '') || '';
          // For profile avatar, we use the full URL
          // Update the avatarUrl by calling the parent with it
          // Since we can't update avatarUrl directly here, we'll need to handle this in the parent
          // For now, we'll store it in a temp state and include in submission
          const tempAvatarUrl = imageUrl;
          // Pass it through the form data
          fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username.trim(),
              displayName: displayName.trim() || null,
              about: about.trim() || null,
              showYear,
              image: tempAvatarUrl,
              bannerImage: bannerUrl,
            }),
          }).then(() => {
            router.refresh();
            setShowAvatarLibrary(false);
          }).catch((err) => setError(err.message));
        }}
        title="Choose Your Avatar"
      />

      {/* Banner Library Modal */}
      <AvatarLibraryModal
        isOpen={showBannerLibrary}
        onClose={() => setShowBannerLibrary(false)}
        onSelect={(imageUrl) => {
          fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username.trim(),
              displayName: displayName.trim() || null,
              about: about.trim() || null,
              showYear,
              image: avatarUrl,
              bannerImage: imageUrl,
            }),
          }).then(() => {
            router.refresh();
            setShowBannerLibrary(false);
          }).catch((err) => setError(err.message));
        }}
        title="Choose Your Banner"
      />
    </form>
  );
}
