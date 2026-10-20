# চূড়ান্ত রিপোর্ট — Blasting Number

**তারিখ:** ২০ অক্টোবর ২০২৬  
**অ্যাপ:** `/root/blasting-number-final` (version 2.0.0)  
**ডেলিভারেবল:** ফ্রেশ `blasting-number-final.zip`; Gofile.io লিংক চূড়ান্ত ডেলিভারি বার্তায়

## প্রজেক্ট অডিট

অ্যাপটি React 19 + TypeScript + Vite 8 + HeroUI v3 + Tailwind CSS v4 + Firebase Auth + Firebase Realtime Database ভিত্তিক। এই রানে পুরো UI-তে Bootstrap Icons-এ migration, অ্যাডমিন-নিয়ন্ত্রিত ব্র্যান্ডিং/ওয়েবসাইট CMS, English-default ডাইনামিক বহুভাষিক সিস্টেম, নতুন ভাষা ব্যবস্থাপনা এবং সাম্প্রতিক কার্যক্রমের পুনঃডিজাইন সম্পন্ন হয়েছে। Viewer/RBAC, dynamic role/category/shift, list, export, OCR, quality, theme ও responsive behaviour অক্ষত আছে।

এই রানে যাচাইকৃত প্রধান ফল:

- সব প্রধান UI রুটে hardcoded Bengali-নির্ভরতা সরিয়ে English default চালু হয়েছে; বাংলা ও অ্যাডমিন-যোগ করা ভাষা রিয়েলটাইমে কাজ করে।
- ৮০৩টি UI সোর্স স্ট্রিং এবং ৬২টি ওয়েবসাইট কনটেন্ট ফিল্ড—মোট ৮৬৫টি key—ভাষাভিত্তিক ডেটাবেস অনুবাদে যুক্ত হয়েছে।
- `/admin/languages`-এ ভাষা তৈরি, সম্পাদনা, সক্রিয়/নিষ্ক্রিয়, ডিফল্ট নির্বাচন, ডিলিট, UI অনুবাদ সম্পাদনা ও default seed আছে।
- `/admin/settings`-এ ব্র্যান্ড নাম, লোগো URL, যোগাযোগ তথ্য, ৬২টি সাইট কনটেন্ট ফিল্ড এবং feature flags আছে; পাবলিক সাইট রিয়েলটাইমে সেগুলো ব্যবহার করে।
- Activity log-এ outcome, actor, role, target ও সময়সহ লেফট-অ্যালাইনড আইকন/chip ভিত্তিক সাম্প্রতিক কার্যক্রম দেখায়।
- Firebase Rules-এ public settings read ও protected language write মডেল যোগ হয়েছে; emulator-এ ৪১টি authorization test পাস।
- TypeScript, ESLint, unit, rules, ১৮টি browser E2E এবং production build—সব সফল।

## Bootstrap Icons

- Bootstrap Icons **1.13.1** অফিসিয়াল CDN থেকে SRI সহ লোড হয়; `integrity="sha384-CK2SzKma4jA5H/MXDUU7i1TqZlCFaD4T01vtyDFvPlD97JQyS+IsSh1nI2EFbpyk"`।
- `src/components/icons/index.tsx` কেন্দ্রীয় `BootstrapIcon` renderer; সব icon component একই `.bi bi-*` API ব্যবহার করে।
- `src/lib/iconRegistry.tsx` শুধু curated semantic icon name সংরক্ষণ করে; database-এ arbitrary CSS class লেখা হয় না।
- Navigation, stat, table, dialog, activity outcome, category ও shift icon—সব Bootstrap Icons-এ রূপান্তরিত।
- Lucide বা অন্য icon runtime dependency নেই। Icon-only control-এ `aria-hidden`/accessible label pattern বজায় আছে।

## Website Settings

- `/admin/settings`-এ চারটি ট্যাব: Branding, Contact, Website content, Features।
- Branding: সাইটের নাম ও লোগো URL; URL scheme/host validation এবং পাবলিক সাইটে fallback icon।
- Contact: ইমেইল, ফোন, ঠিকানা; পাবলিক header/footer-এ ব্যবহৃত।
- Website CMS: hero, features, security, FAQ, footer ও meta description—মোট ৬২টি ফিল্ড; প্রতিটির বাংলা লেবেল এবং গ্রুপ শিরোনাম localized।
- প্রতিটি কনটেন্ট ফিল্ড ভাষাভিত্তিক ডেটাবেস অনুবাদ সমর্থন করে; খালি থাকলে English/default fallback।
- Feature flags: PDF export, CSV export, OCR scanner, WhatsApp share; প্রযোজ্য UI action respect করে।
- পরিবর্তন `/settings/app` ও `/settings/translations`-এ সংরক্ষিত হয় এবং পাবলিক পেজে রিয়েলটাইমে প্রতিফলিত হয়।
- ব্র্যান্ড খালি থাকলে inline validation error দেখায়; save disabled-এর ওপর ভরসা করে silent failure হয় না।
- লোগো URL সাপোর্ট করা হয়েছে; Firebase Storage-ভিত্তিক binary upload এই র‍্যে অন্তর্ভুক্ত নয়।

