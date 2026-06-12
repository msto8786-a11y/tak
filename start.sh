#!/bin/bash
# سكريبت بدء التطبيق - Start Script
# This script starts both backend and frontend

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 بدء تطبيق محاكي مختبر التحكم الصناعي                 ║"
echo "║              Starting Industrial Control Lab Simulator                   ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# التحقق من وجود مجلدات المشروع
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ خطأ: تأكد من أن المجلدات backend و frontend موجودة"
    exit 1
fi

# إعادة استخدام النافذة لـ Backend
echo "📝 شغّل هذا الأمر في Terminal جديد:"
echo ""
echo "cd backend && python -m uvicorn server_firebase:app --reload"
echo ""

# إعادة استخدام النافذة لـ Frontend
echo "📝 شغّل هذا الأمر في Terminal آخر جديد:"
echo ""
echo "cd frontend && npm start"
echo ""

echo "═════════════════════════════════════════════════════════════════════════════════"
echo "✨ ملاحظة: افتح نافذتي Terminal منفصلتين، واحدة للـ Backend والأخرى للـ Frontend"
echo "═════════════════════════════════════════════════════════════════════════════════"
