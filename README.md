# Blasting Number

ফ্যাক্টরি/ওয়্যারহাউসের ব্লাস্টিং কোড-লিস্ট তৈরি, সম্পাদনা, ডুপ্লিকেট-চেক, রিপোর্ট, OCR এবং প্রশাসনিক কাজের জন্য একটি ডেটাবেস-চালিত ওয়েব অ্যাপ।

**React 19 + TypeScript + Vite 8 + HeroUI v3 + Bootstrap Icons + Firebase Auth + Firebase Realtime Database**

এই সংস্করণে ক্যাটাগরি, রোল, শিফট, ব্র্যান্ডিং, পাবলিক সাইটের লেখা এবং ভাষা—সবই Realtime Database থেকে আসে। UI ডিফল্টে ইংরেজি; বাংলা বা অ্যাডমিন-যোগ করা যেকোনো ভাষায় রিয়েলটাইমে বদলানো যায়। সবকিছু অনুমতিভিত্তিক UI, রুট-গার্ড ও সার্ভার-সাইড Security Rules দ্বারা নিয়ন্ত্রিত।

> বিস্তারিত মাইগ্রেশন, সিদ্ধান্ত, নিরাপত্তা মডেল ও যাচাইয়ের রিপোর্ট: [`FINAL_REPORT.md`](./FINAL_REPORT.md)  
> Demo administrator নিরাপদ provisioning: [`docs/DEMO_ADMIN.md`](./docs/DEMO_ADMIN.md)

---

## ফিচার

### সাধারণ ব্যবহারকারী
- ইমেইল/পাসওয়ার্ড লগইন, রেজিস্ট্রেশন, পাসওয়ার্ড রিসেট, ইমেইল ভেরিফিকেশন
- **নতুন রেজিস্ট্রেশন নিরাপদভাবে Viewer হিসেবে শুরু হয়**—তালিকা তৈরি/সম্পাদনা করতে অ্যাডমিনকে Operator বা উপযুক্ত রোলে উন্নীত করতে হয়
- তারিখ, **ডাইনামিক শিফট**, নোট ও **ডাইনামিক ক্যাটাগরি** দিয়ে তালিকা তৈরি/সম্পাদনা/মোছা
- মাল্টিলাইন বাল্ক এন্ট্রি; প্রতি লাইনে সক্রিয় ক্যাটাগরি নির্বাচন
- গ্লোবাল ডুপ্লিকেট চেক (কেস-ইনসেনসিটিভ, কোড + `1/2`, `10Pic` ইত্যাদি এক্সট্রা)
- সার্চ, ডাইনামিক শিফট/ক্যাটাগরি ফিল্টার, সর্ট, পেজিনেশন, আইটেম এডিট/ডিলিট
- PDF রিপোর্ট, CSV, WhatsApp শেয়ার, সব কোড একসাথে কপি
- OCR স্ক্যানার (ক্যামেরা/ছবি → কোড এক্সট্র্যাক্ট → রিভিউ)
- প্রোফাইল, ডার্ক/লাইট থিম, English-default ডাইনামিক বহুভাষিক UI, মোবাইল-ফার্স্ট রেসপন্সিভ
- Bootstrap Icons-ভিত্তিক আইকন সিস্টেম; কোনো Lucide runtime dependency নেই

### রোল ও অনুমতি
- ডাইনামিক রোল: `/roles/{roleKey}` থেকে রিয়েলটাইম লোড
- ৩৭টি সূক্ষ্ম অনুমতি (dashboard, users, roles, categories, shifts, lists, quality, audit, settings)
- ৮টি ডিফল্ট রোল: Master Admin, Admin, Manager, Quality Checker, Operator, Editor, Viewer, Visitor
- রোল তৈরি/সম্পাদনা/নিষ্ক্রিয়/ডিলিট শুধু protected Master Admin
- Permission Matrix, রঙ/আইকন, sort order, assigned user count
- permission অনুযায়ী nav, route guard, বাটন, ফিল্ড ও অ্যাডমিন অ্যাকশন
- inactive role-এর ব্যবহারকারী স্বয়ংক্রিয়ভাবে business access হারায়
- public self-registration শুধু `viewer` + `active:true`; rules-এ operator/master self-assignment blocked

