# Design Audit & Strategy — GovConnect Frontend

**Audit Date:** 2026-09-23  
**Scope:** Web Dashboard (React 19 + TypeScript + Tailwind CSS v4)  
**Design Docs Referenced:** `DesignSystem.md` v2.0, `uiuxspesification.md` v2.0  
**Target:** Government productivity tool for Indonesian citizens to autofill public service forms

---

## 1. Interface Classification

**Product-first interface.** This is a government productivity utility — not a marketing site, not a consumer app. The interface must prioritize function, speed, and clarity over brand storytelling.

| Trait | Current Score | Notes |
|-------|:---:|-------|
| Function first | ✓ | Core flows (profile, autofill, activity) are well-structured |
| Speed perception | ✓ | Loading states, optimistic saves, keyboard shortcuts present |
| Trust signals | ✓ | Encryption badges, privacy controls, clear activity logging |
| Brand restraint | ~ | Some decorative elements creeping in (gradient progress bars, heavy card borders) |

---

## 2. Target Audience

| Dimension | Profile |
|-----------|---------|
| **Primary** | Indonesian citizens (warga) managing government document submissions |
| **Demographics** | Adults 18–65, varying tech literacy |
| **Context** | Users accessing e-government services, frustrated with repetitive form filling |
| **Goals** | Speed, accuracy, privacy assurance |
| **Pain points** | Repetitive NIK/address entry, confusing government portals, fear of data misuse |

**Implication:** Every UI decision should answer: *"Does this help a busy citizen fill forms faster with confidence?"*

---

## 3. Current State Audit

### 3.1 Typography

| Issue | Location | Severity |
|-------|----------|:--------:|
| Uses Inter in DesignSystem.md but system font stack in actual code | `DesignSystem.md` §3 vs `index.css` :root | Medium |
| No formal type scale (uses Tailwind arbitrary values mixed with tokens) | All pages | Medium |
| Line-height inconsistent (mix of Tailwind defaults and custom) | All pages | Low |
| No tabular numbers on many data displays | Dashboard KPI values have `.tabular-nums`, Profile completeness lacks it | Low |
| Inconsistent letter-spacing on labels | Some use `tracking-wider`, some use `tracking-tight`, some none | Low |

**Actual code uses system font stack** — this is good. But `DesignSystem.md` §3 still documents "Inter" as primary font = docs out of sync with code.

### 3.2 Color

| Issue | Location | Severity |
|-------|----------|:--------:|
| **Inconsistency: brand tokens defined but hardcoded slate/blue used** | `Dashboard.tsx` uses `bg-white rounded-xl border border-slate-200 p-6 shadow-xs` — bypasses tokens. `Profile.tsx` uses `bg-slate-50/50 border border-slate-300 rounded-xl` — ignores `--border-default`, `--bg-elevated` | **High** |
| `App.css` still contains Vite boilerplate | `App.css`: hero, counter, next-steps — dead code | Medium |
| Pure white (`bg-white`) on Dashboard chart cards | `Dashboard.tsx` lines 1009, 1068, 1125, 1179, 1234 | Medium |
| Some hardcoded hex colors in chart tooltips | `Dashboard.tsx` lines 1044–1049 inline `backgroundColor: '#FFFFFF'`, `border: '1px solid #E2E8F0'` | Low |
| Gradient progress bar (`bg-gradient-to-r from-blue-500 to-blue-600`) | `Profile.tsx` line 806 — decorative gradient banned by audit spec | Low |

### 3.3 Layout

