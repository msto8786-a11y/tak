"""
سكريبت التشغيل السريع - Quick Start Script
يشغل كل شيء تلقائياً!
"""

import subprocess
import os
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """تشغيل أمر والانتظار حتى ينتهي"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("\n" + "="*70)
    print("🚀 سكريبت التشغيل السريع - Quick Start")
    print("="*70)
    
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # الخطوة 1: تثبيت مكتبات Backend
    print("\n[1/3] 📦 تثبيت مكتبات Backend...")
    if run_command("pip install -r requirements.txt", cwd=backend_dir):
        print("✅ تم تثبيت Backend requirements")
    else:
        print("⚠️ حدثت مشكلة في تثبيت Backend")
    
    # الخطوة 2: تثبيت Firebase للـ Frontend
    print("\n[2/3] 📦 تثبيت Firebase للـ Frontend...")
    if run_command("npm install firebase", cwd=frontend_dir):
        print("✅ تم تثبيت Firebase")
    else:
        print("⚠️ حدثت مشكلة في تثبيت Firebase")
    
    # الخطوة 3: إنشاء قاعدة البيانات
    print("\n[3/3] 🔥 إنشاء قاعدة البيانات Firebase...")
    if run_command("python init_firebase.py", cwd=backend_dir):
        print("✅ تم إنشاء قاعدة البيانات بنجاح!")
    else:
        print("⚠️ حدثت مشكلة في إنشاء قاعدة البيانات")
    
    print("\n" + "="*70)
    print("✅ تم إعداد كل شيء!")
    print("="*70)
    
    print("\n🎯 الخطوة التالية:")
    print("\nافتح Terminal جديد وشغّل:")
    print("   cd backend")
    print("   python -m uvicorn server_firebase:app --reload")
    
    print("\nوفي Terminal آخر:")
    print("   cd frontend")
    print("   npm start")
    
    print("\n✨ تم! 🎉\n")

if __name__ == "__main__":
    main()
