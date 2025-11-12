# Cliqstr Image Library Feature — Complete Architecture
*Avatar & Banner Selection for Enhanced User Identity*

---

## 🎨 Executive Summary

The **Image Library** empowers Cliqstr users to express identity through curated avatar and banner collections instead of generic profile pictures. This increases user engagement, personalizes the experience, and creates a foundation for future "cliq spaces" customization.

**Current Status:** 130+ avatars + multiple banners created in Adobe Express by Mimi. Ready for implementation.

---

## 📊 Feature Overview

### **What Users Get**
- **Avatars:** 130+ unique, colorful character designs (professions, animals, fantasy, families, sports)
- **Banners:** Themed collection across categories (hobbies, nature, lifestyle, professional)
- **Selection UI:** Easy picker during cliq creation or profile editing
- **Persistence:** Avatar + banner saved to user profile
- **Visibility:** Displayed on user profile, cliq member lists, and throughout platform

### **Why This Matters**
1. **Identity Expression:** Kids/adults choose avatars that represent them
2. **Privacy:** No pressure to use real photos
3. **Fun Factor:** Cliqstr feels playful, not corporate
4. **Engagement:** Users spend time browsing/choosing avatars
5. **Foundation:** First step toward "cliq spaces" (customizable group pages)

---

## 🏗️ Architecture

### **1. File Storage**
```
/public/IMAGE-FEATURE/
├── AVATARS/
│   ├── OCCUPATIONS/
│   │   ├── doctor.png
│   │   ├── lawyer.png
│   │   ├── firefighter.png
│   │   └── ... (20+ occupations)
│   ├── ANIMALS/
│   │   ├── cat.png
│   │   ├── spider.png
│   │   ├── octopus.png
│   │   └── ... (15+ animals)
│   ├── FANTASY/
│   │   ├── dragon.png
│   │   ├── unicorn.png
│   │   └── ... (10+ fantasy creatures)
│   ├── FAMILIES/
│   │   ├── family-2-adults.png
│   │   ├── family-1-adult-2-kids.png
│   │   └── ... (5+ family configs)
│   └── SPORTS/
│       ├── soccer.png
│       ├── basketball.png
│       └── ... (8+ sports)
│
└── BANNERS/
    ├── HOBBY/
    │   ├── GAMING/
    │   ├── MUSIC/
    │   ├── SPORTS/
    │   └── ... (5+ subcategories)
    ├── NATURE/
    │   ├── ANIMALS/
    │   ├── OUTDOOR/
    │   └── ... (3+ subcategories)
    ├── LIFESTYLE/
    │   ├── FOOD/
    │   ├── TRAVEL/
    │   └── ... (3+ subcategories)
    └── PROFESSIONAL/
        ├── TECH/
        ├── BUSINESS/
        └── ... (2+ subcategories)
```

**Served by:** Vercel CDN (automatically caches images at edge)

---

### **2. Convex Metadata Table**

```typescript
imageLibrary: defineTable({
  // Identification
  filename: v.string(),              // e.g., "doctor.png"
  originalPath: v.string(),          // e.g., "/AVATARS/OCCUPATIONS/doctor.png"
  
  // Categorization
  type: v.union(
    v.literal("avatar"),
    v.literal("banner")
  ),
  category: v.string(),              // e.g., "occupations", "gaming", "nature"
  subCategory: v.optional(v.string()), // e.g., "professions", "games", "animals"
  tags: v.array(v.string()),         // e.g., ["profession", "work", "career"]
  
  // Metadata
  displayName: v.string(),           // Human-readable: "Doctor Avatar"
  description: v.string(),           // "A friendly doctor character"
  dimensions: v.object({
    width: v.number(),               // in pixels
    height: v.number(),
  }),
  fileSize: v.number(),              // in bytes
  
  // Availability
  isActive: v.boolean(),             // Toggle to hide old images
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_type", ["type"])
  .index("by_category", ["category"])
  .index("by_type_category", ["type", "category"])
```

---

### **3. Profile Storage**

Update `myProfiles` table:

```typescript
myProfiles: defineTable({
  // ... existing fields ...
  
  // Image selections
  avatarId: v.optional(v.id("imageLibrary")), // Selected avatar
  avatarFilename: v.optional(v.string()),     // Cached filename
  
  bannerImageId: v.optional(v.id("imageLibrary")), // Selected banner
  bannerFilename: v.optional(v.string()),      // Cached filename
  
  cliqBannerImageId: v.optional(v.id("imageLibrary")), // For cliq banners
  cliqBannerFilename: v.optional(v.string()),   // Cached filename
})
```

---

### **4. API Routes**

#### **GET `/api/image-library/list`**
```typescript
// Query: ?type=avatar&category=occupations
// Returns: Array of images with metadata
{
  images: [
    {
      id: "...",
      filename: "doctor.png",
      displayName: "Doctor Avatar",
      imageUrl: "/IMAGE-FEATURE/AVATARS/OCCUPATIONS/doctor.png",
      category: "occupations"
    },
    // ... more images
  ]
}
```

#### **GET `/api/image-library/categories`**
```typescript
// Returns: All available categories
{
  avatars: {
    occupations: 25,
    animals: 15,
    fantasy: 10,
    families: 5,
    sports: 8
  },
  banners: {
    hobby: 40,
    nature: 30,
    lifestyle: 25,
    professional: 15
  }
}
```

