# GovConnect Autofill System — Deep Algorithm Audit Report

> **Status:** Read-only investigation. No source code was modified.
> **Date:** 2026-10-25
> **Files inspected:** content_script.js (3048L), offscreen.js (316L), background.js (340L), manifest.json, entities.py, test_mappings.py, test-form.html, test-page/

---

## PART A — EXECUTIVE SUMMARY

### 1. System Purpose

GovConnect is a Chrome Extension (Manifest V3) that automatically fills government/administrative web forms on arbitrary third-party websites using a user biodata profile stored on a backend API.

| Tier | Component | Role |
|---|---|---|
| Backend API | FastAPI (Python) | Encrypted PII profile + per-domain mapping persistence |
| Browser Extension | Manifest V3 | Autofill pipeline |
| Offscreen Document | offscreen.js + Transformers.js | SBERT inference for semantic fallback |

### 2. Matching Strategy Overview

7-stage priority-ordered hybrid pipeline:
1. W3C autocomplete attribute lookup — deterministic
2. Exact keyword dictionary lookup — KEYWORD_MAP (40 fields, ~300 aliases)
3. Date select detection heuristic
4. Context-aware token shortcut rules (17 rules)
5. BM25 text ranking (long labels >4 tokens)
6. Hybrid TF Cosine + Jaro-Winkler scoring with context bonuses
7. SBERT semantic fallback (all-MiniLM-L6-v2, offscreen)

### 3. Key Findings

FINDING-01 [VERIFIED]: Phase 3 scoring is NOT normalized. Score = 0.50*cos + 0.35*jw + 0.15*overlap + bonuses. Max theoretical score ~1.40. Thresholds 0.85/0.60/0.55 calibrated against this inflated scale.

FINDING-02 [VERIFIED]: Three-tier confidence system is a no-op. All three branches (>=0.85, >=0.60, >=0.55) execute identical code (return bestCandidate). Comments describe intent not implementation.

FINDING-03 [VERIFIED]: BM25_IDF = {} — all IDF weights are 1.0. BM25 degenerates to TF-only scoring.

FINDING-04 [VERIFIED]: Per-domain Mapping table in backend DB is never loaded into matching pipeline at runtime. It is reporting-only.

FINDING-05 [VERIFIED]: No post-fill value verification. status="filled" is set unconditionally after event dispatch.

FINDING-06 [VERIFIED]: No overwrite protection. Existing non-empty values are overwritten unconditionally.

FINDING-07 [UNTESTED]: Real-world matching accuracy is UNKNOWN. No JS unit tests exist for any matching algorithm.

### 4. Reliability Risks

- birth_date vs birth_place: disambiguation requires tanggal/tempat tokens in label
- full_name wins over mother_name on name="nama": Phase 1 exact-match bypasses all context analysis
- Score inflation from duplicate id/name attributes contributing same tokens twice
- labelText intentionally doubled in combinedRaw (L2416) — amplifies potentially misleading labels

---

## PART B — SYSTEM ARCHITECTURE

### 5. Component Inventory

| Component | File | Technology | Role |
|---|---|---|---|
| Content Script | content_script.js | JS MV3 | DOM discovery, field matching, autofill, floating sidebar |
| Background SW | background.js | JS MV3 | Message routing, in-memory profile cache, offscreen lifecycle |
| Offscreen Document | offscreen.js | JS + Transformers.js | SBERT inference |
| Side Panel | sidepanel.js/.html | JS + HTML | User-facing UI |
| Popup | popup.js/.html | JS + HTML | Toolbar popup |
| Backend API | backend/app/ | FastAPI + SQLAlchemy | Profile CRUD, auth, mappings, activity logging |
| Database | govconnect.db | SQLite | Profile, Mapping, Activity, User |
| KEYWORD_MAP | content_script.js L165-363 | JS object | 40 canonical fields, ~300 aliases |
| AUTOCOMPLETE_MAP | content_script.js L67-91 | JS object | W3C autocomplete -> profileKey |
| ABBREVIATION_MAP | content_script.js L112-152 | JS object | 29 legacy abbreviations |
| DROPDOWN_VALUE_MAP | content_script.js L369-420 | JS object | Profile value -> select option synonyms |
| PROFILE_KEY_LABELS | offscreen.js L175-230 | JS object | SBERT reference labels |
| Test forms | test-form.html, test-page/ | Static HTML | Manual integration fixtures |
| JS Algorithm Tests | NONE | — | No automated unit tests for matching pipeline |

### 6. Execution Lifecycle

```
User clicks extension icon
  background.js: chrome.action.onClicked
  -> TOGGLE_FLOATING_SIDEBAR to content_script.js
  -> openFloatingSidebar() -> injects <iframe src="sidepanel.html">

sidepanel.js: user clicks Detect/Autofill
  -> DETECT_FIELDS / EXECUTE_AUTOFILL to content_script.js
  -> detectFields() / fillForm()
  -> getAllFormFields() — shadow-DOM-aware traversal
  -> for each element: await matchProfileKey(el) — 7-stage pipeline
  -> render markers / fill values

if score < 0.55:
  -> SEMANTIC_FALLBACK to background.js
  -> background.js routes to offscreen.js
  -> processSemanticFallback() — SBERT inference
  -> SEMANTIC_RESULT to background.js
  -> routes to content_script.js
  -> fillSemanticElement() [ASYNC — bypasses normal flow]
```

