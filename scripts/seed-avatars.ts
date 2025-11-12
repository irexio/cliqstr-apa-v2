#!/usr/bin/env node

/**
 * Seed script to populate avatarLibrary table from CSV
 * 
 * Usage: npx ts-node scripts/seed-avatars.ts
 * 
 * This reads the CSV file at public/IMAGE-FEATURE/AVATARS-METADATA.csv
 * and seeds all avatars into the Convex avatarLibrary table.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Simple CSV parser (no external dependencies)
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no headers');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map((v) => v.trim());
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    records.push(record);
  }

  return records;
}

async function seedAvatars() {
  console.log('🌱 Starting avatar seeding...\n');

  // Read CSV file
  const csvPath = path.join(
    __dirname,
    '../public/IMAGE-FEATURE/AVATARS-METADATA.csv'
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`📊 Found ${records.length} avatars in CSV\n`);

  // Initialize Convex client
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error(
      '❌ CONVEX_URL environment variable is not set. Please set it and try again.'
    );
    process.exit(1);
  }

  const client = new ConvexClient(convexUrl);

  // Prepare avatar data
  const avatars = records.map((record) => ({
    id: record.id,
    displayName: record.displayName,
    category: record.category,
    subcategory: record.subcategory,
    tags: record.tags.split(';').map((tag) => tag.trim()),
    description: record.description,
  }));

  // Seed in batches (Convex has size limits, so batch them)
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < avatars.length; i += batchSize) {
    const batch = avatars.slice(i, Math.min(i + batchSize, avatars.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(avatars.length / batchSize);

    try {
      console.log(
        `📤 Seeding batch ${batchNum}/${totalBatches} (${batch.length} avatars)...`
      );

      const result = await client.mutation(api.avatarLibrary.batchSeed, {
        avatars: batch,
      });

      successCount += result.created;
      console.log(
        `   ✅ Created: ${result.created}, Skipped: ${result.skipped}\n`
      );
    } catch (error) {
      errorCount += batch.length;
      console.error(`   ❌ Error seeding batch ${batchNum}:`, error, '\n');
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`   Total created: ${successCount}`);
  console.log(`   Total errors: ${errorCount}`);
  console.log(`   Total attempted: ${avatars.length}\n`);

  if (errorCount === 0) {
    console.log('✨ All avatars successfully seeded!\n');
  } else {
    console.log(
      `⚠️  Some avatars failed to seed. Check logs above for details.\n`
    );
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the seed script
seedAvatars().catch((error) => {
  console.error('❌ Fatal error during seeding:', error);
  process.exit(1);
});

