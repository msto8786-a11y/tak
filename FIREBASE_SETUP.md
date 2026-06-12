# 🔥 دليل إعداد Firebase

هذا الدليل يشرح كيفية تحويل المشروع من MongoDB إلى Firebase بخطوات بسيطة جداً.

---

## 📋 جدول المحتويات
1. [إنشاء مشروع Firebase](#إنشاء-مشروع-firebase)
2. [الحصول على مفاتيح الاتصال](#الحصول-على-مفاتيح-الاتصال)
3. [تحديث ملفات البيئة](#تحديث-ملفات-البيئة)
4. [تثبيت المكتبات](#تثبيت-المكتبات)
5. [تشغيل المشروع](#تشغيل-المشروع)

---

## 🎯 الخطوة 1: إنشاء مشروع Firebase

### خطوات بسيطة:

1. **افتح** https://console.firebase.google.com
2. **اضغط** "Create a new project" (إنشاء مشروع جديد)
3. **اكتب اسم المشروع:**
   ```
   control-lab-simulator
   ```
4. **اضغط Continue (متابعة)**
5. **اختر:**
   - ✅ تفعيل Google Analytics (اختياري)
   - ثم اضغط "Create project"
6. **انتظر** 1-2 دقيقة ثم اضغط "Continue"

✅ **تم إنشاء المشروع!**

---

## 🔑 الخطوة 2: الحصول على مفاتيح الاتصال

### للـ Frontend:

1. في لوحة التحكم، اضغط على **⚙️ Settings** (الإعدادات)
2. اختر **Project settings** (إعدادات المشروع)
3. اختر تاب **Your apps** (تطبيقاتك)
4. اضغط **Web** (إذا لم تجد تطبيق ويب)
5. **انسخ هذه البيانات:**
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   ```

### للـ Backend (ملف المفتاح الخاص):

1. في Settings، اختر تاب **Service accounts** (حسابات الخدمة)
2. اختر **Python**
3. اضغط **Generate new private key** (إنشاء مفتاح خاص جديد)
4. **سيتم تحميل ملف JSON** - احفظه باسم `firebase-key.json` في مجلد `backend`

### قاعدة البيانات URL:

1. من القائمة الجانبية، اختر **Realtime Database**
2. اضغط **Create Database** (إنشاء قاعدة بيانات)
3. اختر موقع قريب (مثل: `Middle East` أو `Europe`)
4. ابدأ بـ **Lock mode** (قفل)
5. **انسخ الرابط** - مثل:
   ```
   https://your-project-id.firebaseio.com
   ```

---

## 📝 الخطوة 3: تحديث ملفات البيئة

### 3.1 ملف Backend (.env):

اذهب إلى `backend/.env` أو أنشئه، واكتب:

```env
FIREBASE_CREDENTIALS_PATH=./firebase-key.json
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

**استبدل:**
- `your-project-id` بـ اسم مشروعك

### 3.2 ملف Frontend (.env):

اذهب إلى `frontend/.env` أو أنشئه، واكتب:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
REACT_APP_BACKEND_URL=http://localhost:8000
```

**استبدل:** بالقيم التي نسختها من Firebase

### 3.3 أين تضع ملف firebase-key.json؟

```
tak/
├── backend/
│   ├── firebase-key.json     ← هنا!
│   ├── .env
│   ├── server_firebase.py
│   └── ...
└── frontend/
```

---

## 📦 الخطوة 4: تثبيت المكتبات

### 4.1 Backend:

افتح Terminal في مجلد `backend`:

```bash
cd backend
pip install -r requirements.txt
```

### 4.2 Frontend:

افتح Terminal في مجلد `frontend`:

```bash
cd frontend
npm install firebase
```

✅ **انتظر حتى ينتهي**

---

## 🚀 الخطوة 5: تشغيل المشروع

### طرفية 1 - Backend:

```bash
cd backend
python -m uvicorn server_firebase:app --reload
```

يجب تشوف:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### طرفية 2 - Frontend:

```bash
cd frontend
npm start
```

يجب تشوف:
```
Compiled successfully!
```

✅ **المتصفح سيفتح تلقائياً!**

---

## ⚙️ إعدادات Firebase الأمان (اختياري لكن مهم)

### تفعيل قواعد الأمان:

1. من **Realtime Database**، اختر تاب **Rules**
2. استبدل القواعس بهذا:

```json
{
  "rules": {
    "lab_sessions": {
      ".read": true,
      ".write": true,
      ".indexOn": ["updated_at"]
    },
    "status_checks": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp"]
    }
  }
}
```

3. اضغط **Publish** (نشر)

---

## ✨ كيفية الاستخدام في الـ Frontend

في `frontend/src/components/simulator/SessionsModal.jsx`، غيّر الاستيراد:

```javascript
// من هذا:
import { sbCreate, sbGet, sbList, sbDelete, isSupabaseConfigured } from '../../lib/supabase';

// إلى هذا:
import { fbCreate, fbGet, fbList, fbDelete, isFirebaseConfigured } from '../../lib/firebase';
```

وفي الـ callback، استبدل:

```javascript
const useCloud = isFirebaseConfigured();

async function listSessions(useCloud) {
  if (useCloud) return await fbList();
  return localLoadAll();
}

async function createSession(useCloud, payload) {
  if (useCloud) return await fbCreate(payload);
  // ... localStorage fallback
}

// وهكذا...
```

---

## 🐛 حل المشاكل الشائعة

### ❌ خطأ: "firebase-key.json not found"
**الحل:** تأكد أن الملف موجود في مجلد `backend` وأن المسار في `.env` صحيح

### ❌ خطأ: "FIREBASE_DATABASE_URL must be set"
**الحل:** تأكد أن متغيرات البيئة مكتوبة بشكل صحيح في `.env` و أعد تشغيل الخادم

### ❌ خطأ: "Cannot read properties of undefined"
**الحل:** تأكد أن `REACT_APP_FIREBASE_*` في `frontend/.env` مكتوبة بشكل صحيح

### ❌ بطء في التحميل
**الحل:** تأكد أن قاعدة البيانات موجودة وليست فارغة

---

## 🎉 النتيجة

الآن:
- ✅ جميع الجلسات محفوظة في Firebase
- ✅ يمكن الوصول إليها من أي مكان
- ✅ تطبيقك متصل بقاعدة بيانات حقيقية

**مبروك! 🎊**

---

## 📖 موارد إضافية

- [توثيق Firebase](https://firebase.google.com/docs)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Console](https://console.firebase.google.com)
