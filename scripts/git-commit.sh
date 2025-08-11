#!/bin/bash

# MagicSell Git Commit Script
# Bu script projeyi GitHub'a commit ve push yapar

echo "🚀 MagicSell Git Commit Script"
echo "================================"

# Git status kontrolü
echo "📋 Git durumu kontrol ediliyor..."
git status

# Değişiklikleri ekle
echo "📁 Değişiklikler ekleniyor..."
git add .

# Commit mesajı al
echo "💬 Commit mesajı girin:"
read commit_message

# Eğer mesaj boşsa varsayılan mesaj kullan
if [ -z "$commit_message" ]; then
    commit_message="Update: MagicSell project changes"
fi

# Commit yap
echo "✅ Commit yapılıyor: $commit_message"
git commit -m "$commit_message"

# Push yap
echo "🚀 GitHub'a push yapılıyor..."
git push origin main

echo "🎉 Başarılı! Proje GitHub'a push edildi."
echo "📱 Vercel otomatik deployment başlayacak..."
