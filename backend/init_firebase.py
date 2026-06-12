"""
Firebase Database Initialization Script
سكريبت إنشاء قاعدة البيانات تلقائياً
"""

import firebase_admin
from firebase_admin import credentials, db
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

# تحميل متغيرات البيئة
load_dotenv()

def setup_firebase():
    print("\n" + "="*70)
    print("🔥 بدء إنشاء Firebase Realtime Database")
    print("="*70)
    
    # الحصول على البيانات من .env
    credentials_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', './firebase-key.json')
    database_url = os.environ.get('FIREBASE_DATABASE_URL')
    
    print(f"\n📁 ملف المفاتيح: {credentials_path}")
    print(f"🔗 رابط قاعدة البيانات: {database_url}")
    
    # التحقق من و��ود الملف
    if not os.path.exists(credentials_path):
        print(f"\n❌ خطأ: لم أجد الملف {credentials_path}")
        print("💡 يجب أن يكون firebase-key.json في مجلد backend")
        return False
    
    if not database_url:
        print("\n❌ خطأ: FIREBASE_DATABASE_URL غير موجود في .env")
        return False
    
    try:
        print("\n⏳ جاري الاتصال بـ Firebase...")
        
        # تهيئة Firebase
        cred = credentials.Certificate(credentials_path)
        app = firebase_admin.initialize_app(cred, {
            'databaseURL': database_url
        })
        
        print("✅ تم الاتصال بـ Firebase بنجاح!\n")
        
        # الحصول على الوقت الحالي
        now = datetime.now(timezone.utc).isoformat()
        
        # إنشاء جدول lab_sessions
        print("📝 إنشاء جدول 'lab_sessions'...")
        db.reference('lab_sessions').update({
            "system_init": {
                "id": "system_init",
                "name": "تم إنشاء الجدول",
                "student_name": "النظام",
                "components": [],
                "wires": [],
                "created_at": now,
                "updated_at": now
            }
        })
        print("✅ تم إنشاء جدول lab_sessions\n")
        
        # إنشاء جدول status_checks
        print("📝 إنشاء جدول 'status_checks'...")
        db.reference('status_checks').update({
            "system_init": {
                "id": "system_init",
                "client_name": "system_initialization",
                "timestamp": now
            }
        })
        print("✅ تم إنشاء جدول status_checks\n")
        
        # إغلاق الاتصال
        firebase_admin.delete_app(app)
        
        print("="*70)
        print("✅ تم إعداد Firebase بنجاح!")
        print("="*70)
        print("\n🚀 الخطوة التالية:")
        print("   شغّل الـ Backend:\n")
        print("   cd backend")
        print("   python -m uvicorn server_firebase:app --reload\n")
        
        return True
        
    except FileNotFoundError:
        print(f"\n❌ خطأ: لم أجد ملف {credentials_path}")
        return False
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        print("\n💡 تأكد من:")
        print("   1. ملف firebase-key.json موجود")
        print("   2. البيانات في .env صحيحة")
        print("   3. لديك إنترنت")
        return False


if __name__ == "__main__":
    success = setup_firebase()
    exit(0 if success else 1)
