'use client';

// 🔐 APA-COMPATIBLE — PostForm (using Convex)

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth/useAuth';

interface PostFormProps {
  cliqId: string;
  onPostCreated?: (newPost: any) => void;
}

export default function PostForm({ cliqId, onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const createPost = useMutation(api.posts.createPost);

  // Check if user has a profile - required for posting
  if (!user?.myProfile) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Create a profile to start posting</h3>
            <p className="text-sm text-blue-700 mt-1">
              You need to create a profile before you can post in cliqs. 
              <a href="/profile/create" className="underline ml-1">Create your profile now</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user?.id) return;

    setLoading(true);
    setError('');

    try {
      const postId = await createPost({
        content: content.trim(),
        authorId: user.id as Id<"users">,
        cliqId: cliqId as Id<"cliqs">,
      });

      if (onPostCreated) {
        onPostCreated({
          id: postId,
          content,
          cliqId,
          createdAt: Date.now(),
          author: {
            id: user.id,
            profile: {
              username: user.myProfile?.username || 'You',
            },
          },
        });
      }

      setContent('');
    } catch (err: any) {
      console.error('⚠️ Post error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center overflow-hidden">
              {user?.myProfile?.image ? (
                <img 
                  src={user.myProfile.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-sm font-medium">
                  {user?.myProfile?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          
          {/* Post Input */}
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to post to your cliq?"
              rows={3}
              disabled={loading}
              className="resize-none border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3 sm:flex-nowrap">
          <div className="flex items-center gap-4 order-2 sm:order-1 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Photo</span>
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Video</span>
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm">Poll</span>
            </button>
          </div>
          
          <div className="order-1 sm:order-2 w-full sm:w-auto">
            <Button 
              type="submit" 
              disabled={loading || !content.trim()}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-6 py-2"
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
