# MagicSell Git Commit Script (PowerShell)
# Bu script projeyi GitHub'a commit ve push yapar

Write-Host "🚀 MagicSell Git Commit Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Git status kontrolü
Write-Host "📋 Git durumu kontrol ediliyor..." -ForegroundColor Yellow
git status

# Değişiklikleri ekle
Write-Host "📁 Değişiklikler ekleniyor..." -ForegroundColor Yellow
git add .

# Commit mesajı al
$commitMessage = Read-Host "💬 Commit mesajı girin"

# Eğer mesaj boşsa varsayılan mesaj kullan
if ([string]::IsNullOrEmpty($commitMessage)) {
    $commitMessage = "Update: MagicSell project changes"
}

# Commit yap
Write-Host "✅ Commit yapılıyor: $commitMessage" -ForegroundColor Green
git commit -m $commitMessage

# Push yap
Write-Host "🚀 GitHub'a push yapılıyor..." -ForegroundColor Yellow
git push origin main

Write-Host "🎉 Başarılı! Proje GitHub'a push edildi." -ForegroundColor Green
Write-Host "📱 Vercel otomatik deployment başlayacak..." -ForegroundColor Cyan
