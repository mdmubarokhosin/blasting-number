import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "ইমেইল দিন")
  .email("সঠিক ইমেইল দিন");

export const passwordSchema = z
  .string()
  .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
  .max(128, "পাসওয়ার্ড ১২৮ অক্ষরের বেশি হতে পারবে না");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে")
  .max(60, "নাম ৬০ অক্ষরের বেশি হতে পারবে না");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const resetSchema = z.object({ email: emailSchema });

export const codeSchema = z
  .string()
  .trim()
  .min(1, "কোড দিন")
  .max(200, "কোড ২০০ অক্ষরের বেশি হতে পারবে না");

export const settingsSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(1, "ব্র্যান্ড নাম দিন")
    .max(60, "ব্র্যান্ড নাম ৬০ অক্ষরের বেশি হতে পারবে না"),
});

const logoUrlSchema = z
  .string()
  .trim()
  .max(500, "লোগো URL ৫০০ অক্ষরের বেশি হতে পারবে না")
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "লোগো URL সঠিক http(s) বা /path হতে হবে");

export const websiteSettingsSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(1, "ওয়েবসাইটের নাম দিন")
    .max(60, "ওয়েবসাইটের নাম ৬০ অক্ষরের বেশি হতে পারবে না"),
  logoUrl: logoUrlSchema,
  contactEmail: z
    .string()
    .trim()
    .max(254, "ইমেইল ২৫৪ অক্ষরের বেশি হতে পারবে না")
    .refine((value) => !value || z.string().email().safeParse(value).success, "সঠিক ইমেইল দিন"),
  contactPhone: z
    .string()
    .trim()
    .max(60, "ফোন নম্বর ৬০ অক্ষরের বেশি হতে পারবে না")
    .refine((value) => !value || /^[+\d][+\d\s().-]{3,59}$/.test(value), "সঠিক ফোন নম্বর দিন"),
  contactAddress: z.string().trim().max(300, "ঠিকানা ৩০০ অক্ষরের বেশি হতে পারবে না"),
});

export const languageCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/, "ভাষা কোড সঠিক নয় (যেমন en বা pt-BR)");