Initial auto-scan: 1200ms setTimeout at L3038-3046.
Dynamic rescan: MutationObserver (400ms debounce, 3s maxWait) + visibilityObserver.

### 7. Complete Matching Pipeline Flowchart

```
matchProfileKey(el)
|
+-- Pass 0: getAutocompleteProfileKey(el)
|     autocomplete attr -> AUTOCOMPLETE_MAP (14 entries)
|     HIT -> RETURN profileKey immediately
|
+-- Phase 1: Exact Keyword Match
|     Extract: elName, elId, formcontrolname
|     Transform: lowercase, stripSemanticPrefix, stripNumericPrefix,
|                ABBREVIATION_MAP lookup, replace non-alphanum
|     Compare 6 normalized forms vs all KEYWORD_MAP aliases
|     HIT -> RETURN profileKey immediately
|
+-- detectDateSelectType(el)
|     <select> option value analysis
|     -> RETURN birth_day/birth_month/birth_year
|
+-- Phase 2: Token Construction + Shortcut Rules
|     combinedRaw = rawElName + cleanSanitized + expandedAbbrev
|                 + rawElId + rawFormControl
|                 + labelText + labelText   <- doubled
|                 + placeholder + ariaLabel
|     inputTokens = tokenize(combinedRaw)
|     Context flags: hasIbu, hasAyah, hasDarurat, hasTanggal, hasLahir,
|                    hasTelp, hasFax, hasHome, hasWork, hasCell, ...
|     17 deterministic shortcut rules -> RETURN profileKey if matched
|
+-- Phase 2.5: BM25 (only if inputTokens.length > 4)
|     computeBM25Similarity(inputTokens, kwTokens) for all entries
|     bestBm25Score >= 0.80 -> RETURN bestBm25Candidate
|
+-- Phase 3: Full Hybrid Scoring
|     Conflict-penalty pre-filters (exclude impossible candidates)
|     For each profileKey:
|       For each kw alias:
|         cos   = computeCosineSimilarity(inputTokens, kwTokens)
|         jw    = computeJaroWinklerSimilarity(inputNorm, kwNorm)
|         ov    = |kwTokens intersect inputTokens| / |kwTokens|
|         score = 0.50*cos + 0.35*jw + 0.15*ov + context_bonuses
|         candidateMaxScore = max(score over all kw aliases)
|       highestScore = argmax over all profileKeys
|
|     Confidence tiers (ALL IDENTICAL CODE — no-op distinction):
|     >= 0.85 -> RETURN bestCandidate
|     >= 0.60 -> RETURN bestCandidate
|     >= 0.55 -> RETURN bestCandidate
|     <  0.55 -> FALL THROUGH
|
+-- Semantic Fallback (SBERT via Offscreen Document)
      Send SEMANTIC_FALLBACK {label: inputTokens.join(" ")}
      offscreen.js: all-MiniLM-L6-v2 -> cosine vs 54 reference vectors
      bestScore >= 0.50 -> SEMANTIC_RESULT -> fillSemanticElement() [async]
      matchProfileKey returns null (fill happens asynchronously)
```

### 8. Data Flow

```
Backend DB (SQLite, PII field-level encrypted)
  |  GET /api/v1/profile (JWT Bearer)
sidepanel.js (in-memory profile)
  |  PROFILE_UPDATED / SET_CACHED_PROFILE message
background.js: memoryProfile (never written to disk)
  |  GET_CACHED_PROFILE on demand
content_script.js: cachedLastProfile
  |  fillForm(profile)
DOM elements -> input/change/blur events dispatched
```

---

## PART C — CANONICAL IDENTITY

### 9. Canonical Biodata Field Catalog

Source: KEYWORD_MAP (content_script.js L165-363) + Profile entity (entities.py L30-96)

| Canonical Field | DB Column | Derived From | Notes |
|---|---|---|---|
| full_name | full_name | — | Derives first/last |
| first_name | first_name | full_name | L780-782 |
| last_name | last_name | full_name | L783 |
| middle_initial | none | full_name | L787-791 |
| title | none | gender | L794-801 |
| nik | nik | — | 16-digit national ID |
| birth_date | birth_date | — | Multi-format parse |
| birth_place | birth_place | — | |
| birth_month | none | birth_date | L812 |
| birth_day | none | birth_date | L813 |
| birth_year | none | birth_date | L814 |
| age | age | birth_date | L815 |
| gender | gender | — | laki-laki/perempuan |
| religion | religion | — | 6 canonical values |
| marital_status | marital_status | — | 4 canonical values |
| blood_type | blood_type | — | A/B/AB/O |
| address | address | — | |
| address_line_1 | none | address | L805-806 |
| address_line_2 | none | — | |
| province | province | — | |
| city | city | — | |
| district | district | — | |
| village | village | — | |
| postal_code | postal_code | — | |
| country | country | — | Default: Indonesia |
| phone | phone | — | Mobile/WA |
| home_phone | home_phone | — | |
| work_telephone | work_telephone | — | |
| fax | fax | — | |
| email | email | — | |
| website | website | — | |
| organization | organization | — | |
| occupation | occupation | — | |
| work_address | work_address | — | |
| income | income | — | |
| education_level | education_level | — | |
| institution | institution | — | |
| student_id | student_id | — | NIM/NIP/NRP |
| nisn | nisn | — | |
| mother_name | mother_name | — | |
| father_name | father_name | — | |
| emergency_contact_name | emergency_contact_name | — | |
| emergency_contact_phone | emergency_contact_phone | — | |
| npwp | npwp | — | Tax ID |
| bpjs_number | bpjs_number | — | |
| driver_license | driver_license | — | |
| family_card_number | none | — | |
| family_relationship | none | — | |
| foto_ktp | document_photos JSON | — | |
| foto_kk | document_photos JSON | — | |
| pasfoto | document_photos JSON | — | |
| foto_npwp | document_photos JSON | — | |
| foto_ijazah | document_photos JSON | — | |
| comments | none | — | |

