'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UploadDropzone, UploadButton } from '@/lib/uploadthing-client';
import ScrapbookGallery from './ScrapbookGallery';
import { getAgeGroup } from '@/lib/ageUtils';
import { AvatarLibraryModal } from '@/components/AvatarLibraryModal';

interface ProfileProps {
  profile: {
    id: string;
    name: string;
    username: string;
    birthdate: string;
    bio: string;
    avatarUrl?: string;
    bannerUrl?: string;
    isOwner: boolean;
    canViewGallery: boolean;
    showYear?: boolean;
    accountBirthdate?: string; // Immutable birthdate for age verification
    accountRole?: string;
  };
  scrapbookItems: Array<{
    id: string;
    imageUrl: string;
    caption: string;
    createdAt: Date;
    isPinned: boolean;
  }>;
  onRefresh?: () => void;
}

export default function ProfileClient({ profile, scrapbookItems, onRefresh }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'wall'>('wall');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [profileData, setProfileData] = useState(profile);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);
  const [showBannerLibrary, setShowBannerLibrary] = useState(false);

  // Use Account birthdate for age verification, NEVER Profile birthdate
  const { group } = getAgeGroup(profile.accountBirthdate || profile.birthdate);
  const sectionLabel = group === 'child' ? 'Show & Tell' : 'My Wall';



  const handleProfileUpdate = async (updates: any) => {
    try {
      console.log('[PROFILE] Updating profile with:', updates);
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      console.log('[PROFILE] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PROFILE] Update failed:', errorText);
        throw new Error(`Failed to update profile: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[PROFILE] Update successful:', result);
      
      // Map API fields to local state fields
      const stateUpdates = { ...updates };
      if (updates.about !== undefined) {
        stateUpdates.bio = updates.about;
        delete stateUpdates.about;
      }
      if (updates.image !== undefined) {
        stateUpdates.avatarUrl = updates.image;
        delete stateUpdates.image;
      }
      if (updates.bannerImage !== undefined) {
        stateUpdates.bannerUrl = updates.bannerImage;
        delete stateUpdates.bannerImage;
      }

      if (updates.showYear !== undefined) {
        stateUpdates.showYear = updates.showYear;
      }
      setProfileData({ ...profileData, ...stateUpdates });
      setIsEditingProfile(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('[PROFILE] Error updating profile:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    await handleProfileUpdate({ image: url });
    setIsUploadingAvatar(false);
  };

  const handleBannerUpload = async (url: string) => {
    await handleProfileUpdate({ bannerImage: url });
    setIsUploadingBanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden m-4 sm:m-6">
      {/* Banner Section */}
      <div 
        className={`relative h-60 bg-gradient-to-r from-gray-100 to-gray-200 ${profileData.isOwner ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        onClick={() => profileData.isOwner && setShowBannerLibrary(true)}
      >
        {profileData.bannerUrl ? (
          <Image
            src={profileData.bannerUrl}
            alt="Cover photo"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400" />
        )}
      </div>

      {/* Profile Header */}
      <div className="px-4 sm:px-8 pb-6 relative -mt-[60px] z-10">
        {/* Avatar */}
        <div className="relative w-[120px] h-[120px] rounded-full bg-white border-4 border-white mb-4 overflow-hidden">
          {profileData.avatarUrl ? (
            <Image
              src={profileData.avatarUrl}
              alt={profileData.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-400">👤</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">{profileData.name}</h1>
            <p className="text-base text-gray-600 mb-3">@{profileData.username}</p>
            {profileData.bio && profileData.bio !== 'My Cliq' && (
              <p className="text-gray-700 text-[15px] max-w-[400px] leading-relaxed">
                {profileData.bio}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4 text-sm text-gray-600">
              <span>Birthday: {
                (() => {
                  if (!profileData.birthdate || profileData.birthdate === 'Invalid Date') {
                    return 'Not set';
                  }
                  
                  try {
                    // Handle both ISO string and date string formats
                    let date;
                    if (profileData.birthdate.includes('T')) {
                      // ISO format: 2023-07-15T00:00:00.000Z
                      date = new Date(profileData.birthdate);
                    } else if (profileData.birthdate.length === 8 && /^\d{8}$/.test(profileData.birthdate)) {
                      // Handle MMDDYYYY format like 07071960
                      const month = profileData.birthdate.substring(0, 2);
                      const day = profileData.birthdate.substring(2, 4);
                      const year = profileData.birthdate.substring(4, 8);
                      date = new Date(`${year}-${month}-${day}T00:00:00`);
                    } else {
                      // Date string format: 2023-07-15
                      date = new Date(profileData.birthdate + 'T00:00:00');
                    }
                    
                    if (isNaN(date.getTime())) return 'Not set';
                    
                    return date.toLocaleDateString('en-US', 
                      profileData.showYear 
                        ? { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }
                        : { timeZone: 'UTC', month: 'long', day: 'numeric' }
                    );
                  } catch (error) {
                    console.error('Date parsing error:', error, 'Input:', profileData.birthdate);
                    return 'Not set';
                  }
                })()
              }</span>
            </div>
          </div>
          
          {/* Edit Profile Button */}
          {profileData.isOwner && (
            <Link 
              href="/profile/edit"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition inline-block"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* My Wall Section */}
      <div className="px-4 sm:px-8 py-6">
        <ScrapbookGallery
          items={scrapbookItems}
          userId={profileData.id}
          isOwner={profileData.isOwner}
          sectionLabel={sectionLabel}
          layoutStyle={'masonry'}
          onItemAdded={onRefresh}
        />
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const bioValue = formData.get('bio') as string;
              const birthdateValue = formData.get('birthdate') as string;
              const showYearValue = formData.get('showYear') === 'on';
              
              handleProfileUpdate({
                about: bioValue,
                birthdate: birthdateValue,
                showYear: showYearValue,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">About Me</label>
                  <textarea
                    name="bio"
                    defaultValue={profileData.bio}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-black"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Birthday (Social Display)</label>
                  <input
                    type="date"
                    name="birthdate"
                    defaultValue={profileData.birthdate}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">This is for social display only. Your account birthdate for age verification cannot be changed.</p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="showYear"
                    id="showYear"
                    defaultChecked={profileData.showYear}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="showYear" className="ml-2 text-sm text-gray-700">
                    Show my birth year on my profile
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Library Modal */}
      <AvatarLibraryModal
        isOpen={showAvatarLibrary}
        onClose={() => setShowAvatarLibrary(false)}
        onSelect={(imageUrl) => {
          handleProfileUpdate({ image: imageUrl });
          setShowAvatarLibrary(false);
        }}
        title="Choose Your Avatar"
        type="avatar"
      />

      {/* Banner Library Modal */}
      <AvatarLibraryModal
        isOpen={showBannerLibrary}
        onClose={() => setShowBannerLibrary(false)}
        onSelect={(imageUrl) => {
          handleProfileUpdate({ bannerImage: imageUrl });
          setShowBannerLibrary(false);
        }}
        title="Choose Your Banner"
        type="banner"
      />
      </div>
    </div>
  );
}
