# Image Library - Deployment Guide

**Status:** Ready to deploy to Vercel  
**Estimated Time:** 15 minutes  

---

## 📋 Pre-Deployment Checklist

- [x] Backend code complete
- [x] Convex schema deployed
- [x] API routes tested
- [x] React component built
- [x] 120 avatars in CSV
- [ ] Avatars seeded to Convex
- [ ] Integrated into cliq creation
- [ ] Integrated into profile edit
- [ ] Environment variables set
- [ ] Deployed to Vercel

---

## 🔐 Environment Variables

### Required for Production

```env
# .env.production
ADMIN_SEED_SECRET=your-super-secret-admin-key

# Make sure these are already set:
CONVEX_DEPLOYMENT=<your-prod-deployment>
CONVEX_URL=<your-convex-prod-url>
```

### Change the Default Secret!

**DO NOT** leave `ADMIN_SEED_SECRET=dev-secret-change-in-prod` in production!

1. Generate a strong secret:
   ```bash
   openssl rand -base64 32
   # Output: something like: aBc1De2Fg3Hj4Kl5Mn6Op7Qr8St9Uv0Wx+
   ```

2. Add to Vercel:
   - Go to Vercel Dashboard
   - Your Project → Settings → Environment Variables
   - Add: `ADMIN_SEED_SECRET = <your-random-secret>`

---

## 🚀 Deployment Steps

### **Step 1: Commit Your Changes**
```bash
cd C:\cli\cliqstr-app-convex-migration

git add -A
git commit -m "feat: add image library with 120 avatars

- Add avatarLibrary Convex table
- Create ImageSelector React component
- Add /api/avatars/list endpoint
- Add admin seed endpoint
- Support for 6 avatar categories
- Search, filter, and random selection"

git push origin main
```

### **Step 2: Vercel Auto-Deploy**
- Vercel automatically deploys on push
- Wait for build to complete (~2-3 minutes)
- Check deployment logs for errors

### **Step 3: Seed Avatars to Production**

**Option A: Via Admin Endpoint**
```bash
curl -X POST "https://your-app.vercel.app/api/admin/seed-avatars?secret=YOUR_PRODUCTION_SECRET"

# Response should be:
# {
#   "success": true,
#   "result": {
#     "total": 120,
#     "created": 120,
#     "skipped": 0
#   }
# }
```

**Option B: Via Convex Dashboard**
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your production deployment
3. Go to "Functions" tab
4. Find `avatarLibrary.batchSeed`
5. Click "Run" and paste:
   ```json
   {
     "avatars": [
       {
         "id": "zealous-zebra",
         "displayName": "Zealous Zebra",
         "category": "animals",
         "subcategory": "animals",
         "tags": ["zebra", "striped", "enthusiastic"],
         "description": "Enthusiastic zebra character"
       },
       // ... repeat for all 120 from AVATARS-METADATA.csv
     ]
   }
   ```

**Option C: Via TypeScript Script**
```bash
# If you set up seed script:
NODE_ENV=production npx ts-node scripts/seed-avatars.ts
```

### **Step 4: Verify Production**

Test the API in production:
```bash
# Get all avatars
curl "https://your-app.vercel.app/api/avatars/list"

# Filter by category
curl "https://your-app.vercel.app/api/avatars/list?category=occupations"

# Search
curl "https://your-app.vercel.app/api/avatars/list?q=teacher"

# Should return 120+ results
```

---

## 🧪 Post-Deployment Testing

### **Test 1: API Response**
```javascript
// Open DevTools Console and run:
fetch('/api/avatars/list')
  .then(r => r.json())
  .then(data => console.log(`Found ${data.length} avatars`));

// Should log: "Found 120 avatars"
```

### **Test 2: ImageSelector Component**
Create a test page:
```tsx
// app/test-avatars/page.tsx
'use client';
import { ImageSelector } from '@/components/ImageSelector';
import { useState } from 'react';

export default function Test() {
  const [selected, setSelected] = useState('');
  return (
    <div className="p-8">
      <ImageSelector onSelect={setSelected} selectedId={selected} />
      <p>Selected: {selected || 'None'}</p>
    </div>
  );
}
```

Visit `https://your-app.vercel.app/test-avatars` and verify:
- [ ] Category tabs work
- [ ] Search works
- [ ] Random button works
- [ ] Images load
- [ ] Selection works

### **Test 3: Integration**
- [ ] Add ImageSelector to cliq creation
- [ ] Test that selected avatar ID is captured
- [ ] Verify avatar saves with cliq/profile

---

## 📊 Deployment Timeline

| Step | Time | What |
|------|------|------|
| Git push | 1 min | Commit changes |
| Vercel build | 2-3 min | Build & deploy |
| Seed avatars | 1 min | Populate database |
| Verify API | 2 min | Test endpoints |
| **Total** | **~7 min** | Done! |

---

## 🔍 Troubleshooting

### **Problem: 401 Unauthorized on seed endpoint**
```
Solution: Check your ADMIN_SEED_SECRET matches what you set in Vercel
```

### **Problem: 404 on /api/avatars/list**
```
Solution: Make sure the file exists at src/app/api/avatars/list/route.ts
Restart Vercel deployment
```

### **Problem: Images not loading from CDN**
```
Solution: Verify files exist at public/IMAGE-FEATURE/AVATARS/*.png
Check Image Next.js image optimization settings
```

### **Problem: ImageSelector component not found**
```
Solution: Ensure it's at src/components/ImageSelector.tsx
Check import path in your page
```

### **Problem: CSV not found during seeding**
```
Solution: Verify public/IMAGE-FEATURE/AVATARS-METADATA.csv exists
Check file path in seed endpoint
```

---

## 🎯 Rollback Plan

If something goes wrong:

1. **API broken?**
   ```bash
   git revert <commit-hash>
   git push
   # Vercel auto-redeploys previous version
   ```

2. **Avatars corrupted?**
   ```bash
   # Clear Convex table (via dashboard):
   - Go to Convex Dashboard
   - avatarLibrary table
   - Delete all rows
   - Re-seed with correct data
   ```

3. **Component broken?**
   - Revert component file
   - Keep API endpoint (it's compatible)

---

## ✅ Final Verification Checklist

Before declaring success:

- [ ] Vercel deployment successful (green checkmark)
- [ ] No build errors in deployment logs
- [ ] `/api/avatars/list` returns 120 avatars
- [ ] ImageSelector loads without console errors
- [ ] Category filtering works
- [ ] Search works
- [ ] Random button works
- [ ] Images load from CDN
- [ ] Responsive on mobile
- [ ] Integrated into cliq creation (optional)
- [ ] Integrated into profile edit (optional)

---

## 🚀 Launch Timeline

```
Wednesday:   ✅ Backend built, deployed, avatars seeded
Thursday:    ⏳ Integration into cliq + profile pages
Friday-Sun:  ⏳ APA v2 auth system (separate focus)
Monday:      ⏳ Full feature testing with families
Week 2:      ⏳ Public launch
```

---

## 📞 Need Help?

- Check logs: `https://vercel.com/dashboard`
- Check Convex: `https://dashboard.convex.dev`
- Check database: Convex → avatarLibrary table
- Check API: `curl https://your-app.vercel.app/api/avatars/list`

---

**You're ready to launch the Image Library!** 🎉

_Questions? See `docs/IMAGE-LIBRARY-IMPLEMENTATION-STATUS.md` for full technical details._

