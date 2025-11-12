# Image Library — Implementation Action Plan
*Timeline & Execution Strategy*

---

## 📊 Current Status

**What's Ready:**
- ✅ 130+ avatars created (Adobe Express, various colors)
- ✅ Multiple banner designs created
- ✅ Categories identified (Occupations, Animals, Fantasy, Families, Sports)
- ✅ Architecture documented

**What's Needed:**
- ⏳ Organize images into folder structure
- ⏳ Final avatar naming & categorization
- ⏳ Create Convex metadata table
- ⏳ Implement API routes
- ⏳ Build UI selector component
- ⏳ Integrate into signup flow

---

## 🎯 Phase 1: Image Organization (Week 1-2)

### **Step 1: Folder Structure** (30 min)
```bash
# In /public/IMAGE-FEATURE/
mkdir -p AVATARS/OCCUPATIONS
mkdir -p AVATARS/ANIMALS
mkdir -p AVATARS/FANTASY
mkdir -p AVATARS/FAMILIES
mkdir -p AVATARS/SPORTS

mkdir -p BANNERS/HOBBY/{GAMING,MUSIC,SPORTS,ART}
mkdir -p BANNERS/NATURE/{ANIMALS,OUTDOOR,WEATHER}
mkdir -p BANNERS/LIFESTYLE/{FOOD,TRAVEL,HOME}
mkdir -p BANNERS/PROFESSIONAL/{TECH,BUSINESS,EDUCATION}
```

### **Step 2: Naming Convention** (1 hour)
**Format:** `{adjective}-{noun}-{number}.png`

**Examples:**
- `happy-doctor-1.png`
- `colorful-cat-1.png`
- `friendly-monster-2.png`
- `gaming-neon-1.png`

**Rules:**
- Lowercase + hyphens
- No spaces
- Numbers for variants (same design, different colors)
- Consistent per category

### **Step 3: Copy Images** (1-2 hours)
1. Export from Adobe Express as PNG
2. Optimize file size (use TinyPNG or similar)
3. Copy to appropriate folder
4. Name according to convention
5. Verify file size (30-50 KB for avatars, 100-200 KB for banners)

### **Step 4: Create Metadata CSV** (30 min)
```csv
filename,type,category,subcategory,displayName,description,width,height
happy-doctor-1.png,avatar,occupations,,Happy Doctor,A friendly doctor in scrubs,256,256
angry-cat-2.png,avatar,animals,,Angry Cat,A feisty tabby cat,256,256
gaming-purple-banner.png,banner,hobby,gaming,Purple Gaming,Neon gaming aesthetic,1200,400
```

---

## 🔧 Phase 2: Backend Setup (Week 2)

### **Step 1: Create Convex Table** (1 hour)

```typescript
// convex/schema.ts
imageLibrary: defineTable({
  filename: v.string(),
  originalPath: v.string(),
  type: v.union(v.literal("avatar"), v.literal("banner")),
  category: v.string(),
  subCategory: v.optional(v.string()),
  tags: v.array(v.string()),
  displayName: v.string(),
  description: v.string(),
  dimensions: v.object({ width: v.number(), height: v.number() }),
  fileSize: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_type", ["type"])
  .index("by_category", ["category"])
  .index("by_type_category", ["type", "category"])
```

### **Step 2: Populate Metadata** (2 hours)
```typescript
// convex/imageLibrary.ts
mutation("seedImageLibrary", async (ctx, args) => {
  // Parse CSV data
  const images = [
    {
      filename: "happy-doctor-1.png",
      originalPath: "/IMAGE-FEATURE/AVATARS/OCCUPATIONS/happy-doctor-1.png",
      type: "avatar",
      category: "occupations",
      displayName: "Happy Doctor",
      description: "A friendly doctor in scrubs",
      dimensions: { width: 256, height: 256 },
      fileSize: 35000,
      tags: ["profession", "work", "doctor", "healthcare"],
      isActive: true,
    },
    // ... more images
  ];
  
  for (const img of images) {
    await ctx.db.insert("imageLibrary", {
      ...img,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
});
```

### **Step 3: API Routes** (2 hours)

```typescript
// /api/image-library/list
export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // avatar|banner
  const category = url.searchParams.get("category");
  
  const images = await convexHttp.query(api.imageLibrary.listByType, {
    type,
    category,
  });
  
  return NextResponse.json({
    images: images.map(img => ({
      id: img._id,
      filename: img.filename,
      displayName: img.displayName,
      imageUrl: `${NEXT_PUBLIC_BASE_URL}${img.originalPath}`,
      category: img.category,
    }))
  });
}

// /api/image-library/categories
export async function GET(req: Request) {
  const categories = await convexHttp.query(api.imageLibrary.listCategories);
  return NextResponse.json(categories);
}
```

---

## 🎨 Phase 3: Frontend (Week 3)

### **Step 1: ImageSelector Component** (2 hours)