Custom fields: registerCustomProfileFields() L775-877 dynamically extends KEYWORD_MAP from custom_fields JSON column.

### 10. Internal Identity Representation

VERIFIED: The canonical identity is simply the KEYWORD_MAP string key (e.g. "birth_date").
It is simultaneously:
- The key in the in-memory profile object (cachedLastProfile["birth_date"])
- The SQLAlchemy Profile model column name (profile.birth_date)
All three namespaces are identical by design.

### 11. Aliases and Synonym Handling

Each canonical key -> array of recognized HTML attribute values in KEYWORD_MAP.
Phase 1 checks 6 normalized forms against each alias via exact string comparison (NOT fuzzy).

Alias sample:
  birth_date:  tanggal_lahir, tgl_lahir, birthdate, dob, date_of_birth, reginput_birthdate
  nik:         nik, no_ktp, noktp, citizen_id, ssn, pers_ssn
  student_id:  nim, nip, nrp, student_id, nomor_mahasiswa
  mother_name: nama_ibu, ibu_kandung, mothersname, reginput_mothersname

Language: Indonesian (first-class) + English. ABBREVIATION_MAP: 29 legacy abbreviations.

### 12. Website-Specific Identities

VERIFIED: NOT IMPLEMENTED at runtime.
Mapping table (entities.py L99-112) stores (website_domain, website_field, govconnect_field, selector_query).
No code in content_script.js (L2344-2714) loads or applies these mappings during autofill.
Dynamic keyword update (background.js L97-143) stores to chrome.storage.local but content script never reads it.

### 13. HTML Feature Extraction

getLabelText(el) — 6-strategy label resolution (L2717-2785):
1. label[for="id"] — W3C standard
2. el.closest("label") — element inside label
3. aria-labelledby -> referenced element text
4. Ancestor container: .p-field, .form-group, .ant-form-item, div
5. Previous sibling scan for label/.label
6. Bootstrap/Grid row sibling scan (disabled for PrimeNG)

Shadow DOM: querySelectorAllDeep() (L498-507) recursively enters el.shadowRoot.
Visibility: isElementVisible() (L425-479) — checkVisibility() Chrome 105+, fallback getComputedStyle.
Element types: input (non-hidden, non-submit), select, textarea, p-dropdown, mat-select, [role=combobox], .react-select__control

---

## PART D — ALGORITHM SPECIFICATION

### 14. Preprocessing and Normalization

Applied symmetrically to HTML attributes before comparison:

| Transformation | Applied to |
|---|---|
| Lowercase + trim | All attributes |
| stripSemanticPrefix() L2307 | elName, elId, formControl (removes inp_, form_, txt_, reginput_, isian_, kolom_, input_) |
| stripNumericPrefix() L159 | elName (02frstname -> frstname) |
| ABBREVIATION_MAP lookup | Sanitized name only |
| replace /[^a-z0-9]/g -> "_" | cleanElName, cleanElId, cleanFormControl |
| replace /[^a-z0-9]/g -> "" | strippedElName, strippedElId, strippedFormControl |
| CamelCase split in tokenize() L1922 | Combined input string |
| Punctuation -> space | tokenize() pass |
| Light stemming L1930-1950 | Remove trailing s, expand namaibu/namaayah |

Before/After Examples:
  reginput_birthdate -> birthdate -> MATCH: birth_date (Phase 1)
  02frstname -> frstname -> ABBREVIATION_MAP -> MATCH: first_name (Phase 1)
  tgl_lahir_mahasiswa -> ["tgl","lahir","mahasiswa"] -> shortcut: birth_date (Phase 2)

### 15. Candidate Generation

No pre-filtering. All 40 KEYWORD_MAP entries vs all N DOM elements.

getAllFormFields() returns:
  querySelectorAllDeep("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea")
  + p-dropdown, mat-select, [role='combobox']:not(input):not(select), [class*='react-select__control']
  Filtered: el.isConnected === true
  Excluded: .p-hidden-accessible, .cdk-visually-hidden, [aria-hidden='true']

### 16. Similarity Functions