### ডাইনামিক ক্যাটাগরি
- `/categories/{categoryId}`: নাম, slug, বিবরণ, রঙ, আইকন, স্ট্যাটাস, ক্রম
- চারটি পুরনো ক্যাটাগরি—**Blasting, Import, Damaged, Return**—stable ID নিয়ে seed হয়
- পুরনো `category` নাম-ভিত্তিক আইটেম `categoryId` ছাড়াও পড়া যায়
- admin migration বাটন সক্রিয় ক্যাটাগরির নাম মিলিয়ে পুরনো আইটেমে `categoryId` backfill করে
- মিলহীন/inactive পুরনো category edit করলে synthetic `categoryId` লেখা হয় না; name snapshot অক্ষত থাকে
- item edit-এ সক্রিয় ক্যাটাগরি বেছে নিলে তখনই real `categoryId` লেখা হয়
- ব্যবহৃত ক্যাটাগরি UI থেকে ডিলিট করা যায় না; আইটেম থাকলে count দেখায়
- inactive ক্যাটাগরিতে নতুন আইটেম যোগ করা যায় না, তবে পুরনো ডেটা অক্ষত থাকে

### ডাইনামিক শিফট
- `/shifts/{shiftId}`: নাম, বিবরণ, ঐচ্ছিক start/end time, রঙ, আইকন, স্ট্যাটাস, ক্রম
- legacy `day`/`night` stable ID ও বাংলা নামসহ seed হয়; এই দুই key delete-protected
- নতুন তালিকায় শুধু active শিফট দেখা যায়; পুরনো inactive/deleted শিফট reference পড়া ও edit করা যায়
- `/shifts` খালি থাকলে client fallback হিসেবে দিন/রাত দেখায়; কনফিগার থাকে কিন্তু active শিফট না থাকলে তালিকা তৈরি বন্ধ ও সতর্কবার্তা দেখায়
- শিফটের ব্যবহার count, search, filter, sort, responsive cards; ব্যবহৃত শিফট UI থেকে delete করা যায় না
- শিফট read active authenticated users-এর জন্য, কারণ authorized list render করতে metadata দরকার; write permission-gated

### অ্যাডমিন
- ড্যাশবোর্ড: বাস্তব stat, চার্ট, সাম্প্রতিক অ্যাক্টিভিটি
- ইউজার: ম্যানেজড অ্যাকাউন্ট তৈরি, নাম সম্পাদনা, রোল assign, সক্রিয়/নিষ্ক্রিয়
- রোল: CRUD, permission matrix, default seed, count sync, protected system role
- ক্যাটাগরি: CRUD, appearance permission, default seed, legacy migration, usage count
- শিফট: CRUD, time window, appearance permission, status, default seed, usage/reference-safe delete
- তালিকা: permission-gated দেখা/ডিলিট, detail link
- অডিট লগ: search, action filter, date range, CSV, master-only clear; outcome/actor/target metadata
- সেটিংস: ব্র্যান্ডিং, লোগো URL, যোগাযোগ তথ্য, ফিচার ফ্ল্যাগ, ভাষাভিত্তিক সাইট কনটেন্ট; permission-gated editing
- ভাষা: ডাইনামিক ভাষা যোগ/সম্পাদনা/সক্রিয়-নিষ্ক্রিয়/ডিফল্ট/ডিলিট, UI শব্দকোষ অনুবাদ, ডিফল্ট seed
- সাম্প্রতিক কার্যক্রম: লেফট-অ্যালাইনড আইকন, অ্যাকশন/ব্যর্থতা chip, actor, role ও সময়