```typescript
// src/components/ImageSelector.tsx
interface ImageSelectorProps {
  type: "avatar" | "banner";
  onSelect: (imageId: string, filename: string) => void;
  selectedId?: string;
}

export function ImageSelector({ type, onSelect, selectedId }: ImageSelectorProps) {
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  useEffect(() => {
    // Fetch images for type + category
    fetch(`/api/image-library/list?type=${type}&category=${selectedCategory}`)
      .then(res => res.json())
      .then(data => setImages(data.images));
  }, [type, selectedCategory]);
  
  return (
    <div className="image-selector">
      {/* Category tabs */}
      {/* Grid of images */}
      {/* On click, call onSelect */}
    </div>
  );
}
```

### **Step 2: Profile Integration** (1 hour)
- Add "Change Avatar" button in profile settings
- Mount ImageSelector modal
- Save selection via `/api/profile/update-avatar`
- Display avatar on profile

### **Step 3: Cliq Integration** (1 hour)
- Add "Change Banner" button in cliq settings
- Mount ImageSelector modal (banners only)
- Save selection via `/api/cliq/update-banner`
- Display banner on cliq header

---

## 📋 Implementation Checklist

### **Phase 1: Image Organization**
- [ ] Create folder structure in `/public/IMAGE-FEATURE`
- [ ] Finalize avatar naming convention
- [ ] Export all avatars from Adobe Express as PNG
- [ ] Compress images (TinyPNG or similar)
- [ ] Copy to appropriate folders
- [ ] Verify file sizes and dimensions
- [ ] Create CSV metadata file
- [ ] Export all banners (similar process)

### **Phase 2: Backend Setup**
- [ ] Add `imageLibrary` table to Convex schema
- [ ] Create `imageLibrary.ts` mutation for seeding
- [ ] Parse CSV and populate database
- [ ] Create `/api/image-library/list` route
- [ ] Create `/api/image-library/categories` route
- [ ] Create `/api/profile/update-avatar` route
- [ ] Create `/api/cliq/update-banner` route
- [ ] Update `myProfiles` table to store avatar/banner IDs
- [ ] Update `cliqs` table to store banner ID

### **Phase 3: Frontend**
- [ ] Build `ImageSelector` component
- [ ] Build `ImageGrid` component (for display)
- [ ] Add avatar selector to profile settings
- [ ] Add banner selector to cliq settings
- [ ] Display avatar on profile pages
- [ ] Display banner on cliq headers
- [ ] Add lazy loading for image grid
- [ ] Test on mobile (responsive design)
- [ ] Test image load performance

### **Phase 4: Deployment & Testing**
- [ ] Deploy to staging
- [ ] Test all avatar/banner selections
- [ ] Test image loading from CDN
- [ ] Test on 4G network (ensure fast load)
- [ ] Get user feedback (let Rachel/Vic test)
- [ ] Deploy to production

---

## ⏱️ Timeline Estimate

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| **1** | Image organization | 3 hours | Week 1 | Week 1 |
| **2** | Backend setup | 5 hours | Week 2 | Week 2 |
| **3** | Frontend build | 4 hours | Week 3 | Week 3 |
| **4** | Testing & deploy | 3 hours | Week 3 | Week 3 |

**Total: ~15 hours of development**

---

## 🎯 Success Criteria

- ✅ All 130+ avatars in organized folders
- ✅ All banners categorized and named
- ✅ Convex metadata table populated
- ✅ Image selector UI works smoothly
- ✅ Users can select avatar during profile creation
- ✅ Users can select banner during cliq creation
- ✅ Avatars display correctly on profile/posts
- ✅ Banners display correctly on cliqs
- ✅ Images load fast (< 1 second)
- ✅ No broken image links
- ✅ Mobile responsive design works

---

## 💡 Performance Optimization

**During Implementation:**
1. **Lazy load images** in selector (don't load all at once)
2. **Cache category list** in memory (rarely changes)
3. **Compress images** before uploading (max 50 KB per avatar)
4. **Use CDN** (Vercel automatically handles `/public`)
5. **Add `next/image`** for optimized loading

**Post-Launch Monitoring:**
1. Track image load time
2. Monitor for broken links
3. Gather user feedback on selector UX
4. Track most-selected avatars/banners

---

## 🚀 Phase 4: Future Enhancements

Once MVP is live, consider:
- **Seasonal collections** (Halloween, Christmas avatars)
- **Search/favorites** (star your favorite avatars)
- **Avatar animations** (avatars that react/move)
- **User uploads** (parents can upload custom avatars)
- **Cliq spaces** (full page customization)
- **Achievement badges** (unlock special avatars)

---

## 🎬 User Delight Moment

When a kid signs up:
```
1. "Choose your avatar"
2. Browse 130+ colorful characters
3. Pick something that represents them
4. See their avatar on their profile immediately ✨
5. Feel proud & engaged with Cliqstr
```

**That's the magic.**

---

© 2025 Cliqstr Inc.
Designed by Aiden + Mimi Thomas
Built with Cursor AI



