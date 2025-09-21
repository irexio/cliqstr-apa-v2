'use client';

import React, { useState } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '@/lib/auth/useAuth';

interface PostCardBubbleProps {
  post: {
    id: string;
    content?: string;
    image?: string;
    createdAt: string;
    author: {
      id?: string;
      myProfile: {
        username: string;
        firstName?: string;
        lastName?: string;
        image?: string;
      } | null;
    };
  };
}

const emojiOptions = ['👍', '❤️', '😂', '😮', '🎉'];

export default function PostCardBubble({ post }: PostCardBubbleProps) {
  const { content, image, createdAt, author } = post;
  const username = author.myProfile?.username || 'Unknown';
  const avatar = author.myProfile?.image;
  const hasProfile = author.myProfile !== null;
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || '');
  
  const { user } = useAuth();
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);
  
  // Check if current user is the author
  const isAuthor = user?.id === author.id;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await updatePost({
        postId: post.id as Id<"posts">,
        content: editContent.trim(),
        userId: user!.id as Id<"users">,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost({
        postId: post.id as Id<"posts">,
        userId: user!.id as Id<"users">,
      });
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  return (
    <div className="flex gap-3 items-start px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
      <UserAvatar 
        image={avatar}
        name={null}
        userId={author.id}
        username={username}
        hasProfile={hasProfile}
        size="md"
        className="border border-gray-300"
        clickable={true}
      />
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">{username}</div>
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content || '');
                }}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {content && <p className="text-sm text-gray-800 whitespace-pre-line mt-1">{content}</p>}
            {image && (
              <img src={image} alt="post" className="mt-2 rounded-md max-h-60 object-contain border" />
            )}
          </>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          {new Date(createdAt).toLocaleString()}
        </div>

        <div className="mt-2 flex gap-2 text-xl">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`hover:scale-110 transition-transform ${selectedEmoji === emoji ? 'opacity-100' : 'opacity-40'}`}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Note: For full emoji picker support (like Google Emoji Picker), you can later install
// a package such as `emoji-mart` and render a full emoji selector instead of static options.
