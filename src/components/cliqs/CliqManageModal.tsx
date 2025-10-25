'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';

interface CliqManageModalProps {
  cliq: {
    id: string;
    name: string;
  };
  open: boolean;
  onClose: () => void;
  onDelete?: (cliqId: string) => void;
  onOpenMembers: () => void;
  isOwner: boolean;
}

export default function CliqManageModal({ 
  cliq, 
  open, 
  onClose, 
  onDelete, 
  onOpenMembers,
  isOwner 
}: CliqManageModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  const handleDelete = async () => {
    // First click: show confirmation state
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    
    // Second click: proceed with deletion
    setConfirmDelete(false);
    setDeleting(true);
    
    try {
      console.log('Deleting cliq:', cliq.id);
      const response = await fetch(`/api/cliqs/${cliq.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);

      if (response.ok && responseData.success) {
        console.log('Cliq deleted successfully');
        onClose(); // Close modal
        if (onDelete) {
          onDelete(cliq.id); // Call parent delete handler
        }
      } else {
        console.error('Delete failed:', responseData);
        alert(`Failed to delete cliq: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting cliq');
    } finally {
      setDeleting(false);
    }
  };

  const handleMembersClick = () => {
    onClose(); // Close this modal
    onOpenMembers(); // Open members modal
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) {
      setAnnouncementError('Announcement cannot be empty');
      return;
    }

    setAnnouncementLoading(true);
    setAnnouncementError('');

    try {
      const response = await fetch(`/api/cliqs/${cliq.id}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: announcementText.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post announcement');
      }

      console.log('[ANNOUNCEMENT] Posted successfully:', data);
      setAnnouncementText('');
      setShowAnnouncementForm(false);
      
      // Optionally show a success toast
      // toast({ title: 'Announcement posted!', description: 'Members will see it now.' });
    } catch (error: any) {
      console.error('[ANNOUNCEMENT_ERROR]', error);
      setAnnouncementError(error.message || 'Failed to post announcement');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full p-0 rounded-lg bg-white max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Manage {cliq.name}</DialogTitle>
        
        <div className="py-2">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{isOwner ? 'Manage' : 'View'} "{cliq.name}"</h3>
          </div>
          
          <div className="py-1">
            <button 
              onClick={handleMembersClick}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {isOwner ? 'Manage Members' : 'View Members'}
            </button>
            
            {isOwner && (
              <>
                <Link 
                  href={`/cliqs/${cliq.id}/edit`}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  onClick={onClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Cliq Settings
                </Link>

                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Post Announcement
                </button>

                {showAnnouncementForm && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Announcement for members
                    </label>
                    <textarea
                      value={announcementText}
                      onChange={(e) => {
                        setAnnouncementText(e.target.value);
                        setAnnouncementError('');
                      }}
                      placeholder="Share important info with your cliq..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{announcementText.length}/500</span>
                      {announcementError && (
                        <span className="text-xs text-red-600">{announcementError}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handlePostAnnouncement}
                        disabled={announcementLoading || !announcementText.trim()}
                        className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        {announcementLoading ? 'Posting...' : 'Post'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAnnouncementForm(false);
                          setAnnouncementText('');
                          setAnnouncementError('');
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                <hr className="my-1" />
                
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all duration-200 ${
                    confirmDelete 
                      ? 'bg-red-500 text-white font-bold shadow-md border-l-4 border-red-700' 
                      : 'text-red-600 hover:bg-red-50'
                  } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6v14a2,2 0,1 -2,2H7a2,2 0,1 -2,-2V6m3,0V4a2,2 0,1 2,-2h4a2,2 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  {deleting ? 'Deleting...' : confirmDelete ? 'Click again to confirm' : 'Delete Cliq'}
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