### ভাষা ও ওয়েবসাইট CMS
- `/admin/languages`: `en`/`bn` প্রোটেক্টেড; English সর্বদা সক্রিয়; কাস্টম ভাষা যোগ ও অনুবাদ সম্পাদনা
- নতুন দর্শনার্থী ডিফল্ট ভাষা দেখে (প্রাথমিকভাবে English); নির্বাচিত ভাষা ব্রাউজারে সংরক্ষিত হয়
- অনুবাদ না থাকলে নির্বাচিত ভাষা → English DB → bundled English/Bengali → English ফলব্যাক
- `/admin/settings`: ব্র্যান্ড নাম, লোগো URL, ইমেইল/ফোন/ঠিকানা, পাবলিক সাইটের ৬২টি কনটেন্ট ফিল্ড ও ফিচার ফ্ল্যাগ
- কনটেন্ট ও UI অনুবাদ `/settings/translations/{safeKey}/{languageCode}`-এ সংরক্ষিত; dotted key-এর dot → `__`
- সাইটের ব্র্যান্ড/লোগো/কনটেন্ট রিয়েলটাইমে শিরোনাম, হেডার, হিরো, ফিচার, নিরাপত্তা, FAQ, ফুটার ও meta description-এ প্রতিফলিত হয়

### Master Admin সুরক্ষা
- `master-admin` protected system role; `admin` legacy key-ও master হিসেবে পড়া হয়
- master role নিষ্ক্রিয়/ডিলিট/unprotect করা যায় না
- নিজের রোল/active status নিজে বদলানো যায় না
- master অ্যাকাউন্ট নিষ্ক্রিয় করা যায় না
- শুধু master অন্য master নিয়োগ/ডিমোট করতে পারে; acting master সবসময় থাকায় শেষ master অনির্ধারিতভাবে হারায় না
- রোল ডিলিটের আগে assigned user count শূন্য হতে হয়

---

## দ্রুত শুরু

```bash
npm install
cp .env.example .env   # চাইলে Firebase কনফিগ override করুন
npm run dev            # http://localhost:5173
```

`.env` না থাকলে `src/lib/firebase.ts`-এর বিল্ট-ইন পাবলিক Firebase কনফিগ ব্যবহার হয়। এখানে কোনো সার্ভার সিক্রেট রাখবেন না।

> **নিরাপত্তা সতর্কতা:** live `servicebd` database-এ rules deploy না হওয়া পর্যন্ত anonymous access বন্ধ হবে না। Deployment-এর আগে অবশ্যই `firebase/database.rules.json` deploy করুন এবং demo password production launch-এর আগে বদলান।

### স্ক্রিপ্ট

| কমান্ড | কাজ |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript build + production bundle |
| `npm run preview` | production bundle preview |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit/smoke — **73 tests** |
| `npm run test:watch` | Vitest watch |
| `npm run test:rules` | RTDB emulator rules — **41 tests** |
| `npm run test:e2e` | Playwright + Auth/DB emulator — **18 tests** |

`test:rules`/`test:e2e`-এর জন্য Java, ইন্টারনেট (`npx firebase-tools`) এবং E2E-এর জন্য একবার `npx playwright install chromium` প্রয়োজন। সব টেস্ট `demo-blasting*` emulator প্রজেক্টে চলে; লাইভ Firebase স্পর্শ করে না।

---

## Firebase সেটআপ ও প্রথম বুটস্ট্র্যাপ

