export const ACTION_LABELS: Record<string, string> = {
  login: "লগইন",
  logout: "লগআউট",
  list_create: "তালিকা তৈরি",
  list_update: "তালিকা আপডেট",
  list_delete: "তালিকা মুছে ফেলা",
  item_add: "আইটেম যোগ",
  item_edit: "আইটেম সম্পাদনা",
  item_delete: "আইটেম মুছে ফেলা",
  user_create: "অ্যাকাউন্ট তৈরি",
  user_edit: "ইউজার আপডেট",
  user_status_change: "ইউজার স্ট্যাটাস",
  user_role_assign: "রোল অ্যাসাইন",
  role_change: "রোল পরিবর্তন",
  role_create: "রোল তৈরি",
  role_update: "রোল আপডেট",
  role_delete: "রোল মুছে ফেলা",
  role_seed: "রোল সিড",
  category_create: "ক্যাটাগরি তৈরি",
  category_update: "ক্যাটাগরি আপডেট",
  category_delete: "ক্যাটাগরি মুছে ফেলা",
  category_migrate: "ক্যাটাগরি মাইগ্রেট",
  category_seed: "ক্যাটাগরি সিড",
  shift_create: "শিফট তৈরি",
  shift_update: "শিফট আপডেট",
  shift_delete: "শিফট মুছে ফেলা",
  shift_seed: "শিফট সিড",
  status_change: "স্ট্যাটাস পরিবর্তন",
  settings_change: "সেটিংস পরিবর্তন",
  language_create: "ভাষা তৈরি",
  language_update: "ভাষা আপডেট",
  language_delete: "ভাষা মুছে ফেলা",
  language_default: "ডিফল্ট ভাষা",
  translation_update: "অনুবাদ আপডেট",
  export_pdf: "PDF এক্সপোর্ট",
  export_csv: "CSV এক্সপোর্ট",
  audit_clear: "অডিট লগ মুছে ফেলা",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export const ACTION_OPTIONS: { key: string; label: string }[] = Object.entries(
  ACTION_LABELS,
).map(([key, label]) => ({ key, label }));
