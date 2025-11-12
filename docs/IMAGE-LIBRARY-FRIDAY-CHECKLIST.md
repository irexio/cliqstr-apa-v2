# Image Library - Friday Morning Implementation Checklist

**Status:** 🟢 READY TO BUILD  
**Date:** Friday, November 15, 2025  
**Time Estimate:** 4-5 hours total  

---

## ✅ Pre-Work (COMPLETE)

- [x] All 120 avatars renamed (lowercase, hyphens)
- [x] Avatar metadata CSV created: `public/IMAGE-FEATURE/AVATARS-METADATA.csv`
- [x] Categories finalized (Occupations, Animals, Fantasy, Sports, Fuzzballs, Families)
- [x] Display names approved
- [x] Subcategories + tags organized
- [x] Team approval locked in ✨

---

## 🚀 Friday Morning Tasks (IN ORDER)

### **Task 1: Convex Schema Setup** (30 min)
**File:** `convex/avatarLibrary.ts`

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const uploadAvatarMetadata = mutation({
  args: {
    id: v.string(),
    displayName: v.string(),
    category: v.string(),
    subcategory: v.string(),
    tags: v.array(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("avatarLibrary", args);
  },
});

export const listAvatarsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("avatarLibrary")
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
  },
});

export const getAllAvatars = query({
  handler: async (ctx) => {
    return await ctx.db.query("avatarLibrary").collect();
  },
});

export const searchAvatars = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allAvatars = await ctx.db.query("avatarLibrary").collect();
    const lowerQuery = args.query.toLowerCase();
    return allAvatars.filter(
      (a) =>
        a.displayName.toLowerCase().includes(lowerQuery) ||
        a.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  },
});
```

**Schema Addition (in `convex/schema.ts`):**
```typescript
avatarLibrary: defineTable({
  id: v.string(),
  displayName: v.string(),
  category: v.string(),
  subcategory: v.string(),
  tags: v.array(v.string()),
  description: v.string(),
}).index("by_category", ["category"]),
```

---

### **Task 2: Seed Avatars from CSV** (20 min)
**File:** `scripts/seed-avatars.ts`

```typescript
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

const csvPath = path.join(__dirname, "../public/IMAGE-FEATURE/AVATARS-METADATA.csv");
const csv = fs.readFileSync(csvPath, "utf-8");

Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  complete: async (results) => {
    for (const row of results.data) {
      await ctx.db.insert("avatarLibrary", {
        id: row.id,
        displayName: row.displayName,
        category: row.category,
        subcategory: row.subcategory,
        tags: row.tags.split(";"),
        description: row.description,
      });
    }
  },
});
```

**Or manual approach:** Run Convex mutation 120 times with CSV data.

---

### **Task 3: API Route for Frontend** (15 min)
**File:** `src/app/api/avatars/list/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { convexHttp } from "@/lib/convex-server";
import { api } from "convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    if (query) {
      const results = await convexHttp.query(api.avatarLibrary.searchAvatars, {
        query,
      });
      return NextResponse.json(results);
    }

    if (category) {
      const results = await convexHttp.query(
        api.avatarLibrary.listAvatarsByCategory,
        { category }
      );
      return NextResponse.json(results);
    }

    const all = await convexHttp.query(api.avatarLibrary.getAllAvatars);
    return NextResponse.json(all);
  } catch (error) {
    console.error("[AVATARS] Error:", error);
    return NextResponse.json({ error: "Failed to fetch avatars" }, { status: 500 });
  }
}
```

---

### **Task 4: ImageSelector Component** (90 min)
**File:** `src/components/ImageSelector.tsx`

Key features:
- Category tabs (Occupations, Animals, Fantasy, Sports, Fuzzballs, Families)
- Search by name/tags
- Grid display (6 columns)
- Selected state
- Hover preview
- "Random" button for lazy kids 😄

Example structure:
```tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Avatar {
  id: string;
  displayName: string;
  category: string;
  tags: string[];
}