#### 16a. Jaro-Winkler (computeJaroWinklerSimilarity, L1862-1913)
  jaro(a,b) = (1/3) * (m/|a| + m/|b| + (m - t/2)/m)
  jaroWinkler = jaro + min(4, commonPrefix) * 0.1 * (1 - jaro)
  Input: two strings. Output: [0.0, 1.0]
  Applied to: inputNormalized vs kwNormalized (token strings joined by _)

#### 16b. TF Cosine (computeCosineSimilarity, L1959-1985)
  cos(A,B) = dot(A,B) / (||A|| * ||B||)
  Input: two token arrays, builds TF vectors.
  Output: [0.0, 1.0]
  NOTE: Pure TF cosine — NO IDF weighting.

#### 16c. BM25 (computeBM25Similarity, L2326-2341)
  k1=1.2, b=0.75, avgdl=3.0
  IDF source: BM25_IDF = {} -> all IDF = 1.0 (UNIFORM — discriminative power lost)
  Output: capped [0, 1.0]. Threshold: 0.80.
  Only invoked when inputTokens.length > 4.

#### 16d. SBERT Cosine (offscreen.js L255-264)
  Model: Xenova/all-MiniLM-L6-v2 (384-dim, Transformers.js from HuggingFace)
  54 reference vectors pre-computed from PROFILE_KEY_LABELS at startup.
  Query: inputTokens.join(" "). Threshold: 0.50.
  Cache: semanticCache Map (per offscreen document lifetime).

#### 16e. Dropdown Option Matching (bestMatchOption, L1995-2120)
  NOT for field identity — for matching profile VALUES to select options.
  1. Exact value/text match
  2. DROPDOWN_VALUE_MAP synonym lookup
  3. Numeric integer comparison
  4. 2-digit year fallback
  5. Hybrid: 0.65*cos + 0.35*jw + 0.20*overlap. Threshold: 0.48.

### 17. Exact Scoring Formula (Phase 3)

Per keyword alias kw for profile key pk, against DOM element el:

  S(kw, el) = 0.50 * cos(inputTokens, kwTokens)
            + 0.35 * JW(inputNorm, kwNorm)
            + 0.15 * |kwTokens intersect inputTokens| / |kwTokens|
            + bonuses(pk, inputTokens)

Final score per profileKey:
  S_max(pk) = max over all kw aliases of S_final(kw, el)

Winner:
  k_hat = argmax over all pk of S_max(pk)

Score range: base [0,1.0] + bonuses [0, 0.40] -> theoretical max ~1.40

### 18. Context Bonuses (Additive, Uncapped)

| Context | ProfileKey | Bonus | Source |
|---|---|---|---|
| hasIbu | mother_name | +0.25 | L2628 |
| hasAyah | father_name | +0.25 | L2629 |
| hasDarurat + hasTelp | emergency_contact_phone | +0.30 | L2630 |
| hasDarurat + !hasTelp | emergency_contact_name | +0.30 | L2631 |
| hasKantor + address tokens | work_address | +0.25 | L2632 |
| hasDomisili + address tokens | address | +0.25 | L2633 |
| hasKampus | institution | +0.30 | L2635 |
| hasKependudukan | nik | +0.25 | L2636 |
| token "first" | first_name | +0.35 | L2639 |
| token "last" | last_name | +0.35 | L2640 |
| token "country" | country | +0.35 | L2641 |
| token "state" | province | +0.35 | L2642 |
| token "city" | city | +0.35 | L2643 |
| token "age" | age | +0.40 | L2644 |
| hasFax | fax | +0.40 | L2645 |
| hasHome | home_phone | +0.35 | L2646 |
| hasWork | work_telephone | +0.35 | L2647 |
| hasCell | phone | +0.30 | L2648 |

### 19. Conflict-Penalty Pre-Filters (Phase 3)

| If flag | Skip profileKey |
|---|---|
| hasIbu | full_name |
| hasAyah | full_name |
| hasDarurat | full_name, phone |
| hasKantor && !hasDomisili | address |
| hasDomisili | work_address |
| hasKampus | full_name, organization |
| hasPosisi + position tokens | organization |
| hasKependudukan | student_id, nisn |
| hasMahasiswaSiswa | nik |
| token "first" | full_name |
| token "last" | full_name |
| hasFax | all except fax |
| hasHome | phone, work_telephone |
| hasWork | phone, home_phone |

### 20. Ranking and Tie-Breaking

No tie-breaking. Object.entries(KEYWORD_MAP) processes in insertion order.
Strict > at L2655 -> first entry in insertion order wins on equal scores.
Insertion order: full_name, title, first_name, middle_initial, last_name, address...

### 21. Threshold and Confidence System

| Tier | Condition | Action | Evidence |
|---|---|---|---|
| High | highestScore >= 0.85 | return bestCandidate | L2662-2663 |
| Medium | highestScore >= 0.60 | return bestCandidate [IDENTICAL] | L2665-2667 |
| Low | highestScore >= 0.55 | return bestCandidate [IDENTICAL] | L2669-2671 |
| Fallback | < 0.55 | SBERT request | L2674+ |
| SBERT accept | bestMatchScore >= 0.50 | fillSemanticElement() | offscreen.js L293 |
| Dropdown | NLP score >= 0.48 | return best option | L2113 |

