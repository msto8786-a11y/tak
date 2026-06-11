# دليل إعداد Supabase

هذا الدليل يشرح كيفية تحويل المشروع من MongoDB المحلي إلى Supabase.

## الخطوات الأساسية

### 1. إنشاء حساب Supabase
1. اذهب إلى https://supabase.com
2. انقر على "Start your project"
3. سجل الدخول أو أنشئ حساباً جديداً
4. اختر خطة (Free plan يكفي للتطوير)

### 2. إنشاء مشروع جديد
1. اضغط "New Project"
2. أدخل اسم المشروع (مثل: `control-lab-simulator`)
3. اختر منطقة قريبة (مثل: Middle East أو Europe)
4. اختر كلمة مرور قوية لـ PostgreSQL
5. اضغط "Create new project" (قد يستغرق 1-2 دقيقة)

### 3. الحصول على مفاتيح الاتصال
بعد إنشاء المشروع:
1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL** → سيكون `SUPABASE_URL`
   - **anon key** → سيكون `SUPABASE_KEY`

### 4. إنشاء جداول قاعدة البيانات

#### جدول lab_sessions
```sql
CREATE TABLE lab_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  components JSONB DEFAULT '[]',
  wires JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index على updated_at للترتيب السريع
CREATE INDEX idx_lab_sessions_updated_at ON lab_sessions(updated_at DESC);
```

#### جدول status_checks
```sql
CREATE TABLE status_checks (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index على timestamp
CREATE INDEX idx_status_checks_timestamp ON status_checks(timestamp DESC);
```

**لتنفيذ هذه الجداول:**
1. في Supabase، اذهب إلى **SQL Editor** من الشريط الجانبي
2. انقر **New Query**
3. انسخ والصق الكود أعلاه
4. اضغط **RUN**

### 5. تحديث Backend (.env)
أضف إلى ملف `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,https://yourdomain.com
```

### 6. تحديث Frontend (.env)
أضف إلى ملف `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key_here
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 7. تثبيت المكتبات المطلوبة

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install @supabase/supabase-js
```

### 8. تشغيل المشروع

#### Backend
```bash
cd backend
python -m uvicorn server_supabase:app --reload
```

#### Frontend
```bash
cd frontend
npm start
```

## ملاحظات مهمة

### Row-Level Security (RLS)
يمكنك تفعيل RLS للأمان الإضافي:

```sql
-- تفعيل RLS على جدول lab_sessions
ALTER TABLE lab_sessions ENABLE ROW LEVEL SECURITY;

-- سياسة للوصول العام (بدون مصادقة)
CREATE POLICY "Enable read access for all users" ON lab_sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON lab_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON lab_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON lab_sessions
  FOR DELETE USING (true);
```

### الترحيل من MongoDB
إذا كان لديك بيانات في MongoDB، يمكنك استخدام هذا السكريبت:

```python
# استخراج البيانات من MongoDB وإدراجها في Supabase
import pymongo
from supabase import create_client

mongo_client = pymongo.MongoClient('your_mongo_url')
db = mongo_client['your_db_name']

supabase = create_client('supabase_url', 'supabase_key')

# نقل الجلسات
for session in db.lab_sessions.find():
    session.pop('_id', None)
    supabase.table('lab_sessions').insert(session).execute()

print("تم نقل البيانات بنجاح!")
```

## استكشاف الأخطاء

### خطأ: "SUPABASE_URL and SUPABASE_KEY must be set"
تأكد من:
1. ملف `.env` موجود وفي المجلد الصحيح
2. المتغيرات مكتوبة بشكل صحيح
3. إعادة تشغيل الخادم بعد تعديل `.env`

### خطأ: "relation "lab_sessions" does not exist"
تأكد من:
1. تنفيذ كود SQL لإنشاء الجداول
2. أنك استخدمت **SQL Editor** في Supabase (ليس SQL الأخرى)

### بطء في التحميل
قد يكون سبب الإعدادات الافتراضية. جرب:
1. تحديد indices على الأعمدة المستخدمة في الترتيب
2. تقليل عدد الجلسات المستعادة (`limit`)

## موارد إضافية
- [توثيق Supabase](https://supabase.com/docs)
- [توثيق Supabase JavaScript](https://supabase.com/docs/reference/javascript)
- [حساب Supabase](https://app.supabase.com)
