# Cliqstr Compliance TODO (Second Review)

This file tracks compliance-related items that require a second look after being rolled out of the repo.

---

## ✅ Core Compliance Areas

1. **COPPA (Children’s Online Privacy Protection Act)**
   - Age verification flow for under-13 users.
   - Verifiable parental consent (logging, storage of consent).
   - Parent HQ permissions tied to consent records.

2. **GDPR/International**
   - Data handling and storage transparency.
   - Right to access, right to delete, right to export.
   - Age of digital consent (varies by country, e.g., 13–16 in EU).

3. **Consent Logging**
   - Parent consent captured and timestamped.
   - Stored in Convex with audit trail.
   - Needed for both sign-up and when features are unlocked (e.g., video, invites).

4. **Privacy & Terms**
   - Privacy Policy (plain-language + legal version).
   - Terms of Service updated with: fair use, plan limits, red alerts, AI moderation.
   - Safety Page cross-links.

5. **AI Moderation Transparency**
   - Disclosure that AI scans text, images, and video.
   - Clear language that moderation is for safety, not surveillance.
   - Escalation rules for flagged content.

---

## ⚠️ To Rebuild / Verify in Repo
- [ ] Age-gated sign-up (birthdate → automatic role assignment).
- [ ] Consent approval workflow (parent email, PHQ logging).
- [ ] Consent re-check when upgrading features (video, homework helpline, extended invites).
- [ ] Audit logs accessible by admins (non-editable).

---

## 📌 Next Steps
1. Review old compliance code that was rolled out to stabilize repo.
2. Reintroduce with modular design (easy to update per region).
3. Write **Compliance.md** → public version for parents/investors.
4. Keep **Compliance2.md** as internal dev checklist.

---

**Reminder:** Compliance is not a “feature” — it’s a foundation. Rebuilding these flows early prevents costly rewrites later when scaling or seeking investment.