DEFECT: Three-tier system is a no-op. All branches return bestCandidate with no differentiation.
Thresholds are heuristic — not statistically calibrated.

### 22. Assignment and Conflict Resolution

VERIFIED: NOT IMPLEMENTED.
Each DOM element processed independently. Same profileKey can match multiple elements.
No deduplication. No one-to-one constraint. No global bipartite solver.

### 23. Computational Complexity

| Phase | Complexity (N=elements, M=40 fields, K~7 aliases) |
|---|---|
| Pass 0 | O(14N) |
| Phase 1 | O(N*M*K*6) ~ O(1680N) |
| Phase 2 shortcuts | O(N * |inputTokens|) |
| Phase 2.5 BM25 | O(N*M*K*|inputTokens|) conditional |
| Phase 3 hybrid | O(N*M*K*(|inputTokens|+|kwTokens|)) |
| SBERT fallback | O(N_fallback * 54 * 384) |

Practical: Phase 3 for N=20 -> 5600 scoring ops -> <5ms. SBERT first run: 2-5s.

---

## PART E — CROSS-WEBSITE COMPATIBILITY

### 24. Domain-Specific Mechanisms

Per-domain runtime override: NOT IMPLEMENTED. Mapping table never read into content script.

Hardcoded adapters:
  - PrimeNG p-dropdown (CoreTax DJP): fillPrimeNGDropdown() — 15x50ms panel polling
  - Angular mat-select: in querySelectorAllDeep selector
  - React Select: fillReactSelect()

Remote keyword update: PARTIALLY IMPLEMENTED. Fetches dict-manifest.json, validates SHA-256, stores to chrome.storage.local. Content script never reads updated dictionary.

### 25. Language Coverage

Indonesian: first-class. All 40 fields have Indonesian aliases. Context flags from Indonesian tokens.
English: first-class. W3C autocomplete, English aliases, English shortcut tokens.
Abbreviations: 29 entries (RoboForm/SAP style).
CamelCase: tokenize() splits at camelCase boundaries.
Mixed: both Indonesian and English tokens coexist in inputTokens.

### 26. Dynamic DOM Behavior

MutationObserver (L2835-2861): body, childList+subtree, 400ms debounce, 3s maxWait -> FORM_UPDATED.
visibilityObserver (L2897-2914): form/dialog/tabpanel style/class/hidden changes.
Shadow DOM: observeShadowRoots() for newly added nodes.
Stale element risk: VERIFIED. No post-fill verification.

### 27. Website Compatibility Matrix

| Pattern | Signals | Expected Behavior | Limitation | Status |
|---|---|---|---|---|
| HTML5 + autocomplete | autocomplete attr | Pass 0 exact match | None | UNTESTED real site |
| Semantic name/id | elName, elId | Phase 1 exact match | None | VERIFIED (test-page) |
| RoboForm abbreviated | ABBREVIATION_MAP | Phase 1 after expansion | Only 29 abbreviations | UNTESTED |
| Angular+PrimeNG CoreTax | formcontrolname | Phase 1 + PrimeNG fill | 750ms timing | INFERRED |
| React+ReactSelect | Class detection | fillReactSelect | DOM-structure dependent | UNTESTED |
| Obfuscated IDs | SBERT only | Semantic fallback | Network required | INFERRED |
| Indonesian gov forms | Indonesian tokens | Phase 1/Phase 2 | Label quality | UNTESTED prod |
| Shadow DOM | querySelectorAllDeep | Full pipeline | Rescan timing | VERIFIED (TC4) |
| Cross-origin iframes | N/A | Blocked | Browser restriction | INFERRED |
| Multi-step forms | Visible elements only | Single-step only | No multi-step | NOT IMPLEMENTED |

---

## PART F — AUTOFILL EXECUTION

### 28. Value Selection

Profile values: cachedLastProfile[profileKey].
Derived at fill time:
  birth_month/day/year: parseBirthDate(profile.birth_date) at L1683-1689
  first_name/last_name: from full_name at registerCustomProfileFields L780-783
  age: calculateAge() L638-651

### 29. DOM Assignment by Element Type

| Element Type | Assignment Method | Events |
|---|---|---|
| input (text/email/tel/etc.) | native descriptor setter (React-compatible) L1524-1533 | input, change, blur |
| input[type=date] | parseBirthDate() -> YYYY-MM-DD | input, change |
| input[type=radio] | el.checked = true + el.click() | input, change |
| input[type=checkbox] | el.checked = true + el.click() | input, change |
| input[type=file] | DataTransfer + el.files (base64 from document_photos) | input, change |
| native select | bestMatchOption() -> el.value | input, change |
| PrimeNG p-dropdown | click simulation, li traversal, click | Mouse events |
| React Select | click + text input + option click | Mouse/keyboard |
| textarea | same as standard input | input, change |

React-compatible setter (L1524-1533):
  const proto = Object.getPrototypeOf(el);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor && descriptor.set) descriptor.set.call(el, finalVal);

### 30. Safety Safeguards

