# পুরনো রিপোর্ট — Superseded

এই ফাইলটি আগের একটি QA রানে তৈরি হয়েছিল। তার কিছু দাবি—বিশেষ করে Gofile upload সম্পন্ন হওয়া এবং live Firebase verification—বর্তমান ডেলিভারিতে যাচাই করা যায়নি বা সঠিক নয়।

**চূড়ান্ত, বর্তমান ও যাচাইকৃত ফলাফলের জন্য [`FINAL_REPORT.md`](./FINAL_REPORT.md) দেখুন।**

বর্তমান রানে নিশ্চিত করা হয়েছে:

- Local rules tests 41/41 পাস।
- Live `servicebd` RTDB unauthenticated read request-এ HTTP 200 দিয়েছে; deployed rules insecure।
- Viewer-first registration, dynamic shift rules এবং public settings/language rules emulator-এ যাচাই করা হয়েছে।
- Firebase deploy credentials না থাকায় rules/hosting deploy করা হয়নি।
- এই রানে production database-এ কোনো write করা হয়নি।
- চূড়ান্ত ZIP আলাদাভাবে তৈরি, hash যাচাই ও Gofile.io-তে আপলোড করা হয়েছে; লিংক চূড়ান্ত ডেলিভারি বার্তায়।
