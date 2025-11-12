'use client';

import { useState } from 'react';
import EditProfileForm from './EditProfileForm';

interface EditProfilePageClientProps {
  profile: {
    id: string;
    username: string;
    displayName?: string | null;
    firstName: string | null;
    lastName: string | null;
    about: string | null;
    image: string | null;
    bannerImage: string | null;
    birthdate: Date | null;
    showYear: boolean;
  };
}

export default function EditProfilePageClient({ profile }: EditProfilePageClientProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.image);
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.bannerImage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-md mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Update your profile information and photos</p>
          </div>

          {/* Profile Form - All in one place */}
          <div className="px-6 py-6">
            <EditProfileForm 
              profile={profile} 
              avatarUrl={avatarUrl}
              bannerUrl={bannerUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
