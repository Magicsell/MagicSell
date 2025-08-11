# 🚀 MagicSell Deployment Guide

Bu rehber, MagicSell projesini GitHub'a push etmek ve Vercel'e deploy etmek için adım adım talimatları içerir.

## 📋 Ön Gereksinimler

- [x] GitHub hesabı
- [x] Vercel hesabı
- [x] Node.js 18+ yüklü
- [x] Git yüklü

## 🔧 Yerel Kurulum

### 1. Proje Bağımlılıklarını Yükle
```bash
# Ana proje bağımlılıkları
npm install

# API bağımlılıkları
cd api && npm install

# Frontend bağımlılıkları
cd ../frontend && npm install

# Ana dizine geri dön
cd ..
```

### 2. Environment Variables
`.env` dosyası oluşturun:
```env
# Backend
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
MAPBOX_TOKEN=your_mapbox_token

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

## 🐙 GitHub'a Push

### 1. Git Repository Başlat
```bash
# Git repository'yi başlat
git init

# Remote origin ekle (GitHub repo URL'nizi kullanın)
git remote add origin https://github.com/yourusername/magicsell.git

# Ana branch'i main olarak ayarla
git branch -M main
```

### 2. İlk Commit
```bash
# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: MagicSell project setup"

# GitHub'a push
git push -u origin main
```

### 3. Sonraki Commit'ler
```bash
# Değişiklikleri ekle
git add .

# Commit
git commit -m "Your commit message"

# Push
git push origin main
```

## 🌐 Vercel'e Deploy

### 1. Vercel CLI Kurulum
```bash
npm i -g vercel
```

### 2. Vercel'e Giriş
```bash
vercel login
```

### 3. Proje Deploy
```bash
# İlk deploy
vercel

# Production deploy
vercel --prod
```

### 4. Vercel Dashboard'dan Deploy

#### A. GitHub Repository Bağla
1. [vercel.com](https://vercel.com) adresine gidin
2. "New Project" tıklayın
3. GitHub repository'nizi seçin
4. "Import" tıklayın

#### B. Konfigürasyon
- **Framework Preset**: Other
- **Root Directory**: `./` (ana dizin)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm run install:all`

#### C. Environment Variables
Vercel dashboard'da şu environment variable'ları ekleyin:
```
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
MAPBOX_TOKEN=your_mapbox_token
REACT_APP_API_URL=https://your-project.vercel.app/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

## 🔄 Otomatik Deployment

### GitHub Actions
Proje GitHub'a push edildiğinde otomatik olarak Vercel'e deploy edilecektir.

### Manuel Deploy
```bash
# Sadece build
npm run build

# Vercel'e deploy
vercel --prod
```

## 📱 Test Etme

### 1. Frontend Test
```bash
cd frontend
npm start
```
Tarayıcıda `http://localhost:3000` adresini açın

### 2. Backend Test
```bash
cd api
npm run dev
```
API `http://localhost:5000` adresinde çalışacak

### 3. Production Test
Vercel URL'nizi ziyaret edin ve tüm özellikleri test edin

## 🚨 Sorun Giderme

### Build Hataları
```bash
# Node modules'ları temizle
npm run clean

# Yeniden yükle
npm run install:all
```

### Vercel Deploy Hataları
1. Vercel dashboard'da build loglarını kontrol edin
2. Environment variable'ları doğru ayarlandığından emin olun
3. Node.js versiyonunun 18+ olduğundan emin olun

### API Bağlantı Hataları
1. CORS ayarlarını kontrol edin
2. API endpoint'lerinin doğru olduğundan emin olun
3. Environment variable'ları kontrol edin

## 📊 Monitoring

### Vercel Analytics
- Vercel dashboard'da Analytics sekmesini kullanın
- Performance metrics'leri takip edin

### Error Tracking
- Vercel Function logs'ları kontrol edin
- Frontend console hatalarını izleyin

## 🔒 Güvenlik

### Environment Variables
- Asla API key'leri kod içinde hardcode etmeyin
- Production'da güçlü şifreler kullanın
- MongoDB connection string'ini güvenli tutun

### API Security
- Rate limiting ekleyin
- Input validation yapın
- CORS ayarlarını production için optimize edin

## 📞 Destek

Sorun yaşarsanız:
1. GitHub Issues'da sorun açın
2. Vercel support'a başvurun
3. Proje README.md'sini kontrol edin

---

🎉 **Başarılı deployment!** Projeniz artık canlıda! 