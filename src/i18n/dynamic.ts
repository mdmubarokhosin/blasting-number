type Replacement = string | ((match: RegExpMatchArray) => string);

interface Rule {
  pattern: RegExp;
  replacement: Replacement;
}

const rules: Rule[] = [
  {
    pattern: /^ভাষা "(.*)" \((.*)\) আপডেট করা হয়েছে$/,
    replacement: (m) => `Language "${m[1]}" (${m[2]}) updated`,
  },
  {
    pattern: /^নতুন ভাষা "(.*)" \((.*)\) যোগ করা হয়েছে$/,
    replacement: (m) => `New language "${m[1]}" (${m[2]}) added`,
  },
  {
    pattern: /^"(.*)" ডিফল্ট ভাষা করা হয়েছে$/,
    replacement: (m) => `"${m[1]}" set as default language`,
  },
  {
    pattern: /^ভাষা "(.*)" (সক্রিয়|নিষ্ক্রিয়) করা হয়েছে$/,
    replacement: (m) =>
      `Language "${m[1]}" ${m[2] === "সক্রিয়" ? "activated" : "deactivated"}`,
  },
  {
    pattern: /^ভাষা "(.*)" \((.*)\) মুছে ফেলা হয়েছে$/,
    replacement: (m) => `Language "${m[1]}" (${m[2]}) deleted`,
  },
  {
    pattern: /^ডিফল্ট ভাষা সিড \((\d+)\) ও অনুবাদ সিড \((\d+)\) সম্পন্ন$/,
    replacement: (m) =>
      `Seeded ${m[1]} default languages and ${m[2]} translations`,
  },
  {
    pattern: /^(\d+)টি ইন্টারফেস অনুবাদ \((.*)\) আপডেট করা হয়েছে$/,
    replacement: (m) => `${m[1]} interface translations (${m[2]}) updated`,
  },
  {
    pattern: /^রোল "(.*)" আপডেট করা হয়েছে$/,
    replacement: (m) => `Role "${m[1]}" updated`,
  },
  {
    pattern: /^নতুন রোল "(.*)" তৈরি করা হয়েছে$/,
    replacement: (m) => `New role "${m[1]}" created`,
  },
  {
    pattern: /^রোল "(.*)" (সক্রিয়|নিষ্ক্রিয়) করা হয়েছে$/,
    replacement: (m) =>
      `Role "${m[1]}" ${m[2] === "সক্রিয়" ? "activated" : "deactivated"}`,
  },
  {
    pattern: /^রোল "(.*)" মুছে ফেলা হয়েছে$/,
    replacement: (m) => `Role "${m[1]}" deleted`,
  },
  {
    pattern: /^(\d+)টি ডিফল্ট রোল সিড করা হয়েছে$/,
    replacement: (m) => `${m[1]} default roles seeded`,
  },
  {
    pattern: /^ক্যাটাগরি "(.*)" আপডেট করা হয়েছে$/,
    replacement: (m) => `Category "${m[1]}" updated`,
  },
  {
    pattern: /^নতুন ক্যাটাগরি "(.*)" তৈরি করা হয়েছে$/,
    replacement: (m) => `New category "${m[1]}" created`,
  },
  {
    pattern: /^ক্যাটাগরি "(.*)" (সক্রিয়|নিষ্ক্রিয়) করা হয়েছে$/,
    replacement: (m) =>
      `Category "${m[1]}" ${m[2] === "সক্রিয়" ? "activated" : "deactivated"}`,
  },
  {
    pattern: /^ক্যাটাগরি "(.*)" মুছে ফেলা হয়েছে$/,
    replacement: (m) => `Category "${m[1]}" deleted`,
  },
  {
    pattern: /^(\d+)টি ডিফল্ট ক্যাটাগরি সিড করা হয়েছে$/,
    replacement: (m) => `${m[1]} default categories seeded`,
  },
  {
    pattern: /^(\d+)টি পুরনো আইটেমে categoryId যোগ করা হয়েছে$/,
    replacement: (m) => `categoryId added to ${m[1]} legacy items`,
  },
  {
    pattern: /^শিফট "(.*)" আপডেট করা হয়েছে$/,
    replacement: (m) => `Shift "${m[1]}" updated`,
  },
  {
    pattern: /^নতুন শিফট "(.*)" তৈরি করা হয়েছে$/,
    replacement: (m) => `New shift "${m[1]}" created`,
  },
  {
    pattern: /^শিফট "(.*)" (সক্রিয়|নিষ্ক্রিয়) করা হয়েছে$/,
    replacement: (m) =>
      `Shift "${m[1]}" ${m[2] === "সক্রিয়" ? "activated" : "deactivated"}`,
  },
  {
    pattern: /^শিফট "(.*)" মুছে ফেলা হয়েছে$/,
    replacement: (m) => `Shift "${m[1]}" deleted`,
  },
  {
    pattern: /^(\d+)টি ডিফল্ট শিফট সিড করা হয়েছে$/,
    replacement: (m) => `${m[1]} default shifts seeded`,
  },
  {
    pattern: /^নতুন তালিকা তৈরি হয়েছে \((.*)\)$/,
    replacement: (m) => `New list created (${m[1]})`,
  },
  {
    pattern: /^তালিকা আপডেট হয়েছে \((.*)\)$/,
    replacement: (m) => `List updated (${m[1]})`,
  },
  {
    pattern: /^তালিকা মুছে ফেলা হয়েছে \((.*)\)$/,
    replacement: (m) => `List deleted (${m[1]})`,
  },
  {
    pattern: /^\[(.*)\] (.*) যোগ হয়েছে$/,
    replacement: (m) => `[${m[1]}] ${m[2]} added`,
  },
  {
    pattern: /^(\d+)টি আইটেম যোগ হয়েছে \((.*)\)$/,
    replacement: (m) => `${m[1]} items added (${m[2]})`,
  },
  {
    pattern: /^(\d+)টি আইটেম যোগ হয়েছে$/,
    replacement: (m) => `${m[1]} items added`,
  },
  {
    pattern: /^PDF রিপোর্ট তৈরি \((.*)\)$/,
    replacement: (m) => `PDF report created (${m[1]})`,
  },
  {
    pattern: /^CSV রিপোর্ট তৈরি \((.*)\)$/,
    replacement: (m) => `CSV report created (${m[1]})`,
  },
  {
    pattern: /^একটি আইটেম মুছে ফেলা হয়েছে$/,
    replacement: "An item was deleted",
  },
  {
    pattern: /^(.+) লগইন করেছেন$/,
    replacement: (m) => `${m[1]} logged in`,
  },
  {
    pattern: /^স্বাগতম, (.*)!$/,
    replacement: (m) => `Welcome, ${m[1]}!`,
  },
  {
    pattern: /^(.+) নতুন অ্যাকাউন্ট তৈরি করেছেন$/,
    replacement: (m) => `${m[1]} created a new account`,
  },
  {
    pattern: /^(.+) লগআউট করেছেন$/,
    replacement: (m) => `${m[1]} logged out`,
  },
  {
    pattern: /^নতুন ইউজার (.*) \((.*)\) তৈরি করা হয়েছে$/,
    replacement: (m) => `New user ${m[1]} (${m[2]}) created`,
  },
  {
    pattern: /^(.+) এর নাম "(.*)" করা হয়েছে$/,
    replacement: (m) => `${m[1]} renamed to "${m[2]}"`,
  },
  {
    pattern: /^(.+) এর অ্যাকাউন্ট (সক্রিয়|নিষ্ক্রিয়) করা হবে।$/,
    replacement: (m) =>
      `${m[1]}'s account will be ${m[2] === "সক্রিয়" ? "activated" : "deactivated"}.`,
  },
  {
    pattern: /^(.+) কে "(.*)" রোল দেওয়া হবে।$/,
    replacement: (m) => `${m[1]} will be given the "${m[2]}" role.`,
  },
  {
    pattern: /^(\d+)টি ডুপ্লিকেট কোড বাদ দেওয়া হয়েছে$/,
    replacement: (m) => `${m[1]} duplicate codes skipped`,
  },
  {
    pattern: /^(\d+)টি কোড কপি হয়েছে$/,
    replacement: (m) => `${m[1]} codes copied`,
  },
  {
    pattern: /^(\d+)টি লাইন প্রস্তুত$/,
    replacement: (m) => `${m[1]} lines ready`,
  },
  {
    pattern: /^(\d+)টি আইটেম আজ$/,
    replacement: (m) => `${m[1]} items today`,
  },
  {
    pattern: /^(\d+)টি কনফিগার করা$/,
    replacement: (m) => `${m[1]} configured`,
  },
  {
    pattern: /^(\d+) সক্রিয় অ্যাকাউন্ট · (\d+) অ্যাডমিন$/,
    replacement: (m) => `${m[1]} active accounts · ${m[2]} admins`,
  },
  {
    pattern: /^এই সময়ে (\d+)টি আজ$/,
    replacement: (m) => `${m[1]} today at this time`,
  },
  {
    pattern: /^(\d+) সক্রিয় ক্যাটাগরি · আজ (\d+)টি$/,
    replacement: (m) => `${m[1]} active categories · ${m[2]} today`,
  },
  {
    pattern: /^(\d+)টি সক্রিয়$/,
    replacement: (m) => `${m[1]} active`,
  },
  {
    pattern: /^(\d+)টি তালিকা$/,
    replacement: (m) => `${m[1]} lists`,
  },
  {
    pattern: /^সর্বশেষ (\d+)টি লগ এন্ট্রি — নতুন আগে।$/,
    replacement: (m) => `Latest ${m[1]} log entries — newest first.`,
  },
  {
    pattern: /^(.+) → (.+) সময়ে ক্রমবর্ধমান ইউজার$/,
    replacement: (m) => `Cumulative users from ${m[1]} to ${m[2]}`,
  },
  {
    pattern: /^ডেটা সোর্স: RTDB `(.*)` ও `(.*)` \(আজ (.*)\)$/,
    replacement: (m) =>
      `Data source: RTDB \`${m[1]}\` and \`${m[2]}\` (today ${m[3]})`,
  },
  {
    pattern: /^"(.*)" স্থায়ীভাবে মুছে যাবে। এই রোলে কোনো ইউজার থাকলে মুছে ফেলা যাবে না।$/,
    replacement: (m) =>
      `"${m[1]}" will be permanently deleted. It cannot be deleted while users have this role.`,
  },
  {
    pattern: /^"(.*)" মুছে ফেলা হবে। কোনো আইটেমে ব্যবহৃত থাকলে মুছে ফেলা যাবে না।$/,
    replacement: (m) =>
      `"${m[1]}" will be deleted. It cannot be deleted while items use it.`,
  },
  {
    pattern: /^"(.*)" মুছে ফেলা হবে। কোনো তালিকায় ব্যবহৃত থাকলে বা legacy দিন\/রাত key হলে মুছে ফেলা যাবে না। প্রয়োজনে শিফটটি নিষ্ক্রিয় করুন।$/,
    replacement: (m) =>
      `"${m[1]}" will be deleted. It cannot be deleted while lists use it or it is a legacy day/night key. Deactivate the shift instead if needed.`,
  },
  {
    pattern: /^"(.*)" \((.*)\) এবং এই ভাষার সংরক্ষিত অনুবাদ মুছে যাবে। ডিফল্ট বা সিস্টেম ভাষা মুছে ফেলা যাবে না।$/,
    replacement: (m) =>
      `"${m[1]}" (${m[2]}) and its saved translations will be deleted. The default or system language cannot be deleted.`,
  },
  {
    pattern: /^(.*) \((.*)\) তালিকা এবং এর সব আইটেম স্থায়ীভাবে মুছে যাবে।$/,
    replacement: (m) =>
      `List ${m[1]} (${m[2]}) and all its items will be permanently deleted.`,
  },
  {
    pattern: /^(.+) \((নিষ্ক্রিয়)\)$/,
    replacement: (m) => `${m[1]} (inactive)`,
  },
  {
    pattern: /^তৈরি করেছেন: (.*)$/,
    replacement: (m) => `Created by: ${m[1]}`,
  },
  {
    pattern: /^(.+) ভাগ (.+)$/,
    replacement: (m) => `${m[1]} of ${m[2]}`,
  },
  {
    pattern: /^(.+) তালিকা মুছুন$/,
    replacement: (m) => `Delete list ${m[1]}`,
  },
  {
    pattern: /^(.+) তালিকা সম্পাদনা$/,
    replacement: (m) => `Edit list ${m[1]}`,
  },
  {
    pattern: /^(.+) এর নাম সম্পাদনা$/,
    replacement: (m) => `Edit name of ${m[1]}`,
  },
  {
    pattern: /^(.+) সম্পাদনা$/,
    replacement: (m) => `Edit ${m[1]}`,
  },
  {
    pattern: /^(.+) মুছুন$/,
    replacement: (m) => `Delete ${m[1]}`,
  },
  {
    pattern: /^(.+) অনুবাদ$/,
    replacement: (m) => `${m[1]} translation`,
  },
  {
    pattern: /^রঙ (.+)$/,
    replacement: (m) => `Color ${m[1]}`,
  },
  {
    pattern: /^(.+) তালিকা$/,
    replacement: (m) => `${m[1]} list`,
  },
  {
    pattern: /^(.+) আপডেট হয়েছে$/,
    replacement: (m) => `${m[1]} updated`,
  },
  {
    pattern: /^(.+) যোগ হয়েছে$/,
    replacement: (m) => `${m[1]} added`,
  },
];

/** Localizes database-driven Bengali messages that contain variable values. */
export function translateDynamic(source: string, languageCode: string): string | null {
  if (languageCode === "bn") return null;
  const core = source.trim();
  if (!core) return null;
  for (const rule of rules) {
    const match = core.match(rule.pattern);
    if (!match) continue;
    const value =
      typeof rule.replacement === "function"
        ? rule.replacement(match)
        : rule.replacement.replace(/\$(\d)/g, (_, index: string) => match[Number(index)] ?? "");
    const start = source.indexOf(core);
    return `${source.slice(0, start)}${value}${source.slice(start + core.length)}`;
  }
  return null;
}