export const ImageSelector = ({
  onSelect,
  selectedId,
}: {
  onSelect: (id: string) => void;
  selectedId?: string;
}) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [category, setCategory] = useState("occupations");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAvatars();
  }, [category, search]);

  const fetchAvatars = async () => {
    const query = search ? `?q=${search}` : `?category=${category}`;
    const res = await fetch(`/api/avatars/list${query}`);
    const data = await res.json();
    setAvatars(data);
  };

  const handleRandom = () => {
    const random = avatars[Math.floor(Math.random() * avatars.length)];
    onSelect(random.id);
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6">
        {["occupations", "animals", "fantasy", "sports", "fuzzballs", "families"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded ${
                category === cat ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search avatars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={handleRandom}
          className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🎲 Random
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            className={`cursor-pointer p-2 rounded border-2 transition ${
              selectedId === avatar.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
          >
            <Image
              src={`/IMAGE-FEATURE/AVATARS/${avatar.id}.png`}
              alt={avatar.displayName}
              width={100}
              height={100}
              className="w-full h-auto rounded"
            />
            <p className="text-xs text-center mt-2 truncate">{avatar.displayName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### **Task 5: Integration Points** (60 min)

**In Cliq Creation:**
```tsx
// src/app/cliqs/create/page.tsx
import { ImageSelector } from "@/components/ImageSelector";

export default function CreateCliq() {
  const [selectedAvatar, setSelectedAvatar] = useState("");

  return (
    <div>
      <h2>Choose a Cliq Avatar</h2>
      <ImageSelector onSelect={setSelectedAvatar} selectedId={selectedAvatar} />
      {/* Rest of form... */}
    </div>
  );
}
```

**In Profile Edit:**
```tsx
// src/app/profile/edit/page.tsx
import { ImageSelector } from "@/components/ImageSelector";

export default function EditProfile() {
  const [selectedAvatar, setSelectedAvatar] = useState("");

  return (
    <div>
      <h2>Choose Your Avatar</h2>
      <ImageSelector onSelect={setSelectedAvatar} selectedId={selectedAvatar} />
      {/* Rest of form... */}
    </div>
  );
}
```

---

### **Task 6: Test & Deploy** (30 min)

**Smoke Tests:**
- [ ] Convex table has 120 avatars
- [ ] `/api/avatars/list` returns all avatars
- [ ] `/api/avatars/list?category=occupations` filters correctly
- [ ] `/api/avatars/list?q=teacher` searches correctly
- [ ] ImageSelector displays correctly
- [ ] Random button picks avatars
- [ ] Selected state highlights properly
- [ ] Images load from CDN (`/IMAGE-FEATURE/AVATARS/...`)

**Deploy to Vercel:**
```bash
pnpm run build
git add -A
git commit -m "feat: add image library with 120 avatars"
git push
```

---

## 📊 Summary

| Task | Time | Status |
|------|------|--------|
| Convex Schema | 30 min | ⏳ |
| Seed Data | 20 min | ⏳ |
| API Route | 15 min | ⏳ |
| Component | 90 min | ⏳ |
| Integration | 60 min | ⏳ |
| Test & Deploy | 30 min | ⏳ |
| **TOTAL** | **~4.5 hours** | ⏳ |

---

## 🎯 Success Criteria

✅ 120 avatars in Convex database  
✅ ImageSelector component works smoothly  
✅ Filtering by category works  
✅ Search by name/tags works  
✅ Images load from CDN  
✅ Random button delights users  
✅ Integrated into cliq creation & profile edit  
✅ Deployed to Vercel (staging or production)  

---

## 🚀 Timeline

**Friday 8am:** Start with Convex schema  
**Friday 10am:** Seed avatars + API route  
**Friday 12pm:** Build ImageSelector component  
**Friday 2pm:** Integrate into cliq creation & profile  
**Friday 4pm:** Test + smoke tests  
**Friday 5pm:** Deploy ✨  

---

**All 120 avatars ready to delight families!** 🎨✨

---

_Maintained by: Cursor  
Last Updated: 2025-11-14  
Team: Mimi, Vic, Michelle, Jordan_