#### **POST `/api/profile/update-avatar`**
```typescript
// Body: { avatarId, cliqId? }
// Updates profile with selected avatar
// Returns: Updated profile
```

#### **POST `/api/cliq/update-banner`**
```typescript
// Body: { bannerId, cliqId }
// Updates cliq with selected banner
// Returns: Updated cliq
```

---

### **5. UI Components**

#### **`ImageSelector.tsx`** (Reusable)
```typescript
interface ImageSelectorProps {
  type: "avatar" | "banner";
  category?: string;
  onSelect: (imageId: string, filename: string) => void;
  selectedId?: string;
}

// Usage:
// <ImageSelector 
//   type="avatar" 
//   category="occupations"
//   onSelect={handleAvatarSelect}
//   selectedId={currentAvatarId}
// />
```

**Features:**
- Grid display (6-8 columns)
- Lazy loading for performance
- Search/filter by category
- Selected state indicator (checkmark)
- Fallback if image fails to load

#### **Avatar Selector** (During Profile Creation)
- Show all categories
- Let user browse & select
- Preview in real-time
- Save to profile

#### **Banner Selector** (During Cliq Creation)
- Show banners only
- Category filters
- Preview in cliq header
- Save to cliq

---

## 🚀 Implementation Phases

### **Phase 1: MVP (Week 1-2)**
- ✅ Organize images in `/public/IMAGE-FEATURE`
- ✅ Create Convex `imageLibrary` table
- ✅ Implement `imageLibrary/list` API route
- ✅ Build `ImageSelector` component
- ✅ Add avatar selection to profile editing
- ✅ Add banner selection to cliq creation

**Result:** Users can pick avatars + banners during onboarding

### **Phase 2: Enhancement (Week 3+)**
- Profile page displays selected avatar
- Cliq page displays selected banner
- Member lists show avatars
- Search/discovery for image categories
- Favorites/bookmarking images

### **Phase 3: Advanced (Future)**
- Image upload by admins
- User-created avatars (if applicable)
- Seasonal/limited-edition collections
- Avatar animations/effects
- "Cliq spaces" — full page customization

---

## 📈 Performance Considerations

### **Image Optimization**
- **Format:** PNG (transparent background for avatars, opaque for banners)
- **Size:** 
  - Avatars: 256x256px (30-50 KB each)
  - Banners: 1200x400px (100-200 KB each)
- **Compression:** Optimize in Adobe Express before exporting
- **Lazy Loading:** Load images on scroll in grid

### **CDN Caching**
- Vercel automatically caches `/public` files
- Images cached at edge globally
- No additional cost

### **Database Queries**
- Index on `type` and `category` for fast filtering
- Cache category list in memory (rarely changes)
- Limit API responses to 100 images per call

---

## 🔐 Data Privacy

- **No user tracking:** Just stores which avatar user selected
- **No profiling:** Selection is for UX, not analytics
- **COPPA compliant:** Avatar choice is not personal data
- **Easy deletion:** If user deletes profile, avatar preference deleted

---

## 📊 Success Metrics

**Track:**
- % of users selecting custom avatar (vs. default)
- Most popular avatar categories
- Banner selection rate during cliq creation
- Time spent in image selector
- User retention (image customization increases engagement?)

---

## 🎬 User Journey

```
1. User creates profile
   ↓
2. System prompts: "Choose your avatar"
   ↓
3. ImageSelector opens (all categories visible)
   ↓
4. User browses → selects "Doctor" avatar
   ↓
5. Avatar saved to profile
   ↓
6. User creates cliq
   ↓
7. System prompts: "Choose a cliq banner"
   ↓
8. BannerSelector opens
   ↓
9. User browses → selects "Gaming" banner
   ↓
10. Banner saved to cliq
   ↓
11. Profile + Cliq display selected images ✨
```

---

## 📋 Implementation Checklist

- [ ] Organize images in `/public/IMAGE-FEATURE` folders
- [ ] Create `imageLibrary` Convex table
- [ ] Populate metadata for all images
- [ ] Implement `/api/image-library/list` route
- [ ] Implement `/api/image-library/categories` route
- [ ] Implement `/api/profile/update-avatar` route
- [ ] Implement `/api/cliq/update-banner` route
- [ ] Build `ImageSelector` component
- [ ] Integrate into profile creation flow
- [ ] Integrate into cliq creation flow
- [ ] Display avatars in profiles
- [ ] Display banners in cliqs
- [ ] Test image loading performance
- [ ] Add lazy loading if needed
- [ ] Deploy and monitor

---

## 💡 Future Ideas

1. **Seasonal Collections:** Holiday avatars (Christmas, Halloween, etc.)
2. **Achievement Badges:** Unlock special avatars by completing actions
3. **User Uploads:** Parents can upload custom avatars for their kids
4. **Avatar Animations:** Avatars that move/react
5. **Cliq Spaces:** Full page customization with backgrounds, fonts, etc.

---

## 🎯 This is the Foundation

The Image Library is more than cute avatars. It's the **first step toward true personalization** in Cliqstr. Every feature builds on this:
- Avatars → Profiles
- Banners → Cliqs
- Customization → Cliq Spaces
- Expression → Community

This is how Cliqstr feels different from corporate social media. **Personal. Playful. Real.**

---

© 2025 Cliqstr Inc.
Designed by Aiden + Mimi Thomas
Built with Cursor AI