| Issue | Location | Severity |
|-------|----------|:--------:|
| **Heavy card-over-card design** in Profile | Each section = white card, inside nested cards for custom fields, inside another card for photos | **High** |
| Inconsistent border radius: `rounded-lg`, `rounded-xl`, `rounded-2xl` mixed | Profile uses `rounded-2xl` for sections, `rounded-xl` for inputs, `rounded-lg` for buttons — 3 levels where 2 would suffice | Medium |
| Inconsistent padding: `p-6 lg:p-8` on Profile sections vs `p-5` on Dashboard KPI cards | `Profile.tsx` vs `Dashboard.tsx` | Medium |
| `max-w-4xl` on Activity constrains width unnecessarily | `Activity.tsx` line 165 | Low |
| Dashboard chart cards use `p-6 shadow-xs` — shadow when design spec says "subtle borders" | `Dashboard.tsx` lines 1009, 1068, etc. | Low |

### 3.4 Motion

| Issue | Location | Severity |
|-------|----------|:--------:|
| `transition-all` used in many places | Layout: `transition-all duration-slow ease-layout`. Inputs: `transition-all`. Banners: `transition-all` | **Medium** |
| `animate-pulse` on unsaved changes indicator | `Dashboard.tsx` line 526, `Profile.tsx` line 773 — fine for transient state | Low |
| `animate-spin` used for loaders — acceptable | Throughout | OK |
| `prefers-reduced-motion` properly implemented in `index.css` | `index.css` lines 98–107 | ✅ Good |
| `transition-transform-opacity`, `transition-colors-fast`, `transition-layout` utility classes | `index.css` lines 111–128 — these are good specific-property transitions | ✅ Good |

### 3.5 Accessibility

