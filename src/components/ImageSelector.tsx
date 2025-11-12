'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Avatar {
  _id: string;
  id: string;
  displayName: string;
  category: string;
  subcategory: string;
  tags: string[];
  description: string;
}

interface ImageSelectorProps {
  onSelect: (id: string) => void;
  selectedId?: string;
  mode?: 'compact' | 'full'; // compact = smaller grid, full = 6 columns
  categoryFilter?: string; // Optional: pre-filter by category
  className?: string;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  onSelect,
  selectedId,
  mode = 'full',
  categoryFilter,
  className = '',
}) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(categoryFilter || 'occupations');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedAvatars, setDisplayedAvatars] = useState<Avatar[]>([]);

  // Fetch all avatars on mount
  useEffect(() => {
    fetchAllAvatars();
    fetchCategories();
  }, []);

  // Filter/search whenever category or search changes
  useEffect(() => {
    filterAvatars();
  }, [activeCategory, searchQuery, avatars]);

  const fetchAllAvatars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/avatars/list');
      const data = await res.json();
      setAvatars(data);
    } catch (error) {
      console.error('[ImageSelector] Error fetching avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/avatars/list');
      const data = await res.json();
      const cats = new Set(data.map((a: Avatar) => a.category));
      setCategories(Array.from(cats).sort() as string[]);
    } catch (error) {
      console.error('[ImageSelector] Error fetching categories:', error);
    }
  };

  const filterAvatars = () => {
    let filtered = avatars;

    // Filter by category
    if (activeCategory) {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    // Search by name, id, or tags
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.displayName.toLowerCase().includes(query) ||
          a.id.toLowerCase().includes(query) ||
          a.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setDisplayedAvatars(filtered);
  };

  const handleRandom = () => {
    if (displayedAvatars.length > 0) {
      const random = displayedAvatars[Math.floor(Math.random() * displayedAvatars.length)];
      onSelect(random.id);
    }
  };

  const gridCols = mode === 'compact' ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6' : 'grid-cols-6';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeCategory === cat
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Search and Random */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Search avatars... (name, tags)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleRandom}
          variant="outline"
          className="px-6"
          disabled={displayedAvatars.length === 0}
        >
          🎲 Random
        </Button>
      </div>

      {/* Avatar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading avatars...</p>
        </div>
      ) : displayedAvatars.length > 0 ? (
        <div className={`grid ${gridCols} gap-4`}>
          {displayedAvatars.map((avatar) => (
            <div
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`cursor-pointer p-2 rounded-lg border-2 transition transform hover:scale-105 ${
                selectedId === avatar.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              title={avatar.displayName}
            >
              <div className="relative w-full aspect-square mb-2">
                <Image
                  src={`/IMAGE-FEATURE/AVATARS/${avatar.id}.png`}
                  alt={avatar.displayName}
                  fill
                  className="object-contain rounded"
                  sizes="(max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                />
              </div>
              <p className="text-xs text-center truncate font-medium text-gray-700">
                {avatar.displayName}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">
            {searchQuery ? 'No avatars match your search' : 'No avatars available'}
          </p>
        </div>
      )}

      {/* Display Count */}
      <div className="text-sm text-gray-600 text-center">
        Showing {displayedAvatars.length} of {avatars.length} avatars
      </div>
    </div>
  );
};