| Safeguard | Status | Evidence |
|---|---|---|
| Exclude hidden inputs | YES | selector excludes [type=hidden] |
| Exclude GovConnect dashboard | YES | isGovConnectDashboardPage() |
| Exclude .p-hidden-accessible | YES | L514 |
| Skip fields without profile value | YES | L1647-1650 |
| No form submission | YES | no .submit() call |
| PII in memory only (SW) | YES | background.js L31, L316-323 |
| Token origin verification | YES | strict origin check L2941-2963 |
| Dictionary SHA-256 validation | YES | background.js L125-132 |
| No overwrite protection | NO | NOT IMPLEMENTED |
| Post-fill verification | NO | NOT IMPLEMENTED |
| Duplicate element prevention | NO | NOT IMPLEMENTED |
| Low-confidence confirmation | NO | NOT IMPLEMENTED |

---

## PART G — TESTING AND RELIABILITY

### 31. Existing Tests

Backend integration (pytest):
  test_auth.py — login, register, JWT
  test_profile.py — profile CRUD, PII encryption
  test_mappings.py — mapping CRUD, upsert, bulk create
  test_activities.py — activity logging
  test_health.py — API health

Extension JS tests: NONE.
No Jest/Mocha/Playwright tests for matchProfileKey, computeCosineSimilarity, computeJaroWinklerSimilarity, bestMatchOption, tokenize.

Manual fixtures: test-form.html (5 test cases), test-page/ (4 HTML files). Require manual browser execution.

### 32. Evaluation Dataset

VERIFIED: NOT IMPLEMENTED. No labeled (HTML element -> canonical key) ground-truth dataset.

### 33. Failure Scenarios

| Scenario | Actual Behavior | Severity | Verification |
|---|---|---|---|
| No match (all phases) | null returned; field not filled | Low (expected) | VERIFIED |
| Near-tie scores | First-insertion-order wins; no margin check | Medium | VERIFIED L2655 strict > |
| birth_date vs birth_place ambiguous label | Depends on tanggal/tempat tokens | High | INFERRED |
| student_id vs nik both tokens present | Mutually exclusive modifier guards | Medium | VERIFIED L2592-2593 |
| Two DOM elements match full_name | Both filled with same value | Low | VERIFIED (no dedup) |
| PrimeNG panel timeout (750ms) | Returns false; field skipped | Medium | VERIFIED L2208-2210 |
| SBERT offline | Catches error; returns null | Low (graceful) | VERIFIED offscreen L311-314 |
| Select option below 0.48 | bestMatchOption null; select unchanged | Medium | VERIFIED L1698 |
| Framework reverts after fill | status="filled" but value gone | High | VERIFIED (no post-check) |
| formcontrolname="name" (ambiguous) | Phase 1 exact -> full_name | Medium | VERIFIED |
| Dynamic form adds fields after fill | No auto-refill; re-detect only | Low | VERIFIED |

---

## PART H — FINDINGS AND RECOMMENDATIONS

### 34. Verified Defects

DEFECT-01: Three-tier confidence system is structurally a no-op (all branches identical).
DEFECT-02: BM25_IDF = {} — uniform IDF eliminates BM25 discriminative power.
DEFECT-03: Per-domain Mapping table never loaded into runtime pipeline.
DEFECT-04: No post-fill verification — silent failure if framework reverts value.
DEFECT-05: No overwrite protection — existing non-empty values unconditionally overwritten.

### 35. Algorithmic Weaknesses

W-01: Context modifier circularity. Flags derived from same ambiguous token string.
      id="nim_kependudukan" sets BOTH hasMahasiswaSiswa AND hasKependudukan simultaneously.
W-02: Score inflation from duplicate attributes. rawElName and rawElId often identical.
W-03: labelText doubled in combinedRaw (intentional but risky with misleading labels).
W-04: "melahirkan" tokenizes to single token — "lahir" not extracted. SBERT required.
W-05: semanticCache reset if Chrome destroys and recreates offscreen document.

### 36. Missing Capabilities

- No global bipartite assignment solver (one-to-one field-element matching)
- No post-fill verification
- No user confirmation for low-confidence matches
- No overwrite protection
- Per-domain mapping disconnected from runtime
- No labeled evaluation dataset
- No automated JS unit tests
- No multi-step form awareness
- No cross-origin iframe detection

### 37. Performance Bottlenecks

- SBERT first load: ~2-5s (ONNX WASM + model download)
- PrimeNG polling: up to 15 * 50ms = 750ms per dropdown; sequential = N_dropdowns * 750ms
- Phase 3: <5ms for typical forms (not a bottleneck)

### 38. Prioritized Recommendations

| Priority | Recommendation | Impact |
|---|---|---|
| P0 | Add post-fill verification (el.value === finalVal after events) | Prevents silent failures |
| P0 | Build labeled evaluation dataset (100+ element -> canonical key) | Enables accuracy measurement |
| P1 | Populate BM25_IDF with actual corpus document frequencies | Restores BM25 discriminative power |
| P1 | Load Mapping records into content script at session start | Activates per-domain learning |
| P1 | Add JS unit tests for matchProfileKey, cosine, JW, bestMatchOption, tokenize | Regression detection |
| P2 | Implement greedy max-weight matching for one-to-one field assignment | Prevents duplicate assignment |
| P2 | Differentiate three-tier branches (require second signal at medium confidence) | Meaningful confidence |
| P2 | Add overwrite protection (skip non-empty fields) | Prevents unintended overwrites |
| P3 | Compute per-token IDF from KEYWORD_MAP corpus offline | Inexpensive BM25 improvement |
| P3 | Add margin check: if gap < 0.10, escalate to SBERT | Reduces near-tie mismatches |

