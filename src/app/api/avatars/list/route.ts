import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/avatars/list
 * 
 * Query params:
 * - category: Filter by category (e.g., "occupations", "animals")
 * - subcategory: Filter by subcategory (e.g., "healthcare", "racing")
 * - q: Search query (searches displayName, id, and tags)
 * - random: Get random avatar (optionally from category)
 * 
 * Examples:
 * - /api/avatars/list → All avatars
 * - /api/avatars/list?category=occupations → All occupations
 * - /api/avatars/list?q=teacher → Search for teacher
 * - /api/avatars/list?category=occupations&random=true → Random occupation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const query = searchParams.get('q');
    const random = searchParams.get('random') === 'true';

    // Search by query
    if (query && query.trim()) {
      console.log(`[AVATARS API] Searching: ${query}`);
      const results = await convexHttp.query(api.avatarLibrary.search, {
        query: query.trim(),
      });
      return NextResponse.json(results);
    }

    // Get random from category
    if (random && category) {
      console.log(`[AVATARS API] Getting random from category: ${category}`);
      const result = await convexHttp.query(
        api.avatarLibrary.getRandomByCategory,
        { category }
      );
      return NextResponse.json(result);
    }

    // Filter by subcategory
    if (subcategory) {
      console.log(`[AVATARS API] Filtering by subcategory: ${subcategory}`);
      const results = await convexHttp.query(
        api.avatarLibrary.listBySubcategory,
        { subcategory }
      );
      return NextResponse.json(results);
    }

    // Filter by category
    if (category) {
      console.log(`[AVATARS API] Filtering by category: ${category}`);
      const results = await convexHttp.query(api.avatarLibrary.listByCategory, {
        category,
      });
      return NextResponse.json(results);
    }

    // Get all avatars
    console.log(`[AVATARS API] Getting all avatars`);
    const all = await convexHttp.query(api.avatarLibrary.getAllAvatars);
    return NextResponse.json(all);
  } catch (error) {
    console.error('[AVATARS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}