export const languageDetailsSchema = z.object({
  code: languageCodeSchema,
  name: z
    .string()
    .trim()
    .min(2, "ভাষার নাম কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(60, "ভাষার নাম ৬০ অক্ষরের বেশি হতে পারবে না"),
  nativeName: z
    .string()
    .trim()
    .min(2, "স্থানীয় নাম কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(60, "স্থানীয় নাম ৬০ অক্ষরের বেশি হতে পারবে না"),
  direction: z.enum(["ltr", "rtl"]),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.coerce
    .number()
    .int()
    .min(0, "ক্রম ঋণাত্মক হতে পারবে না")
    .max(9999, "ক্রম ৯৯৯৯-এর বেশি হতে পারবে না"),
});

export const listMetaSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "সঠিক তারিখ দিন")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00`)), "সঠিক তারিখ দিন"),
  shift: z
    .string()
    .trim()
    .min(1, "শিফট নির্বাচন করুন")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/, "সঠিক শিফট নির্বাচন করুন"),
  note: z.string().trim().max(300, "নোট ৩০০ অক্ষরের বেশি হতে পারবে না"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Maps a ZodError to the first field error message. */
export function firstZodError(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "সঠিক তথ্য দিন";
  return issue.message;
}

/** Firebase auth error → user friendly Bengali message (never leaks internals). */
export function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "সঠিক ইমেইল দিন";
    case "auth/missing-password":
      return "পাসওয়ার্ড দিন";
    case "auth/weak-password":
      return "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    case "auth/email-already-in-use":
      return "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "ইমেইল বা পাসওয়ার্ড ভুল";
    case "auth/user-disabled":
      return "আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে";
    case "auth/too-many-requests":
      return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন";
    case "auth/network-request-failed":
      return "ইন্টারনেট সংযোগ নেই। আবার চেষ্টা করুন";
    case "auth/requires-recent-login":
      return "নিরাপত্তার জন্য আবার লগইন করুন";
    case "auth/operation-not-allowed":
      return "ইমেইল/পাসওয়ার্ড সাইন-ইন Firebase-এ সক্রিয় করা নেই";
    case "auth/configuration-not-found":
      return "Firebase Authentication কনফিগারেশন পাওয়া যায়নি";
    case "permission-denied":
      return "অনুমতি নেই। অ্যাডমিন অনুমতি প্রয়োজন";
    case "unavailable":
      return "ডাটাবেসে সংযোগ করা যাচ্ছে না";
    case "deadline-exceeded":
      return "ডাটাবেস সাড়া দিচ্ছে না (সময় শেষ)";
    default:
      return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন";
  }
}

/** Network / database error → Bengali message. */
export function dbErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  if (code) return authErrorMessage(code);
  const msg =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : "";
  if (/network/i.test(msg)) return "ইন্টারনেট সংযোগ নেই";
  return "ডাটাবেস অপারেশন ব্যর্থ হয়েছে";
}

export const roleKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/, "Role key ৩–৪০ অক্ষরের lowercase/হাইফেন হতে হবে");

export const categoryKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/, "Slug ৩–৪০ অক্ষরের lowercase/হাইফেন হতে হবে");

export const roleDetailsSchema = z.object({
  name: z.string().trim().min(2, "Role নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(60, "Role নাম ৬০ অক্ষরের বেশি হতে পারবে না"),
  description: z.string().trim().max(200, "বিবরণ ২০০ অক্ষরের বেশি হতে পারবে না"),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "সঠিক hex রঙ দিন"),
  icon: z.string().trim().min(1, "আইকন নির্বাচন করুন").max(60),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.coerce.number().int().min(0, "ক্রম ঋণাত্মক হতে পারবে না").max(9999, "ক্রম ৯৯৯৯-এর বেশি হতে পারবে না"),
});

export const shiftKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/, "Shift key ৩–৪০ অক্ষরের lowercase/হাইফেন হতে হবে");

const shiftTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "সঠিক সময় দিন (HH:mm)");

export const shiftDetailsSchema = z
  .object({
    name: z.string().trim().min(1, "শিফট নাম দিন").max(40, "নাম ৪০ অক্ষরের বেশি হতে পারবে না"),
    description: z.string().trim().max(200, "বিবরণ ২০০ অক্ষরের বেশি হতে পারবে না"),
    startTime: z.union([z.literal(""), shiftTimeSchema]),
    endTime: z.union([z.literal(""), shiftTimeSchema]),
    color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "সঠিক hex রঙ দিন"),
    icon: z.string().trim().min(1, "আইকন নির্বাচন করুন").max(60),
    status: z.enum(["active", "inactive"]),
    sortOrder: z.coerce
      .number()
      .int()
      .min(0, "ক্রম ঋণাত্মক হতে পারবে না")
      .max(9999, "ক্রম ৯৯৯৯-এর বেশি হতে পারবে না"),
  })
  .refine(
    (value) => (!value.startTime && !value.endTime) || (Boolean(value.startTime) && Boolean(value.endTime)),
    { message: "শুরুর সময় ও শেষ সময় একসাথে দিন", path: ["endTime"] },
  );

export const categoryDetailsSchema = z.object({
  name: z.string().trim().min(1, "ক্যাটাগরি নাম দিন").max(40, "নাম ৪০ অক্ষরের বেশি হতে পারবে না"),
  slug: categoryKeySchema,
  description: z.string().trim().max(200, "বিবরণ ২০০ অক্ষরের বেশি হতে পারবে না"),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "সঠিক hex রঙ দিন"),
  icon: z.string().trim().min(1, "আইকন নির্বাচন করুন").max(60),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.coerce.number().int().min(0, "ক্রম ঋণাত্মক হতে পারবে না").max(9999, "ক্রম ৯৯৯৯-এর বেশি হতে পারবে না"),
});

export const managedUserSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema.min(8, "নতুন অ্যাকাউন্টের পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
  roleKey: z.string().trim().min(1, "রোল নির্বাচন করুন"),
});
