'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useAuth } from '@/lib/auth/useAuth';

interface LiveCliqMonitoringProps {
  childId: string;
  childName: string;
}

interface Cliq {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  createdAt: number;
  ownerId: string;
  coverImage?: string;
  membership: {
    role: string;
    joinedAt: number;
  };
}

interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: number;
  author: {
    id: string;
    email: string;
    account?: {
      firstName?: string;
      lastName?: string;
    };
    profile?: {
      username: string;
      image?: string;
    };
  };
  replies: Array<{
    id: string;
    content: string;
    createdAt: number;
    author: {
      id: string;
      email: string;
      account?: {
        firstName?: string;
        lastName?: string;
      };
      profile?: {
        username: string;
        image?: string;
      };
    };
  }>;
}

export default function LiveCliqMonitoring({ childId, childName }: LiveCliqMonitoringProps) {
  const { user } = useAuth();
  const [selectedCliqId, setSelectedCliqId] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Get child's cliqs for monitoring
  const childCliqs = useQuery(
    api.cliqs.getChildCliqsForParentMonitoring,
    user?.id ? {
      parentId: user.id as Id<"users">,
      childId: childId as Id<"users">,
    } : "skip"
  ) as Cliq[] | undefined;

  // Get posts for selected cliq
  const cliqPosts = useQuery(
    api.posts.getPostsForParentMonitoring,
    user?.id && selectedCliqId ? {
      parentId: user.id as Id<"users">,
      childId: childId as Id<"users">,
      cliqId: selectedCliqId as Id<"cliqs">,
    } : "skip"
  ) as Post[] | undefined;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAuthorDisplayName = (author: Post['author']) => {
    if (author.account?.firstName && author.account?.lastName) {
      return `${author.account.firstName} ${author.account.lastName}`;
    }
    if (author.profile?.username) {
      return author.profile.username;
    }
    return author.email;
  };

  const isChildPost = (authorId: string) => {
    return authorId === childId;
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-red-600">Authentication required for monitoring.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🔍 Live Cliq Monitoring - {childName}
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Silent Monitoring:</strong> You can observe {childName}'s cliq activity in real-time. 
          This monitoring is completely invisible to {childName} and other cliq members. 
          You cannot post, reply, or interact with the cliq.
        </p>
      </div>

      {!childCliqs || childCliqs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No cliqs found for {childName}.</p>
          <p className="text-sm mt-1">Cliqs will appear here when {childName} joins them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cliq Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Cliq to Monitor:
            </label>
            <select
              value={selectedCliqId || ''}
              onChange={(e) => {
                setSelectedCliqId(e.target.value);
                setIsMonitoring(true);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Choose a cliq...</option>
              {childCliqs.map((cliq) => (
                <option key={cliq.id} value={cliq.id}>
                  {cliq.name} ({cliq.privacy})
                </option>
              ))}
            </select>
          </div>

          {/* Live Feed */}
          {selectedCliqId && cliqPosts && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">
                  Live Feed: {childCliqs.find(c => c.id === selectedCliqId)?.name}
                </h4>
                <p className="text-xs text-gray-600">
                  Real-time updates • {cliqPosts.length} posts
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {cliqPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No posts in this cliq yet.</p>
                    <p className="text-sm mt-1">Posts will appear here as members share content.</p>
                  </div>
                ) : (
                  cliqPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`border rounded-lg p-3 ${
                        isChildPost(post.author.id)
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {post.author.profile?.image ? (
                              <img
                                src={post.author.profile.image}
                                alt={getAuthorDisplayName(post.author)}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">
                                {getAuthorDisplayName(post.author).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getAuthorDisplayName(post.author)}
                              {isChildPost(post.author.id) && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {childName}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(post.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-800">{post.content}</p>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post image"
                            className="mt-2 max-w-full h-auto rounded-lg"
                          />
                        )}
                      </div>

                      {/* Replies */}
                      {post.replies.length > 0 && (
                        <div className="ml-4 border-l-2 border-gray-200 pl-3 space-y-2">
                          <p className="text-xs text-gray-500 font-medium">
                            {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                          </p>
                          {post.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`text-sm p-2 rounded ${
                                isChildPost(reply.author.id)
                                  ? 'bg-blue-100 border border-blue-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {getAuthorDisplayName(reply.author)}
                                </span>
                                {isChildPost(reply.author.id) && (
                                  <span className="text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded">
                                    {childName}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-800">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedCliqId && (
            <div className="text-xs text-gray-500 text-center">
              <p>🔍 Silent monitoring active - {childName} cannot see this view</p>
              <p>Posts and replies update automatically in real-time</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