## Multilingual System

- নতুন দর্শনার্থী **English** দেখে; ভাষা নির্বাচন `blasting-number.language` key-তে সংরক্ষিত হয়।
- প্রাথমিক ভাষা `en` ও `bn`; English protected, active ও initial default। উভয় base ভাষা protected; default ভাষা delete করা যায় না।
- `/admin/languages`-এ custom BCP-47-ধর্মী code, নাম, native name, direction (LTR/RTL), order, status ও default নিয়ন্ত্রণ আছে।
- ভাষা code immutable; default ভাষা inactive/delete করা যায় না; custom ভাষা delete করলে তার translations-ও মুছে যায়।
- UI-এর ৮০৩টি সোর্স স্ট্রিং `/settings/translations/{safeKey}/{languageCode}`-এ সংরক্ষিত; dotted logical key-এর dot `__` হয়।
- Public site-এর ৬২টি content key আলাদা CMS editor-এ ভাষাভিত্তিক সম্পাদিত হয়; seed defaults ৮৬৫টি key × ২ ভাষা = ১,৭৩০টি মান লেখে।
- `SiteProvider` exact text, `aria-label`, `placeholder`, `title` এবং interpolated activity/dashboard/confirmation message অনুবাদ করে। Portal/toast-ও DOM observer-এর আওতায়।
- Bengali-তে interpolated message source-ই থাকে; English/অন্য ভাষায় dynamic pattern প্রয়োগ হয়। Custom ভাষায় dynamic message English fallback করে, তবে exact UI/CMS অনুবাদ কাজ করে।
- Base language record অনুপস্থিত বা আংশিক থাকলে default change/seed তা সম্পূর্ণ record দিয়ে materialize/repair করে; এতে English card `en`-এ পরিণত হওয়া বা virtual default হারানোর bug প্রতিরোধ হয়।
- RTL নির্বাচনে `document.dir` বদলায়; header/widget overflow responsive E2E-তে যাচাই করা হয়েছে।

## Firebase

### Local hardened model

- Root read/write বন্ধ; public boundary শুধু `/settings`।
- `/settings/app`, `/settings/languages`, `/settings/translations` unauthenticated read—কারণ public landing/auth screen-এর আগে এগুলো প্রয়োজন।
- Settings write শুধু active profile + admin/master বা role-based `settings_edit`; language node-এ আলাদা create/update/code/deletion শর্ত।
- `settings` root-এ `.write` নেই; write গুলো `settings/app`, `settings/translations`, `settings/languages/$code`-এ বিভক্ত। ফলে ancestor write grant দিয়ে default/protected language delete bypass করা যায় না।
- `en` সবসময় active/protected; `bn` protected; language code immutable; default-protected delete blocked; translation value ≤৫,০০০ অক্ষর।
- Profiles, lists, roles, categories, shifts ও activityLogs আগের মতো authenticated এবং permission-gated; public settings-এ শুধু public-safe data রাখার নিয়ম।
- Viewer self-registration, role/permission guards, list ownership, shift/category validation, append-only logs ও master protections অপরিবর্তিত।
- Rules suite **৪১/৪১ পাস**; এতে public settings read, unauth write denial, language create/update/default/delete protection, translation authorization এবং পুরনো RBAC flow যাচাই হয়েছে।

### Live deployment

- Owner Firebase credentials নেই; `firebase deploy` করা হয়নি। Hosting/rules production-এ পরিবর্তন করা হয়নি।
- Live `servicebd` RTDB-তে আগের read-only probe HTTP 200 দিয়েছে; production rules এখনো hardened local rules-এর সমান নয়।
- এই রানে production database-এ কোনো write, seed, migration বা destructive probe করা হয়নি।
- Production launch-এর আগে owner credentials দিয়ে rules deploy, unauthenticated read/write denial, Viewer registration ও master-only operation live verification এবং demo password rotation আবশ্যক।

## Recent Activity Logs

- Dashboard-এর সাম্প্রতিক কার্যক্রম বাম-অ্যালাইনড; প্রতিটি entry-তে outcome icon, action label, actor নাম, actor role, target, সময় ও relative time।
- Success/failure/session/role/category/shift/settings/language outcome-এর জন্য আলাদা chip/রঙ।
- সফল entry-তে accent/neutral icon; ব্যর্থ action-এ danger styling এবং failure text।
- Empty, loading ও error state আছে; পুরোনো entry না থাকলে misleading blank panel দেখায় না।
- Activity details-এর variable-যুক্ত বাংলা message English mode-এ dynamic অনুবাদ হয়; actor/target নাম data হিসেবে অপরিবর্তিত থাকে।
- Logs page-এর search/filter/date range/CSV এবং master-only clear অক্ষত; নতুন language/settings action label filter-এ যুক্ত।

## Existing Features