| Issue | Location | Severity |
|-------|----------|:--------:|
| `text-content-disabled` (#94a3b8) used for placeholder text on white bg | Login/Register inputs — contrast ratio ~3.0:1, fails WCAG AA | **Medium** |
| Search icon used without `aria-hidden` in filter bar | `Activity.tsx` line 237 | Low |
| Some interactive elements missing focus-visible styles | Custom field edit/copy/delete icon buttons — rely on browser default | Low |
| No skip-to-content link | Layout.tsx | Low |
| Input `id`/`htmlFor` pairs are inconsistent — some have it, many don't | `Profile.tsx` inputs missing `id` + `htmlFor` pairs for labels | Medium |
| Emoji used as icons in sticky nav (`🪪`, `📍`, `📞`, etc.) | `Profile.tsx` lines 837–867 — screen readers read emoji descriptions aloud | Medium |

### 3.6 Component & Code Quality

| Issue | Location | Severity |
|-------|----------|:--------:|
| **Dashboard.tsx is 1304 lines** — massive component mixing analytics, RoboForm benchmark, and profile editing | `Dashboard.tsx` | **High** |
| **Profile.tsx is 2100+ lines** — single-file monolith | `Profile.tsx` | **High** |
| `App.css` contains obsolete Vite boilerplate (`.hero`, `.counter`, `.ticks`) | `App.css` | Medium |
| Inline styles in chart tooltip configs | `Dashboard.tsx` lines 1044–1049, 1096–1101, etc. | Low |
| Magic strings for color tokens mixed with CSS variables | Some places use `--border-default`, others hardcode `border-slate-200` | Medium |
| `border-collapse` unnecessary on non-collapsed table | `Dashboard.tsx` line 1245 | Low |

---

## 4. Generic AI Patterns to Eliminate

| Pattern | Status | Action |
|---------|--------|--------|
| Inter/Roboto as default font | ✅ Already using system font stack | Sync `DesignSystem.md` docs |
| Card-grid-for-everything | ⚠ Partial — Profile sections are card-based, but Dashboard uses varied layout | Reduce card nesting |
| Gradient overlays | ⚠ Present on Profile completeness bar (`from-blue-500 to-blue-600`) | Replace with solid brand color |
| Drop shadows on every container | ⚠ Dashboard chart cards use `shadow-xs` | Remove; use border only |
| Rounded-xl everywhere | ⚠ Inconsistent radius scale | Standardize: sm(4px), md(8px), lg(12px) |
| Pure black/white | ⚠ Pure white `bg-white` still used in Dashboard charts | Replace with `--bg-elevated` |
| transition: all | ⚠ Layout uses `transition-all` | Replace with specific properties |
| Em dashes in UI text | ✅ Not found | Maintain |

---

## 5. Design System Compliance Check

Comparing actual code against `DesignSystem.md` v2.0:

| Requirement | In Docs | In Code | Status |
|-------------|---------|---------|--------|
| System font stack | ❌ Says "Inter" | ✅ System fonts | **Docs outdated** |
| Color: brand-600 #1e40af | ✅ | ✅ In tailwind config | ✅ |
| Color: surface base #f4f6f9 | ✅ | ✅ In CSS variables | ✅ — but hardcoded `bg-white` overrides |
| Color: content primary #0c1222 | ✅ | ✅ | ✅ |
| Color: border default #d1d9e6 | ✅ | ✅ | ✅ — but `border-slate-200`/`-300` used instead |
| Spacing: 4px base scale | ✅ | CSS variables defined | ✅ |
| Border radius: sm/md/lg | ✅ | ✅ | ✅ — but `rounded-xl`/`rounded-2xl` used |
| Motion: specific properties only | ✅ | ✅ Utility classes exist | ⚠ `transition-all` still used |
| KPI labels: Estimated Time Saved = "(Estimated)" | ✅ Required | ✅ Implemented as `subLabel` | ✅ |
| Badge: Activity 3-level status (Success/Partial/Failed) | ✅ | ✅ Implemented | ✅ |
| Badge: Field-Level 5 status | ✅ | N/A (extension) | N/A |
| Badge: Website Support Unsupported | ✅ | N/A (extension) | N/A |
| Sidebar: "Dashboard" not "Overview" | ✅ | ✅ | ✅ |

**Key gap:** Code uses design tokens in `tailwind.config.js` and `index.css` but frequently bypasses them with hardcoded Tailwind utilities (`bg-white`, `border-slate-200`, `rounded-2xl`, `shadow-xs`). The tokens exist but aren't consistently used.

---

## 6. Proposed Design System (Already Partially Implemented)

Good news: The `index.css` and `tailwind.config.js` already define most of the right tokens. The issue is **inconsistent application** across pages.

### 6.1 What's Already Correct

- System font stack ✓
- Brand-tinted neutral colors ✓
- Specific-property transition utilities ✓
- `prefers-reduced-motion` support ✓
- Tabular numbers utility ✓
- Focus-visible outline ✓
- Semantic color tokens (success/warning/error with light variants) ✓
- Responsive easing curves ✓

### 6.2 What Needs Enforcement

1. **Replace all `bg-white` → `bg-surface-elevated`** (Dashboard chart cards, Profile sections)
2. **Replace all `border-slate-200`/`-300` → `border-border-default`**
3. **Replace `rounded-xl`/`rounded-2xl` → `rounded-lg`** (max radius for containers)
4. **Replace `shadow-xs` → remove or use `border-border-default` only**
5. **Remove `transition-all` → use `transition-colors-fast` or `transition-transform-opacity`**
6. **Remove gradient progress bars → solid brand color**
7. **Remove emoji icons → Lucide icons with `aria-hidden`**
8. **Standardize input border radius → `rounded-md`** (8px per design spec)
9. **Add `id`/`htmlFor` pairs to all inputs**
10. **Delete obsolete `App.css` boilerplate**

---

## 7. Implementation Plan

### Phase 1: Token Enforcement (No Visual Change, Low Risk)

| Task | Files | Effort |
|------|-------|--------|
| Replace `bg-white` with `bg-surface-elevated` | Dashboard.tsx, Profile.tsx | 30 mins |
| Replace `border-slate-*` with `border-border-default` | All pages | 30 mins |
| Replace `rounded-xl`/`rounded-2xl` with `rounded-lg` | Profile.tsx, Dashboard.tsx | 20 mins |
| Replace `shadow-xs` with no shadow (use border only) | Dashboard.tsx | 15 mins |
| Delete `App.css` boilerplate | `App.css` | 5 mins |
| Sync DesignSystem.md: Inter → system font | `DesignSystem.md` | 5 mins |

### Phase 2: Motion & Accessibility

| Task | Files | Effort |
|------|-------|--------|
| Replace `transition-all` with specific properties | Layout.tsx, all pages | 20 mins |
| Replace gradient progress bar with solid | Profile.tsx line 806 | 5 mins |
| Replace emoji with Lucide icons + `aria-hidden` | Profile.tsx | 15 mins |
| Add `id`/`htmlFor` to label+input pairs | Profile.tsx | 30 mins |
| Add skip-to-content link | Layout.tsx | 10 mins |

### Phase 3: Architecture (Component Extraction)

| Task | Files | Effort |
|------|-------|--------|
| Extract RoboForm Benchmark widget from Dashboard | Dashboard.tsx → components/ | 1h |
| Extract CustomFieldModal from Profile.tsx | Profile.tsx → components/ | 1h |
| Extract PhotoUploadGrid from Profile.tsx | Profile.tsx → components/ | 30 mins |
| Extract KpiCard component | Dashboard.tsx → components/ | 20 mins |
| Extract Table component shared by Dashboard & Activity | Both → components/ | 30 mins |

### Phase 4: Polish

| Task | Files | Effort |
|------|-------|--------|
| Apply `.tabular-nums` to all numerical data displays | All pages | 15 mins |
| Increase placeholder text contrast (disabled → tertiary) | Login/Register | 10 mins |
| Ensure all icon buttons have `aria-label` | All pages | 15 mins |
| Verify WCAG AA contrast on all text/background combos | All pages | 30 mins |

---

## 8. Quick Wins (Done in Minutes)

1. **Delete `App.css`** — boilerplate not referenced anywhere
2. **Replace `bg-white` → `bg-surface-elevated`** in Dashboard chart cards (4 locations)
3. **Replace gradient `bg-gradient-to-r from-blue-500 to-blue-600` → `bg-brand-600`** in Profile completeness bar
4. **Replace emoji with Lucide icons** in Profile sticky nav (8 locations)
5. **Replace `transition-all` → `transition-colors-fast`** in Layout sidebar and nav items

---

## 9. Things to Preserve

| Feature | Why |
|---------|-----|
| System font stack | Performs well, no FOUT, culturally appropriate |
| Semantic color tokens in tailwind config | Clean abstraction layer |
| Specific-property transition utilities | Performance best practice |
| `prefers-reduced-motion` media query | Accessibility compliance |
| Tabular numbers on KPI values | Professional data presentation |
| Indonesian language throughout | Correct for target audience |
| Lucide icon set | Consistent, tree-shakeable |
| Keyboard shortcut Ctrl+S for save | Power user efficiency |
| Concurrency guard in Profile save | Prevents double-save race conditions |
| Profile ↔ Extension sync via postMessage | Real-time sync architecture |

---

## 10. Summary

| Area | Assessment |
|------|------------|
| **Design tokens** | ✅ Well-defined in CSS variables and Tailwind config |
| **Token usage consistency** | ❌ Frequently bypassed with hardcoded utilities |
| **Typography** | ✅ Good font stack, needs doc sync |
| **Layout structure** | ⚠ Card nesting excessive in Profile |
| **Motion** | ⚠ Some `transition-all` remaining |
| **Accessibility** | ⚠ Emoji icons, missing form labels, placeholder contrast |
| **Component architecture** | ❌ Monolithic pages (Dashboard 1304 lines, Profile 2100+) |
| **Design doc alignment** | ⚠ Docs reference "Inter", code uses system fonts |

**Overall:** Foundation is solid. The design tokens, motion system, and accessibility groundwork are already in place. The work needed is enforcement — replacing hardcoded values with token references, extracting components, and cleaning up inconsistencies.
