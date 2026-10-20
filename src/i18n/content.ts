import type { WebsiteContentField } from "../types";

/**
 * Public website content that administrators can edit from Website Settings.
 * Every entry is translated per configured language and persisted under
 * /settings/translations/<key>/<languageCode>.
 */
export const WEBSITE_CONTENT_FIELDS: WebsiteContentField[] = [
  { key: "site.subtitle", label: "Website subtitle", labelBn: "ওয়েবসাইট সাবটাইটেল", group: "Branding",
    en: "Smart factory list management", bn: "স্মার্ট ফ্যাক্টরি লিস্ট ম্যানেজমেন্ট" },
  { key: "site.description", label: "Website description", labelBn: "ওয়েবসাইট বিবরণ", group: "Branding", multiline: true,
    en: "Create, search and export factory code lists by date, category and shift, with role-based access and duplicate checks.",
    bn: "তারিখ, ক্যাটাগরি ও শিফট অনুযায়ী ফ্যাক্টরি কোড লিস্ট তৈরি, সার্চ ও এক্সপোর্ট করুন — রোল-ভিত্তিক অ্যাক্সেস ও ডুপ্লিকেট চেকসহ।" },
  { key: "header.text", label: "Header announcement", labelBn: "হেডার ঘোষণা", group: "Header",
    en: "Factory lists, shifts and reports in one secure workspace.",
    bn: "ফ্যাক্টরি তালিকা, শিফট ও রিপোর্ট — এক নিরাপদ ওয়ার্কস্পেসে।" },
  { key: "nav.features", label: "Navigation: features", labelBn: "নেভিগেশন: ফিচার", group: "Header", en: "Features", bn: "ফিচার" },
  { key: "nav.security", label: "Navigation: security", labelBn: "নেভিগেশন: নিরাপত্তা", group: "Header", en: "Security", bn: "নিরাপত্তা" },
  { key: "nav.faq", label: "Navigation: FAQ", labelBn: "নেভিগেশন: প্রশ্নোত্তর", group: "Header", en: "FAQ", bn: "প্রশ্নোত্তর" },
  { key: "nav.login", label: "Navigation: login", labelBn: "নেভিগেশন: লগইন", group: "Header", en: "Log in", bn: "লগইন" },
  { key: "nav.register", label: "Navigation: register", labelBn: "নেভিগেশন: শুরু করুন", group: "Header", en: "Get started", bn: "শুরু করুন" },
  { key: "nav.dashboard", label: "Navigation: dashboard", labelBn: "নেভিগেশন: ড্যাশবোর্ড", group: "Header", en: "Dashboard", bn: "ড্যাশবোর্ড" },
  { key: "hero.badge", label: "Hero badge", labelBn: "হিরো ব্যাজ", group: "Hero", en: "Factory list management", bn: "ফ্যাক্টরি লিস্ট ম্যানেজমেন্ট" },
  { key: "hero.title", label: "Hero title", labelBn: "হিরো শিরোনাম", group: "Hero", en: "Your Blasting code list, now", bn: "আপনার Blasting কোড লিস্ট এখন" },
  { key: "hero.titleAccent", label: "Hero accent text", labelBn: "হিরো অ্যাকসেন্ট লেখা", group: "Hero", en: "secure and real-time", bn: "নিরাপদ ও রিয়েল-টাইম" },
  { key: "hero.subtitle", label: "Hero subtitle", labelBn: "হিরো সাবটাইটেল", group: "Hero", multiline: true,
    en: "Enter codes by date and shift, verify duplicates, export PDF/CSV reports and scan documents with OCR — all in one app.",
    bn: "তারিখ ও শিফট অনুযায়ী কোড এন্ট্রি করুন, ডুপ্লিকেট যাচাই করুন, PDF/CSV রিপোর্ট নিন এবং ক্যামেরা দিয়ে OCR স্ক্যান করুন — সব এক অ্যাপে।" },
  { key: "hero.primaryCta", label: "Primary button label", labelBn: "প্রধান বাটনের লেখা", group: "Hero", en: "Create free account", bn: "ফ্রি অ্যাকাউন্ট খুলুন" },
  { key: "hero.secondaryCta", label: "Secondary button label", labelBn: "সেকেন্ডারি বাটনের লেখা", group: "Hero", en: "Log in", bn: "লগইন করুন" },
  { key: "hero.tertiaryCta", label: "Tertiary button label", labelBn: "তৃতীয় বাটনের লেখা", group: "Hero", en: "Create a list", bn: "তালিকা তৈরি করুন" },
  { key: "hero.note", label: "Hero security note", labelBn: "হিরো নিরাপত্তা নোট", group: "Hero", en: "Secure Firebase Authentication · Database rules enforced server-side", bn: "নিরাপদ Firebase Authentication · ডেটাবেস নিয়ম সার্ভারে কার্যকর" },
  { key: "preview.title", label: "Preview title", labelBn: "প্রিভিউ শিরোনাম", group: "Hero preview", en: "12 February 2026 · Day", bn: "১২ ফেব্রুয়ারি ২০২৬ · দিন" },
  { key: "preview.description", label: "Preview description", labelBn: "প্রিভিউ বিবরণ", group: "Hero preview", en: "Code list (example preview)", bn: "কোড লিস্ট (উদাহরণ প্রিভিউ)" },
  { key: "preview.badge", label: "Preview badge", labelBn: "প্রিভিউ ব্যাজ", group: "Hero preview", en: "Real-time", bn: "রিয়েল-টাইম" },
  { key: "preview.footer", label: "Preview footer", labelBn: "প্রিভিউ ফুটার", group: "Hero preview", en: "Duplicates are flagged before a code is added.", bn: "ডুপ্লিকেট থাকলে যোগ করার আগেই সতর্কতা দেখানো হয়।" },
  { key: "preview.duplicate", label: "Duplicate badge", labelBn: "ডুপ্লিকেট ব্যাজ", group: "Hero preview", en: "Duplicate", bn: "ডুপ্লিকেট" },
  { key: "features.title", label: "Features section title", labelBn: "ফিচার সেকশনের শিরোনাম", group: "Features", en: "What’s included", bn: "যা যা আছে" },
  { key: "features.description", label: "Features section description", labelBn: "ফিচার সেকশনের বিবরণ", group: "Features", multiline: true,
    en: "Everyday factory tools without unnecessary complexity.",
    bn: "দৈনন্দিন ফ্যাক্টরি কাজের জন্য প্রয়োজনীয় সব সরঞ্জাম — বাড়তি জটিলতা ছাড়াই।" },
  { key: "feature.category.title", label: "Feature: categories title", labelBn: "ফিচার: ক্যাটাগরি শিরোনাম", group: "Features", en: "Category-based lists", bn: "ক্যাটাগরি অনুযায়ী লিস্ট" },
  { key: "feature.category.text", label: "Feature: categories text", labelBn: "ফিচার: ক্যাটাগরি বিবরণ", group: "Features", en: "Create, edit and organize code lists by custom category, date and shift.", bn: "আপনার কাস্টম কোড ক্যাটাগরি — তারিখ ও শিফট অনুযায়ী তালিকা তৈরি, সম্পাদনা ও সংগঠিত রাখুন।" },
  { key: "feature.duplicate.title", label: "Feature: duplicate title", labelBn: "ফিচার: ডুপ্লিকেট শিরোনাম", group: "Features", en: "Duplicate checker", bn: "ডুপ্লিকেট চেকার" },
  { key: "feature.duplicate.text", label: "Feature: duplicate text", labelBn: "ফিচার: ডুপ্লিকেট বিবরণ", group: "Features", en: "Detect duplicates across dates and shifts before a new code is added.", bn: "নতুন কোড যোগ করার আগেই সব তারিখ ও শিফট জুড়ে ডুপ্লিকেট শনাক্ত করে সতর্কবার্তা পাবেন।" },
  { key: "feature.reports.title", label: "Feature: reports title", labelBn: "ফিচার: রিপোর্ট শিরোনাম", group: "Features", en: "PDF & CSV reports", bn: "PDF ও CSV রিপোর্ট" },
  { key: "feature.reports.text", label: "Feature: reports text", labelBn: "ফিচার: রিপোর্ট বিবরণ", group: "Features", en: "Download print-ready PDF and spreadsheet-friendly CSV reports in one click.", bn: "এক ক্লিকে প্রিন্ট-উপযোগী PDF এবং Excel-বান্ধব CSV রিপোর্ট ডাউনলোড করুন।" },
  { key: "feature.ocr.title", label: "Feature: OCR title", labelBn: "ফিচার: OCR শিরোনাম", group: "Features", en: "OCR scanner", bn: "OCR স্ক্যানার" },
  { key: "feature.ocr.text", label: "Feature: OCR text", labelBn: "ফিচার: OCR বিবরণ", group: "Features", en: "Scan printed codes with the camera and add them directly to a list.", bn: "ক্যামেরা দিয়ে কাগজের কোড স্ক্যান করে সরাসরি লিস্টে যোগ করুন।" },
  { key: "feature.realtime.title", label: "Feature: real-time title", labelBn: "ফিচার: রিয়েল-টাইম শিরোনাম", group: "Features", en: "Real-time sync", bn: "রিয়েল-টাইম সিঙ্ক" },
  { key: "feature.realtime.text", label: "Feature: real-time text", labelBn: "ফিচার: রিয়েল-টাইম বিবরণ", group: "Features", en: "Everyone sees the same data and updates reach every device immediately.", bn: "টিমের সবাই একই ডেটা দেখেন — পরিবর্তন সাথে সাথে সব ডিভাইসে আপডেট হয়।" },
  { key: "feature.audit.title", label: "Feature: audit title", labelBn: "ফিচার: অ্যাক্টিভিটি লগ শিরোনাম", group: "Features", en: "Activity log", bn: "অ্যাক্টিভিটি লগ" },
  { key: "feature.audit.text", label: "Feature: audit text", labelBn: "ফিচার: অ্যাক্টিভিটি লগ বিবরণ", group: "Features", en: "Review who changed what and when from the admin panel.", bn: "কার কখন কী পরিবর্তন করেছেন, অ্যাডমিন প্যানেল থেকে তা দেখুন।" },
  { key: "security.title", label: "Security section title", labelBn: "নিরাপত্তা সেকশনের শিরোনাম", group: "Security", en: "Security & control", bn: "নিরাপত্তা ও নিয়ন্ত্রণ" },
  { key: "security.description", label: "Security section description", labelBn: "নিরাপত্তা সেকশনের বিবরণ", group: "Security", en: "Protection for accounts, data and permissions.", bn: "অ্যাকাউন্ট, ডেটা ও অনুমতি — তিনটি স্তরেই সুরক্ষা।" },
  { key: "security.authentication.title", label: "Security: authentication title", labelBn: "নিরাপত্তা: অথেনটিকেশন শিরোনাম", group: "Security", en: "Firebase Authentication", bn: "Firebase Authentication" },
  { key: "security.authentication.text", label: "Security: authentication text", labelBn: "নিরাপত্তা: অথেনটিকেশন বিবরণ", group: "Security", en: "Passwords are never stored in the database; Firebase Auth handles sign-in.", bn: "পাসওয়ার্ড কখনোই ডাটাবেসে সংরক্ষিত হয় না — লগইন Firebase Auth পরিচালনা করে।" },
  { key: "security.rules.title", label: "Security: rules title", labelBn: "নিরাপত্তা: নিয়ম শিরোনাম", group: "Security", en: "Server-side database rules", bn: "সার্ভার-সাইড ডেটাবেস নিয়ম" },
  { key: "security.rules.text", label: "Security: rules text", labelBn: "নিরাপত্তা: নিয়ম বিবরণ", group: "Security", en: "Realtime Database rules run on the server; only authorized users can write.", bn: "Realtime Database নিরাপত্তা নিয়ম সার্ভারে কার্যকর; শুধু অনুমোদিত ইউজার/অ্যাডমিন লিখতে পারেন।" },
  { key: "security.rbac.title", label: "Security: RBAC title", labelBn: "নিরাপত্তা: RBAC শিরোনাম", group: "Security", en: "Role-based access", bn: "রোল-ভিত্তিক অ্যাক্সেস" },
  { key: "security.rbac.text", label: "Security: RBAC text", labelBn: "নিরাপত্তা: RBAC বিবরণ", group: "Security", en: "Separate permissions for users and administrators; protected settings require explicit access.", bn: "ইউজার ও অ্যাডমিনের জন্য আলাদা অনুমতি — সুরক্ষিত সেটিংসের জন্য স্পষ্ট অনুমতি প্রয়োজন।" },
  { key: "security.data.title", label: "Security: data title", labelBn: "নিরাপত্তা: ডেটা শিরোনাম", group: "Security", en: "Verifiable data", bn: "যাচাইযোগ্য তথ্য" },
  { key: "security.data.text", label: "Security: data text", labelBn: "নিরাপত্তা: ডেটা বিবরণ", group: "Security", en: "Dashboard and analytics numbers come directly from the database.", bn: "ড্যাশবোর্ড ও বিশ্লেষণের সব সংখ্যা সরাসরি ডেটাবেস থেকে আসে।" },
  { key: "faq.title", label: "FAQ section title", labelBn: "প্রশ্নোত্তর সেকশনের শিরোনাম", group: "FAQ", en: "Frequently asked questions", bn: "প্রশ্নোত্তর" },
  { key: "faq.description", label: "FAQ section description", labelBn: "প্রশ্নোত্তর সেকশনের বিবরণ", group: "FAQ", en: "Short answers to common questions.", bn: "সাধারণ প্রশ্নের সংক্ষিপ্ত উত্তর।" },
  { key: "faq.account.q", label: "FAQ: account question", labelBn: "প্রশ্নোত্তর: অ্যাকাউন্ট প্রশ্ন", group: "FAQ", en: "How do I create an account?", bn: "অ্যাকাউন্ট কীভাবে তৈরি করব?" },
  { key: "faq.account.a", label: "FAQ: account answer", labelBn: "প্রশ্নোত্তর: অ্যাকাউন্ট উত্তর", group: "FAQ", multiline: true, en: "Click “Get started”, then register with your name, email and password. New accounts begin as read-only Viewers; ask an administrator to promote you to Operator when you need to create lists.", bn: "“শুরু করুন” বাটনে ক্লিক করে নাম, ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন করুন। নতুন অ্যাকাউন্ট Viewer হিসেবে শুরু হয়; তালিকা তৈরির জন্য অ্যাডমিনকে Operator রোলে উন্নীত করতে বলুন।" },
  { key: "faq.others.q", label: "FAQ: other lists question", labelBn: "প্রশ্নোত্তর: অন্য তালিকা প্রশ্ন", group: "FAQ", en: "Can I view or edit another user’s lists?", bn: "অন্য ইউজারের তালিকা দেখতে বা সম্পাদনা করতে পারব?" },
  { key: "faq.others.a", label: "FAQ: other lists answer", labelBn: "প্রশ্নোত্তর: অন্য তালিকা উত্তর", group: "FAQ", multiline: true, en: "Viewers can read all factory lists. Operators can edit their own lists, while administrators with the right permissions can manage any list.", bn: "Viewer সব তালিকা দেখতে পারেন। Operator নিজের তালিকা সম্পাদনা/মুছতে পারেন; অনুমতিভিত্তিক Admin সব তালিকা পরিচালনা করতে পারেন।" },
  { key: "faq.inactive.q", label: "FAQ: inactive question", labelBn: "প্রশ্নোত্তর: নিষ্ক্রিয় অ্যাকাউন্ট প্রশ্ন", group: "FAQ", en: "What happens if my account is deactivated?", bn: "আমার অ্যাকাউন্ট নিষ্ক্রিয় হলে কী হবে?" },
  { key: "faq.inactive.a", label: "FAQ: inactive answer", labelBn: "প্রশ্নোত্তর: নিষ্ক্রিয় অ্যাকাউন্ট উত্তর", group: "FAQ", multiline: true, en: "Inactive accounts cannot write data and are signed out on the next refresh. An administrator can reactivate the account.", bn: "নিষ্ক্রিয় অ্যাকাউন্ট ডেটা লিখতে পারে না এবং পরবর্তী রিফ্রেশে লগআউট হয়ে যায়। অ্যাডমিন অ্যাকাউন্টটি আবার সক্রিয় করতে পারেন।" },
  { key: "faq.admin.q", label: "FAQ: first admin question", labelBn: "প্রশ্নোত্তর: প্রথম অ্যাডমিন প্রশ্ন", group: "FAQ", en: "How is the first administrator created?", bn: "প্রথম অ্যাডমিন কীভাবে তৈরি হবে?" },
  { key: "faq.admin.a", label: "FAQ: first admin answer", labelBn: "প্রশ্নোত্তর: প্রথম অ্যাডমিন উত্তর", group: "FAQ", multiline: true, en: "The first Master account is created through Firebase Console or the Admin SDK. The Master then seeds default roles, categories and shifts from the admin panel.", bn: "প্রথম Master অ্যাকাউন্ট Firebase Console/Admin SDK দিয়ে তৈরি করতে হয়; এরপর Master Admin প্যানেল থেকে ডিফল্ট রোল, ক্যাটাগরি ও শিফট seed করতে হয়।" },
  { key: "footer.description", label: "Footer description", labelBn: "ফুটার বিবরণ", group: "Footer", multiline: true, en: "A modern web app for custom code lists, roles, shifts and category management in factories and warehouses.", bn: "ফ্যাক্টরি ও ওয়্যারহাউজের কাস্টম কোড-লিস্ট, রোল, শিফট ও ক্যাটাগরি ব্যবস্থাপনার আধুনিক ওয়েব অ্যাপ।" },
  { key: "footer.linksTitle", label: "Footer links title", labelBn: "ফুটার লিংক শিরোনাম", group: "Footer", en: "Quick links", bn: "দ্রুত লিংক" },
  { key: "footer.accountTitle", label: "Footer account title", labelBn: "ফুটার অ্যাকাউন্ট শিরোনাম", group: "Footer", en: "Account", bn: "অ্যাকাউন্ট" },
  { key: "footer.accountText", label: "Footer account text", labelBn: "ফুটার অ্যাকাউন্ট বিবরণ", group: "Footer", multiline: true, en: "Create an account with email and password. Administrators control roles and account status.", bn: "ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি করুন। অ্যাডমিন ব্যবহারকারীদের রোল ও স্ট্যাটাস নিয়ন্ত্রণ করেন।" },
  { key: "footer.copyright", label: "Footer copyright", labelBn: "ফুটার কপিরাইট", group: "Footer", en: "© {year} {brand}. All rights reserved.", bn: "© {year} {brand}. সর্বস্বত্ব সংরক্ষিত।" },
  { key: "contact.title", label: "Contact heading", labelBn: "যোগাযোগ শিরোনাম", group: "Contact", en: "Contact", bn: "যোগাযোগ" },
];

export const CONTENT_GROUP_LABELS: Record<string, { en: string; bn: string }> = {
  Branding: { en: "Branding", bn: "ব্র্যান্ডিং" },
  Header: { en: "Header", bn: "হেডার" },
  Hero: { en: "Hero", bn: "হিরো" },
  "Hero preview": { en: "Hero preview", bn: "হিরো প্রিভিউ" },
  Features: { en: "Features", bn: "ফিচার" },
  Security: { en: "Security", bn: "নিরাপত্তা" },
  FAQ: { en: "FAQ", bn: "প্রশ্নোত্তর" },
  Footer: { en: "Footer", bn: "ফুটার" },
  Contact: { en: "Contact", bn: "যোগাযোগ" },
};

export const CONTENT_BY_KEY = new Map(WEBSITE_CONTENT_FIELDS.map((field) => [field.key, field]));

export function contentDefault(key: string, language: string): string {
  const field = CONTENT_BY_KEY.get(key);
  if (!field) return "";
  if (language === "bn") return field.bn;
  return field.en;
}
