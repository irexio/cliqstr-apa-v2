'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageSelector } from '@/components/ImageSelector';

interface AvatarLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
  type?: 'avatar' | 'banner'; // 'avatar' or 'banner' - defaults to 'avatar'
}

export const AvatarLibraryModal: React.FC<AvatarLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Choose from Library',
  type = 'avatar',
}) => {
  const handleSelect = (imageId: string) => {
    // Convert image id to image URL based on type
    const folder = type === 'banner' ? 'BANNERS' : 'AVATARS';
    const imageUrl = `/IMAGE-FEATURE/${folder}/${imageId}.png`;
    onSelect(imageUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ImageSelector onSelect={handleSelect} type={type} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

