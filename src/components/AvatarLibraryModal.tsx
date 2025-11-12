'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageSelector } from '@/components/ImageSelector';

interface AvatarLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarId: string) => void;
  title?: string;
}

export const AvatarLibraryModal: React.FC<AvatarLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Choose from Avatar Library',
}) => {
  const handleSelect = (avatarId: string) => {
    // Convert avatar id to image URL
    const imageUrl = `/IMAGE-FEATURE/AVATARS/${avatarId}.png`;
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
          <ImageSelector onSelect={handleSelect} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

