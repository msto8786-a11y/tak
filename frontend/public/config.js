// =============================================================
// Industrial Control Lab Simulator - Runtime Configuration
// =============================================================
// عدّل هذا الملف بعد رفع الموقع على Plesk بقيم Supabase الخاصة بك.
// لا تحتاج إعادة بناء، فقط احفظ هذا الملف وأعد تحميل الصفحة.
// =============================================================

window.APP_CONFIG = {
  // 1. اذهب إلى https://supabase.com/dashboard
  // 2. اختر مشروعك
  // 3. Settings → API
  // 4. انسخ Project URL والصقه هنا
  SUPABASE_URL: "",

  // 5. انسخ anon public key والصقه هنا (آمن للاستخدام في المتصفح)
  SUPABASE_ANON_KEY: "",
};

// مثال:
// SUPABASE_URL: "https://xxxxxxxxxx.supabase.co",
// SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...."
//
// ⚠️ إذا تركت الحقول فارغة، سيستخدم التطبيق التخزين المحلي (LocalStorage)
//    في متصفح الطالب بدلاً من قاعدة بيانات مشتركة.
