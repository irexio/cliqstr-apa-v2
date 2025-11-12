import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

interface AvatarRow {
  id: string;
  displayName: string;
  category: string;
  subcategory: string;
  tags: string;
  description: string;
}

/**
 * POST /api/admin/seed-avatars
 * 
 * Admin endpoint to seed all 120 avatars from CSV into Convex
 * 
 * Query params:
 * - secret: Admin secret key (for protection)
 * 
 * Expected request body: none (reads from CSV file)
 */
export async function POST(req: NextRequest) {
  try {
    // Simple security check
    const secret = req.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SEED_SECRET || 'dev-secret-change-in-prod';

    if (secret !== adminSecret) {
      console.warn(`[SEED-AVATARS] Unauthorized attempt with secret: ${secret}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SEED-AVATARS] Starting avatar seeding...');

    // Read CSV file
    const csvPath = path.join(
      process.cwd(),
      'public/IMAGE-FEATURE/AVATARS-METADATA.csv'
    );

    if (!fs.existsSync(csvPath)) {
      console.error(`[SEED-AVATARS] CSV file not found at ${csvPath}`);
      return NextResponse.json(
        { error: 'CSV file not found' },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(',').map((h) => h.trim());
    const records: AvatarRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim());
      const record: any = {};

      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push(record as AvatarRow);
    }

    console.log(`[SEED-AVATARS] Found ${records.length} avatars in CSV`);

    // Convert CSV rows to avatar objects
    const avatars = records.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      category: row.category,
      subcategory: row.subcategory,
      tags: row.tags
        .split(';')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      description: row.description,
    }));

    // Seed via Convex batch mutation
    console.log(`[SEED-AVATARS] Seeding ${avatars.length} avatars...`);

    const result = await convexHttp.mutation(api.avatarLibrary.batchSeed, {
      avatars,
    });

    console.log(`[SEED-AVATARS] ✅ Complete - Created: ${result.created}, Skipped: ${result.skipped}`);

    return NextResponse.json({
      success: true,
      message: 'Avatars seeded successfully',
      result: {
        total: result.total,
        created: result.created,
        skipped: result.skipped,
      },
    });
  } catch (error) {
    console.error('[SEED-AVATARS] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed avatars',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

