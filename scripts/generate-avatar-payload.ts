#!/usr/bin/env node

/**
 * Generate avatar payload for Convex batchSeed mutation
 * This creates the JSON you need to paste into Convex dashboard
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse CSV
const csvPath = path.join(__dirname, '../public/IMAGE-FEATURE/AVATARS-METADATA.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',').map((h) => h.trim());

const avatars: any[] = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const values = line.split(',').map((v) => v.trim());
  const record: any = {};

  headers.forEach((header, index) => {
    record[header] = values[index] || '';
  });

  avatars.push({
    id: record.id,
    displayName: record.displayName,
    category: record.category,
    subcategory: record.subcategory,
    tags: record.tags
      .split(';')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0),
    description: record.description,
  });
}

// Output JSON that can be pasted directly into Convex
const payload = {
  avatars,
};

console.log(JSON.stringify(payload, null, 2));

// Also save to file for reference
const outputPath = path.join(__dirname, '../avatar-payload.json');
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.error(`\n✅ Payload saved to: ${outputPath}`);
console.error(`📊 Total avatars: ${avatars.length}`);