---

## MANDATORY ALGORITHM TABLES

### Algorithm Inventory

| Algorithm | Location | Input | Output | Role | Threshold | Status |
|---|---|---|---|---|---|---|
| W3C autocomplete lookup | content_script.js L93-106 | autocomplete attr | categorical | Pass 0 | N/A (exact) | VERIFIED |
| Exact string equality | content_script.js L2386-2406 | Normalized attr vs keywords | boolean | Phase 1 | N/A | VERIFIED |
| BM25 (uniform IDF) | content_script.js L2326-2341 | inputTokens vs kwTokens | [0,1] | Phase 2.5 | 0.80 | VERIFIED |
| TF Cosine | content_script.js L1959-1985 | Token arrays | [0,1] | Phase 3 w=0.50 | — | VERIFIED |
| Jaro-Winkler | content_script.js L1862-1913 | Normalized strings | [0,1] | Phase 3 w=0.35 | — | VERIFIED |
| Token Overlap | content_script.js L2620-2622 | Token arrays | [0,1] | Phase 3 w=0.15 | — | VERIFIED |
| Hybrid (dropdown) | content_script.js L2106 | Token arrays + strings | [0,~1.4] | Option matching | 0.48 | VERIFIED |
| SBERT cosine | offscreen.js L255-264 | 384-dim float32 vectors | [0,1] | Fallback | 0.50 | VERIFIED |

### Feature Scoring Table

| Feature | Source | Preprocessing | Weight | Missing Behavior |
|---|---|---|---|---|
| Element name | el.name / formcontrolname | lowercase, strip prefix, expand abbrev | 0.50 (cos) | 0 contribution |
| Element ID | el.id | same as name | 0.50 (cos) | 0 contribution |
| Label text | getLabelText() 6-strategy | lowercase, doubled in combinedRaw | 2x in combinedRaw | empty string |
| Placeholder | el.placeholder | lowercase, trim | 1x in combinedRaw | empty string |
| aria-label | aria-label attr | lowercase, trim | 1x in combinedRaw | empty string |
| autocomplete | autocomplete attr | lowercase, split | Decisive (overrides all) | Skip to Phase 1 |
| Context bonuses | token presence | token flags | +0.25 to +0.40 additive | 0 if flag absent |

### Threshold Decision Table

| Condition | Rule | Outcome |
|---|---|---|
| autocomplete -> AUTOCOMPLETE_MAP hit | Direct lookup | Return profileKey (Pass 0) |
| Exact match: strippedX === strippedY vs keyword | Exact equality | Return profileKey (Phase 1) |
| Select element is date component | detectDateSelectType() | Return birth_day/month/year |
| 17 shortcut token patterns | Hardcoded if-else | Return specific profileKey (Phase 2) |
| BM25 score >= 0.80 (>4 tokens) | bestBm25Score >= 0.80 | Return bestBm25Candidate |
| Phase 3 composite >= 0.55 | highestScore >= 0.55 | Return bestCandidate |
| Phase 3 < 0.55 | Fall-through | SEMANTIC_FALLBACK sent |
| SBERT cosine >= 0.50 | bestMatchScore >= 0.50 | fillSemanticElement() async |
| SBERT cosine < 0.50 | Below threshold | Field not filled |
| Dropdown exact match | optVal === valLower | Return option |
| Dropdown synonym | DROPDOWN_VALUE_MAP hit | Return option |
| Dropdown NLP >= 0.48 | score >= 0.48 | Return best option |

### Canonical Field Mapping Table (Key Confusables)

| Canonical | Key Aliases | Confusable With | Disambiguation |
|---|---|---|---|
| full_name | nama, name, nama_lengkap, fullname | first_name, mother_name, organization | Phase 1 exact; "first"/"last" tokens skip full_name |
| birth_date | tanggal_lahir, tgl_lahir, dob, dateofbirth | birth_place | hasTanggal AND hasLahir shortcut |
| birth_place | tempat_lahir, birthplace | birth_date | "tempat"/"place" token shortcut |
| nik | nik, no_ktp, citizen_id, ssn | student_id, family_card_number | hasMahasiswaSiswa skips nik |
| student_id | nim, nip, nrp, nomor_mahasiswa | nik, nisn | hasKependudukan skips student_id |
| phone | hp, wa, nomor_hp, handphone | home_phone, work_telephone, fax | hasHome/hasWork/hasFax modifiers |
| address | alamat, domisili, street | work_address | hasKantor skips address |
| province | provinsi, state | city | "state" bonus +0.35 |
| mother_name | nama_ibu, ibu_kandung | full_name | hasIbu skips full_name in Phase 3 ONLY |
| emergency_contact_phone | no_kontak_darurat | phone | hasDarurat + hasTelp bonus +0.30 |

