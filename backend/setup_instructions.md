# 🚀 تعليمات الإعداد النهائية

## ✅ ما تم إنجازه:

✅ إضافة Firebase SDK
✅ إنشاء سكريبت التهيئة
✅ إنشاء ملفات البيئة
✅ إنشاء مكتبة Firebase للـ Frontend

---

## 📋 الخطوات الآن:

### 1️⃣ تحديث ملف Frontend/.env

اذهب إلى `frontend/.env` واستبدل `AIzaSyDhk5your_api_key` بـ:

**من Firebase Console:**
1. اذهب إلى Settings
2. Project settings
3. انسخ البيانات:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

مثال:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDaBT_your_actual_key
REACT_APP_FIREBASE_AUTH_DOMAIN=contror.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=contror
REACT_APP_FIREBASE_STORAGE_BUCKET=contror.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abc123def456
REACT_APP_FIREBASE_DATABASE_URL=https://contror-default-rtdb.europe-west1.firebasedatabase.app/
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 2️⃣ تثبيت المكتبات

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install firebase
```

### 3️⃣ إنشاء قاعدة البيانات

```bash
cd backend
python init_firebase.py
```

**ستشوف:**
```
✅ تم الاتصال بـ Firebase بنجاح!
✅ تم إنشاء جدول lab_sessions
✅ تم إنشاء جدول status_checks
✅ تم إعداد Firebase بنجاح!
```

### 4️⃣ تشغيل التطبيق

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn server_firebase:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

## 🎉 انتهى!

الآن تطبيقك يعمل مع Firebase! 🔥
