import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/banners/list
 * 
 * Query params:
 * - category: Filter by category (e.g., "hobby", "nature", "lifestyle", "professional")
 * - subcategory: Filter by subcategory (e.g., "fishing", "gaming")
 * - q: Search query (searches displayName, id, and tags)
 * - random: Get random banner (optionally from category)
 * 
 * Examples:
 * - /api/banners/list → All banners
 * - /api/banners/list?category=hobby → All hobby banners
 * - /api/banners/list?q=beach → Search for beach
 * - /api/banners/list?category=nature&random=true → Random nature banner
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
      console.log(`[BANNERS API] Searching: ${query}`);
      const results = await convexHttp.query(api.bannerLibrary.search, {
        query: query.trim(),
      });
      return NextResponse.json(results);
    }

    // Get random from category
    if (random && category) {
      console.log(`[BANNERS API] Getting random from category: ${category}`);
      const result = await convexHttp.query(
        api.bannerLibrary.getRandomByCategory,
        { category }
      );
      return NextResponse.json(result);
    }

    // Filter by subcategory
    if (subcategory) {
      console.log(`[BANNERS API] Filtering by subcategory: ${subcategory}`);
      const results = await convexHttp.query(
        api.bannerLibrary.listBySubcategory,
        { subcategory }
      );
      return NextResponse.json(results);
    }

    // Filter by category
    if (category) {
      console.log(`[BANNERS API] Filtering by category: ${category}`);
      const results = await convexHttp.query(api.bannerLibrary.listByCategory, {
        category,
      });
      return NextResponse.json(results);
    }

    // Get all banners
    console.log(`[BANNERS API] Getting all banners`);
    const all = await convexHttp.query(api.bannerLibrary.getAllBanners);
    return NextResponse.json(all);
  } catch (error) {
    console.error('[BANNERS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