### Failure Analysis Table

| Scenario | Behavior | Severity | Verification |
|---|---|---|---|
| All phases return null (no SBERT) | null; field not filled | Low | VERIFIED L2712 |
| Near-tie two candidates | First-insertion-order wins | High | VERIFIED L2655 strict > |
| birth_date label missing "tanggal" | Falls to Phase 3, may still win on "lahir"/"birth" tokens | Medium | INFERRED |
| PrimeNG panel 750ms timeout | false returned; field skipped | Medium | VERIFIED L2208 |
| Framework reverts fill | status=filled; value empty; no detection | High | VERIFIED (absence L1837) |
| Same field matched twice | Both DOM elements filled same value | Low | VERIFIED (no dedup) |
| Select option below 0.48 | bestMatchOption null; select unchanged | Medium | VERIFIED L1698 |

---

## PART I — SECOND-PASS ALGORITHM TRACES

### Path 1 — Successful Match (birth_date on CoreTax DJP)

Input: <input formcontrolname="reginput_birthdate" type="date">

Step 1: Pass 0 — no autocomplete attr -> skip
Step 2: Phase 1:
  rawFormControl = "reginput_birthdate"
  After lowercase: "reginput_birthdate"
  stripSemanticPrefix("reginput_"): "birthdate"
  cleanFormControl: "birthdate"
  Lookup: "birthdate" in KEYWORD_MAP["birth_date"] keywords -> MATCH
  RETURN "birth_date" (Phase 1 exact)

Fill: parseBirthDate("1995-09-22") -> YYYY-MM-DD -> "1995-09-22"
Dispatch input + change events.
Result: CORRECT

### Path 2 — Ambiguous Match (birth_date vs birth_place, label "Tanggal / Tempat Lahir")

Input: <input name="ttl" placeholder="Tanggal / Tempat Lahir">

Step 1: Pass 0 — skip
Step 2: Phase 1: "ttl" not in any keyword -> skip
Step 3: detectDateSelectType: not a select -> skip
Step 4: Phase 2:
  combinedRaw = "ttl Tanggal Tempat Lahir" (label doubled + placeholder)
  inputTokens = ["ttl", "tanggal", "tempat", "lahir"]
  hasTanggal = TRUE ("tanggal")
  hasLahir = TRUE ("lahir")
  Phase 2 shortcut L2488: hasTanggal && hasLahir
    -> check "month"/"bulan" tokens: NO
    -> check "day"/"hari" tokens: NO
    -> check "year"/"tahun" tokens: NO
    -> RETURN "birth_date"

Issue: "tempat" token present but shortcut fires before birth_place check.
       birth_place shortcut at L2506 requires !hasTanggal OR checks tempat/place independently.
       In this case hasTanggal && hasLahir shortcut fires first -> EARLY EXIT.
       
Result: INCORRECT for a combined tempat/tanggal field. The shortcut is ambiguity-blind.

### Path 3 — Phase 1 Bypass of Context (mother_name field named "nama")

Input: <input name="nama"> with section heading "Nama Ibu" not associated to input

Step 1: Pass 0 — skip
Step 2: Phase 1:
  elName = "nama"
  "nama" in KEYWORD_MAP["full_name"] keywords -> MATCH
  RETURN "full_name" (Phase 1 exact)

Context: hasIbu would be FALSE (getLabelText returned empty; heading not associated)
         -> hasIbu modifier in Phase 3 never evaluated because Phase 1 returned early

Result: INCORRECT — field intended for mother_name gets full_name.
This is a fundamental limitation: Phase 1 exact-match bypasses ALL context analysis.

### Path 4 — SBERT Fallback ("Orang yang melahirkan pemohon")

Input: <input> with label "Orang yang melahirkan pemohon" (test-form.html TC5)

Step 1-3: Pass 0/Phase 1/dateSelect — skip
Step 4: Phase 2:
  inputTokens = ["orang", "yang", "melahirkan", "pemohon"]
  hasTanggal = FALSE
  hasLahir = FALSE  ("melahirkan" tokenizes to ONE token, "lahir" not extracted)
  hasIbu = FALSE
  17 shortcuts — none match
Step 5: BM25 (>4 tokens? tokens.length=4, not >4) — skip
Step 6: Phase 3 hybrid:
  cos("orang yang melahirkan pemohon", "nama ibu kandung") — near 0 (no shared tokens)
  All candidates score < 0.55
Step 7: SBERT fallback:
  label = "orang yang melahirkan pemohon"
  all-MiniLM-L6-v2 embeds -> compare vs reference for mother_name
    = "nama ibu kandung mother name orang yang melahirkan"
  cosine similarity HIGH (semantically very similar)
  bestMatchScore >= 0.50 -> SEMANTIC_RESULT: profileKey = "mother_name"
  fillSemanticElement() -> fill with profile.mother_name

Result: CORRECT (via SBERT).
Note: Morphological decomposition of "melahirkan" -> "lahir" would allow Phase 2 to handle this without SBERT.

---

*END OF AUDIT REPORT*
*All findings based on direct source code inspection. No application code was modified.*
*No real biodata or live government websites were accessed.*