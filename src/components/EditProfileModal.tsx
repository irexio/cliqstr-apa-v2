'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type ProfileData = {
  bannerUrl: string;
  avatarUrl: string;
  name: string;
  username: string;
  birthday: string;
  about: string;
  showBirthday: boolean;
  showAge: boolean;
};

type Props = {
  onClose: () => void;
  onSave: (updatedData: ProfileData) => void;
  initialData: ProfileData;
};

export default function EditProfileModal({ onClose, onSave, initialData }: Props) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setBannerPreview(preview);
      setFormData((prev) => ({ ...prev, bannerUrl: preview }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
      setFormData((prev) => ({ ...prev, avatarUrl: preview }));
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 text-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="relative">
          {/* Banner */}
          <div className="h-48 w-full bg-gray-200 relative">
            {(bannerPreview || formData.bannerUrl) && (
              <Image
                src={bannerPreview || formData.bannerUrl}
                alt="Banner preview"
                layout="fill"
                objectFit="cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="absolute top-2 right-2 z-10 bg-white text-sm rounded px-2 py-1 cursor-pointer"
            />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow">
              {avatarPreview || formData.avatarUrl ? (
                <Image src={avatarPreview || formData.avatarUrl} alt="Avatar" fill />
              ) : (
                <div className="bg-gray-300 w-full h-full" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Nickname</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          {/* About / Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300">About Me</label>
            <textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              className="mt-1 w-full border rounded-md p-2"
              rows={3}
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Birthday</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.showBirthday}
                onChange={(e) => setFormData({ ...formData, showBirthday: e.target.checked })}
              />
              <span className="text-sm text-gray-300">Show my birthday</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.showAge}
                onChange={(e) => setFormData({ ...formData, showAge: e.target.checked })}
              />
              <span className="text-sm text-gray-300">Show my age</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