- Viewer-first registration: নতুন অ্যাকাউন্ট read-only Viewer; role escalation rules-এ blocked।
- Dynamic roles, ৩৭টি granular permission, permission matrix ও protected master role।
- Dynamic categories ও shifts; active/inactive, appearance, usage count, immutable key ও delete guards।
- Shift-aware list create/edit/filter/export/stats/chart; duplicate detection; copy-all; legacy day/night fallback।
- OCR scanner, PDF/CSV export, WhatsApp share, print ও theme-aware charts।
- Dark/light theme, Bengali/English/custom language, responsive centered layout ৩৭৫–১৪৪০px।
- Profile, admin users, roles, categories, shifts, lists, analytics, logs, languages ও settings routes।
- Loading/error/empty states, toast feedback, dialogs, keyboard/focus behaviour এবং accessible labels।
- পুরনো `blasting-number` single-page HTML অ্যাপ নয়; root app `src/` ভিত্তিক নতুন codebase।

## Tests

| যাচাই | কমান্ড | ফলাফল |
|---|---|---|
| TypeScript | `npm run typecheck` | পাস |
| ESLint | `npm run lint` | পাস |
| Unit tests | `npm test` | **৭৩/৭৩ পাস (৯ files)** |
| RTDB rules | `npm run test:rules` | **৪১/৪১ পাস** |
| Browser E2E | `npm run test:e2e` | **১৮/১৮ পাস (Chromium, ৪.৬ মিনিট)** |
| Production build | `npm run build` | পাস (২,১৯১ modules) |

E2E কভারেজ: landing/auth/mobile auth, Viewer registration, operator list flow ও duplicate detection, admin dashboard, role/category/shift CRUD, settings validation, custom language create→default→delete, base English default reset, default seed (৮৬৫ translation keys), English default/Bengali persistence, responsive overflow/centering।

পূর্বের English-mode audit-এ `/lists`, `/profile`, `/admin`, `/admin/languages`, `/admin/settings`, `/admin/categories`, `/admin/shifts`, `/admin/roles`, `/admin/users`, `/admin/logs`, `/admin/analytics`-এ দৃশ্যমান Bengali text বা translatable Bengali attribute পাওয়া যায়নি। Bengali control-label audit-এ শুধু native language option নাম ব্যতিক্রম ছিল।

Build output: main app entry `index-Bs1G8SZE.js` প্রায় **৫২৯.২১ kB** (gzip ১৫৯.৪৮ kB); CSS প্রায় **৪৬২.৭৮ kB** (gzip ৪৫.৩৪ kB)। Route-level lazy loading আছে; PDF/OCR/chart/firebase আলাদা chunk-এ আছে।

## ZIP

- ফ্রেশ archive: `/root/blasting-number-final.zip`।
- অন্তর্ভুক্ত: `src/`, `public/`, `dist/`, `firebase/`, `tests/`, config, `package.json`, lockfile, README, FINAL_REPORT ও demo docs।
- বাদ: `.git`, `node_modules`, `.env`, keys/tokens, `database-debug.log`, `test-results`, caches ও temp audit files।
- archive তৈরি করার পর clean temporary directory-তে extract করে top-level structure, `package.json`, `dist/index.html` ও `firebase/database.rules.json` যাচাই করা হয়েছে।
- SHA-256 ও file size চূড়ান্ত ডেলিভারি বার্তায় দেওয়া হয়েছে; ব্যর্থ/পুরনো `/root/blasting-number-final.zip` পুনঃব্যবহার করা হয়নি।

## Gofile.io

- ফ্রেশ ZIP Gofile.io-তে upload করা হয়েছে।
- Upload response-এর `downloadPage` যাচাই করে চূড়ান্ত লিংক ডেলিভারি বার্তায় দেওয়া হয়েছে।
- Guest token বা sensitive credential কোথাও প্রকাশ করা হয়নি।
- পুরনো `https://gofile.io/d/4ozSUB8g` লিংক এই ডেলিভারির জন্য ব্যবহার করা হয়নি।

## Remaining Issues

- **Critical:** production Firebase rules/hosting deploy হয়নি; live RTDB anonymous read এখনো সম্ভব। Owner credentials ছাড়া এটি ঠিক করা যায় না।
- Custom ভাষায় interpolated dynamic message English fallback করে; exact UI ও website translation সম্পূর্ণ কাজ করে। Android/iOS locale-specific pluralisation নেই।
- Logo URL আছে, কিন্তু binary image upload/Firebase Storage integration নেই।
- OCR default `eng`; বাংলা OCR pack নেই। PDF/CSV/OCR/live camera বাস্তব ফাইল/ডিভাইসে আলাদা manual QA প্রয়োজন।
- Category/shift delete protection UI ও rules-এ আছে, কিন্তু list/item usage server-side scan rules-এ ব্যয়বহুল বলে করা হয়নি।
- Master account deletion Auth Admin SDK ছাড়া UI-তে নেই।
- Production rules deploy-এর পর live smoke test ও demo password rotation করা আবশ্যক।

---

**মূল সীমাবদ্ধতা:** এই রিপোর্টের সব ফাংশনাল ও testing claim লোকাল emulator/build-এ যাচাইকৃত। Live Firebase deployment সফল বা নিরাপদ বলে দাবি করা হয়নি।
