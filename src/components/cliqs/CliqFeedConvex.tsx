"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import PostCardBubble from '@/components/PostCardBubble';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth/useAuth';

interface Profile {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  about?: string | null;
  image?: string | null;
  bannerImage?: string | null;
}

interface FormattedPost {
  id: string;
  content?: string;
  image?: string;
  createdAt: string;
  cliqId: string;
  author: {
    id?: string;
    myProfile: {
      username: string;
      image?: string;
    } | null;
  };
}

interface CliqFeedConvexProps {
  cliqId: string;
  posts?: any[]; // Posts passed from parent component
  showPostForm?: boolean; // Whether to show the post creation form
}

export default function CliqFeedConvex({ cliqId, posts: initialPosts, showPostForm = true }: CliqFeedConvexProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState<{[postId: string]: string}>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  // Get posts using Convex query
  const posts = useQuery(api.posts.getCliqPosts,
    user?.id ? {
      cliqId: cliqId as Id<"cliqs">,
      userId: user.id as Id<"users">
    } : "skip"
  ) || initialPosts || [];

  // Debug logging for feed issues
  console.log('CliqFeedConvex Debug:', {
    cliqId,
    userId: user?.id,
    posts: posts,
    postsLength: posts?.length,
    initialPosts: initialPosts,
    postsQueryResult: useQuery(api.posts.getCliqPosts,
      user?.id ? {
        cliqId: cliqId as Id<"cliqs">,
        userId: user.id as Id<"users">
      } : "skip"
    )
  });

  // Mutations
  const createPost = useMutation(api.posts.createPost);
  const addReply = useMutation(api.posts.addReply);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user?.id) return;
    
    setSubmitting(true);
    setError('');
    try {
      await createPost({
        content: content.trim(),
        authorId: user.id as Id<"users">,
        cliqId: cliqId as Id<"cliqs">,
      });
      setContent('');
    } catch (err: any) {
      setError(err.message || 'We couldn\'t share your post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    const content = replyContent[postId]?.trim();
    if (!content || !user?.id) return;
    
    setSubmittingReply(postId);
    setError('');
    try {
      await addReply({
        content,
        postId: postId as Id<"posts">,
        authorId: user.id as Id<"users">,
      });
      // Clear reply content for this post
      setReplyContent(prev => ({ ...prev, [postId]: '' }));
      setReplyingTo(null);
    } catch (err: any) {
      setError(err.message || 'We couldn\'t post your reply. Please try again.');
    } finally {
      setSubmittingReply(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feed Controls & Composer - Only show if showPostForm is true */}
      {showPostForm && (
        <section className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        {user?.myProfile && user.myProfile.username ? (
          /* Post composer for users with profiles */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3 items-start">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.myProfile.image || ''} alt="Profile" />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><circle cx="12" cy="8" r="4" fill="#999"/><path d="M4 20c0-4 8-4 8-4s8 0 8 4" fill="#999"/></svg>
                </AvatarFallback>
              </Avatar>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to post to your cliq?"
                className="flex-1 border border-gray-200 rounded-3xl px-5 py-3 text-base resize-none min-h-[44px] outline-none transition-colors focus:border-black"
                disabled={submitting}
              />
            </div>
            <div className="flex gap-2 ml-[52px]">
              <button type="button" className="px-3 py-1.5 border border-gray-200 bg-white rounded-2xl cursor-pointer text-xs text-gray-600">
                📷 Photo
              </button>
              <button type="button" className="px-3 py-1.5 border border-gray-200 bg-white rounded-2xl cursor-pointer text-xs text-gray-600">
                📹 Video
              </button>
              <button type="button" className="px-3 py-1.5 border border-gray-200 bg-white rounded-2xl cursor-pointer text-xs text-gray-600">
                📊 Poll
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        ) : (
          /* Profile setup message for users without profiles */
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-400">
                  <circle cx="12" cy="8" r="4" fill="currentColor"/>
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Set up your profile to start posting</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Before you post, please take a moment to set up your profile so your cliqmates know who you are.
              </p>
              <a
                href="/profile/create"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Set up my profile →
              </a>
            </div>
          </div>
        )}
        </section>
      )}
      
      {error && <div className="text-red-600 text-center py-2">{error}</div>}
      
      {/* Messages feed using PostCardBubble component */}
      <div className="space-y-6">
        {posts.map(post => {
          // Ensure post has the required structure for PostCardBubble
          const formattedPost: FormattedPost = {
            id: post.id,
            content: post.content,
            image: post.image,
            createdAt: new Date(post.createdAt).toISOString(),
            cliqId: cliqId,
            author: {
              id: post.author?.id,
              myProfile: post.author?.profile ? {
                username: post.author.profile.username || 'Unknown',
                image: post.author.profile.image || undefined
              } : null
            }
          };
          
          // Reply button text logic
          const replyCount = post.replies?.length || 0;
          let replyButtonText = '💬 Reply';
          if (replyCount === 1) {
            replyButtonText = '💬 1 reply';
          } else if (replyCount > 1) {
            replyButtonText = `💬 ${replyCount} replies`;
          }
          
          return (
            <div key={post.id} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-6">
              {/* Main Post */}
              <PostCardBubble post={formattedPost} />
              
              {/* Reply Button */}
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className="text-sm font-medium px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Reply to post"
                >
                  {replyButtonText}
                </button>
              </div>

              {/* Reply Input */}
              {replyingTo === post.id && (
                <div className="mt-4">
                  <div className="flex gap-2 items-start">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.myProfile?.image || ''} alt="Your profile" />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                        {user?.myProfile?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <textarea
                        value={replyContent[post.id] || ''}
                        onChange={(e) => setReplyContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[60px] outline-none focus:border-gray-400"
                        disabled={submittingReply === post.id}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReplySubmit(post.id)}
                          disabled={submittingReply === post.id || !replyContent[post.id]?.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingReply === post.id ? 'Posting...' : 'Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent(prev => ({ ...prev, [post.id]: '' }));
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Existing Replies */}
              {post.replies && post.replies.length > 0 && (
                <div className="pl-4 border-l border-gray-200 mt-4 space-y-3">
                  {post.replies.map((reply: any) => {
                    // Format reply for PostCardBubble
                    const formattedReply: FormattedPost = {
                      id: reply.id,
                      content: reply.content,
                      createdAt: new Date(reply.createdAt).toISOString(),
                      cliqId: cliqId,
                      author: {
                        id: reply.author?.id,
                        myProfile: reply.author?.profile ? {
                          username: reply.author.profile.username || 'Unknown',
                          image: reply.author.profile.image || undefined
                        } : null
                      }
                    };
                    
                    return (
                      <div key={reply.id}>
                        <PostCardBubble post={formattedReply} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {posts.length === 0 && (
        <div className="text-gray-500 text-center py-8 border border-dashed rounded-lg">
          No messages yet. Start a conversation!
        </div>
      )}
    </div>
  );
}