### ১. Rules ও Auth চালু করুন

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only database     # .firebaserc → servicebd
```

Firebase Console → Authentication → Sign-in method → **Email/Password** enable করুন।

### ২. প্রথম Master তৈরি করুন

Demo-only provisioning-এর ধাপ ও checklist: [`docs/DEMO_ADMIN.md`](./docs/DEMO_ADMIN.md)। Demo password কোথাও hardcode করবেন না; production launch-এর আগে rotate/disable করুন।

অ্যাপ থেকে স্বাভাবিকভাবে একটি অ্যাকাউন্ট রেজিস্টার করুন। তারপর trusted Firebase Console/Admin SDK থেকে:

```text
profiles/<uid>/role = "admin"
```

`"admin"` legacy master key; চাইলে `"master-admin"`-ও ব্যবহার করা যায়। ক্লায়েন্ট/সাধারণ ইউজার নিজেকে master করতে পারে না—rules তা ব্লক করে।

### ৩. ডিফল্ট রোল, ক্যাটাগরি ও শিফট seed করুন

নতুন master হিসেবে লগইন করে **এই ক্রমে** করুন:

1. `/admin/roles` → **ডিফল্ট রোল** বাটন
2. `/admin/categories` → **ডিফল্ট** বাটন
3. `/admin/shifts` → **ডিফল্ট** বাটন
4. `/admin/languages` → **ডিফল্ট সিড** বাটন (ভাষা ও অনুবাদ ডেটাবেসে লেখে)
5. দরকার হলে `/admin/users` থেকে বাকি ব্যবহারকারীদের রোল assign করুন

`viewer` রোল seed হওয়ার আগে নতুন self-registered অ্যাকাউন্টের কোনো business permission থাকে না; তাই public registration চালু করার আগে viewer role seed করুন। `operator` রোল seed হওয়ার আগে legacy `"user"` অ্যাকাউন্টের list/category permission থাকে না। Seed শুধু অনুপস্থিত রেকর্ড তৈরি করে; বিদ্যমান কাস্টম রোল/ক্যাটাগরি/শিফট overwrite করে না। শিফট কনফিগার না থাকলে তালিকা ফর্মে দিন/রাত fallback থাকে।

### ৪. পুরনো ডেটা মাইগ্রেট করুন

- পুরনো `profiles/*/role`: `"user"` → Operator, `"admin"` → Master Admin হিসেবে resolve হয়
- পুরনো item-এ `category` নাম থাকলেও পড়া যায়
- `/admin/categories` → **পুরনো ডেটা মাইগ্রেট** সক্রিয় ক্যাটাগরির নাম মিলিয়ে `categoryId` যোগ করে
- `categoryId` থাকলে সেটাই authority; নাম snapshot শুধু fallback

### ৫. Hosting (ঐচ্ছিক)

```bash
npm run build
firebase deploy --only hosting      # dist/, SPA rewrite সহ
```

---

## Firebase Emulator

```bash
npm run test:rules
npm run test:e2e
```

অ্যাপ ম্যানুয়ালি emulator-এ চালাতে `.env`-এ:

```dotenv
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
VITE_FIREBASE_DB_EMULATOR_HOST=127.0.0.1
VITE_FIREBASE_DB_EMULATOR_PORT=9000
```

প্রোডাকশনে emulator flag কখনো `true` করবেন না।

---

## ডেটা মডেল

```text
profiles/{uid}
  uid, email, displayName, role, active, createdAt, lastLogin, updatedAt

roles/{roleKey}
  name, description, color, icon, status, permissions{users_view:true,...},
  isSystemRole, protected, sortOrder, assignedUserCount, createdAt, updatedAt, createdBy

categories/{categoryId}
  name, slug, description, color, icon, status, sortOrder, createdAt, updatedAt, createdBy

shifts/{shiftId}
  name, description, startTime, endTime, color, icon, status, sortOrder,
  createdAt, updatedAt, createdBy

lists/{listId}
  date, shift, ownerId, ownerName, note, createdAt, updatedAt
  items/{itemId}: categoryId?, category, code, createdBy, createdByName, createdAt, updatedAt

activityLogs/{id}
  action, details, actorUid, actorName, timestamp,
  targetType?, targetId?, actorRole?, outcome?          // .indexOn timestamp

settings/app
  brandName, logoUrl, contactEmail, contactPhone, contactAddress,
  features{pdfExport,csvExport,ocrScanner,whatsappShare}, updatedAt, updatedBy

settings/languages/{code}
  code, name, nativeName, direction(ltr|rtl), status(active|inactive),
  isDefault, sortOrder, protected, createdAt, updatedAt, createdBy

settings/translations/{safeKey}/{languageCode} = "অনুবাদিত লেখা"
```

- Permission ID-তে dot থাকে; RTDB key-তে dot নিষিদ্ধ—তাই storage-এ `users.view` → `users_view`
- সব timestamp epoch milliseconds
- নতুন item-এ `categoryId` লেখা হয়; `category` backward-compatible name snapshot
- শিফটের `startTime`/`endTime` optional, কিন্তু দুটো একসাথে থাকতে হয়; `day`/`night` reserved legacy key
- managed user তৈরি হলে Firebase Auth account secondary app-এ তৈরি হয়; password কোথাও RTDB/লগে যায় না

---

## ডিফল্ট রোল ও অনুমতি

| Role | মূল অনুমতি |
| --- | --- |
| Master Admin | সব অনুমতি; protected; শুধু এটিই রোল/অডিট-clear লিখতে পারে |
| Admin | users/roles দেখাসহ দৈনন্দিন প্রশাসন; master নিয়োগ/রোল-write নেই |
| Manager | dashboard, users দেখা, lists manage/editAny, audit দেখা |
| Quality Checker | lists দেখা/export, quality review/approve/reject |
| Operator | নিজের list create/edit/delete, export, categories দেখা |
| Editor | নিজের ও অন্যের list edit, create/export |
| Viewer | শুধু lists, categories ও shifts দেখা |
| Visitor | কোনো business permission নেই |

`quality.*` permission catalog-এ আছে, কিন্তু এই অ্যাপে আলাদা Quality workflow screen নেই—ভবিষ্যতের extension হিসেবে রাখা হয়েছে। কোনো ভুয়া quality data বা screen তৈরি করা হয়নি।

### Master-only invariants

- `roles/*` write master-only
- protected permission (`roles.assignMaster`, `audit.clear`) master ছাড়া কেউ পায় না
- audit log append-only; edit সম্পূর্ণ নিষিদ্ধ; clear শুধু master UI
- role metadata write master-only; `assignedUserCount`/`updatedAt` শুধু count-sync-এর জন্য `users.assignRole`-ধারীরাও লিখতে পারে
- reserved role key `admin`/`user` রোল ডকুমেন্ট হিসেবে তৈরি করা যায় না
- self-registration-এ `role=viewer`, `active=true`; operator/master/self-promotion rules-এ blocked

---

## Security Rules সারসংক্ষেপ

বিস্তারিত: [`firebase/database.rules.json`](./firebase/database.rules.json)

- root read/write closed; public `/settings` ব্যতীত সব access authenticated + active profile
- **profiles**: নিজের profile self-read; পূর্ণ তালিকা `users.view`/dashboard permission; self-registration শুধু `role:"viewer"`, `active:true`; operator/master/self-promotion blocked; uid/email/createdAt immutable; role/active পরিবর্তন permission+master guard সাপেক্ষ
- **roles**: active user পড়তে পারে; write শুধু master; protected/system/master role delete blocked; count zero ছাড়া delete blocked
- **categories**: read `categories.view` (master bypass); create/edit/delete আলাদা permission; রঙ/আইকন `categories.manageAppearance`; slug immutable
- **shifts**: read active authenticated users; create/edit/delete আলাদা permission; রঙ/আইকন `shifts.manageAppearance`; time format/pair validated; `day`/`night` delete-blocked
- **lists**: read `lists.view`/dashboard; create `lists.create` এবং `ownerId == auth.uid`; edit/delete own/any permission; ownerId immutable; নতুন shift active configured shift অথবা শিফট কনফিগার না থাকলে legacy day/night; unchanged historical shift edit-এ allowed; item `categoryId` active category হতে হবে; field length/type validation
- **activityLogs**: append-only নিজের `actorUid`-এ; edit blocked; read `audit.view`/dashboard; delete `audit.clear` (UI master-only)
- **settings**: `settings/app`, `/languages` ও `/translations` পাবলিক read (ল্যান্ডিং পেজ অনুমোদনহীন অবস্থায় দেখাতে); write শুধু `settings.edit`; brand/logo/contact/feature validator; `en` active/protected ও ভাষা code immutable; default/protected ভাষা delete-blocked; translation value ≤5000 অক্ষর
- **public data boundary**: শুধু `/settings` পাবলিক; profiles, lists, roles, categories, shifts, activityLogs authenticated ও permission-gated

---

## প্রজেক্ট স্ট্রাকচার

```text
src/
  app/                 App, router, ErrorBoundary
  components/
    admin/             AppearanceFields, PermissionMatrix
    auth/              AuthDialog
    charts/            Chart.js panels
    common/            Badges, dialogs, filters, states
    layout/            AppShell, AdminLayout, RequireAuth/Permission
    lists/             ItemForm/Dialog, OCR, ExportActions, ListBrowser
  features/auth/       AuthProvider (session, profile, roles, categories, access)
  i18n/                SiteProvider, UI catalog, website content, dynamic messages
  hooks/               useLists/useProfiles/useLogs/useFormat/useDocumentTitle
  lib/                 firebase, defaults, permissions, validation
  pages/               Landing, Lists, Details, Profile, admin/* (incl. languages/settings)
  services/            auth, profiles, roles, categories, shifts, lists, logs, settings, languages
  utils/               categories, roles, shifts, stats, exports, parse, format, colors, permissions
  types/
tests/
  rules/               Firebase emulator authorization tests
  e2e/                 Playwright flows
firebase/database.rules.json
```

---

## যাচাই ও সীমাবদ্ধতা

শেষ লোকাল যাচাই: typecheck, lint, build, 73 unit, 41 rules, 18 E2E—সব সফল। E2E-তে English default, Bengali switch/persistence, custom language create/default/delete, default seeding, admin language/settings screen, responsive overflow/centering এবং বিদ্যমান auth/list/admin flow আছে। বিস্তারিত `FINAL_REPORT.md`-এ।

**Live Firebase deploy করা হয়নি**—Firebase CLI-তে owner login নেই (`Failed to authenticate`)। এই রানে production database-এ কোনো write, seed বা migration করা হয়নি; পুরনো list/user/category স্পর্শ করা হয়নি। **ডেটাবেসটি এখনো deployed rules দিয়ে সুরক্ষিত নয়**—anonymous read probe HTTP 200 ফিরিয়েছে (এই রানে write probe করা হয়নি), তাই production-এর আগে অবশ্যই rules deploy ও demo password rotation করতে হবে।

অন্যান্য সীমাবদ্ধতা:
- ব্যবহৃত ক্যাটাগরি/শিফট ডিলিট UI-তে blocked; RTDB rules permission enforce করে, কিন্তু item/list usage server-side scan করে না (rules-এ পুরো lists traversal ব্যয়বহুল)
- `day`/`night` শিফট key reserved; delete করা যায় না, শুধু নাম/সময়/রঙ/আইকন/স্ট্যাটাস পরিবর্তন করা যায়
- master অ্যাকাউন্ট Auth থেকে মুছে ফেলা UI-তে নেই; Firebase Console/Admin SDK প্রয়োজন
- OCR ডিফল্ট `eng`; বাংলা pack যোগ করা হয়নি
- PDF/CSV/OCR/live camera বাস্তব ফাইল/ডিভাইসে আলাদা manual QA প্রয়োজন
- E2E-তে 375, 768, 1280 ও 1440 breakpoint-এ overflow/centering regression আছে; অন্যান্য breakpoint CSS-review

## লাইসেন্স

মূল ধারণা ও ডেটা-মডেল পুরনো `blasting-number` অ্যাপ থেকে; এই কোডবেস নতুন করে লেখা।
