# MagicSell 🚀

Modern satış ve teslimat yönetim sistemi. React frontend ve Node.js backend ile geliştirilmiştir.

## ✨ Özellikler

- 🚗 Sürücü uygulaması
- 📊 Satış raporları ve grafikleri
- 🔐 Admin giriş sistemi
- 📱 QR kod üretimi
- 🗺️ Harita entegrasyonu
- 📈 Satış tahminleri
- 🔔 Bildirim sistemi

## 🏗️ Proje Yapısı

```
MagicSell/
├── frontend/          # React uygulaması
├── api/              # Node.js backend API
├── backend/          # Yedek backend
└── vercel.json       # Vercel deployment konfigürasyonu
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm 8+

### Kurulum
```bash
# Tüm bağımlılıkları yükle
npm run install:all

# Geliştirme modunda çalıştır
npm run dev

# Production build
npm run build
```

### Geliştirme
```bash
# Sadece API'yi çalıştır
npm run dev:api

# Sadece frontend'i çalıştır
npm run dev:frontend
```

## 🌐 Deployment

### Vercel ile Deploy
1. Vercel hesabınıza giriş yapın
2. GitHub repository'nizi bağlayın
3. Otomatik deployment başlayacaktır

### Manuel Deploy
```bash
# Build
npm run build

# Vercel'e deploy
vercel --prod
```

## 🔧 Konfigürasyon

### Environment Variables
`.env` dosyası oluşturun:
```env
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
API_KEY=your_api_key
```

## 📱 API Endpoints

- `GET /api/orders` - Siparişleri listele
- `POST /api/orders` - Yeni sipariş oluştur
- `GET /api/sales` - Satış raporları
- `GET /api/drivers` - Sürücü bilgileri

## 🛠️ Teknolojiler

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB
- **Deployment**: Vercel
- **Maps**: Mapbox GL

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- Proje: [GitHub Repository](https://github.com/yourusername/magicsell)
- Sorunlar: [GitHub Issues](https://github.com/yourusername/magicsell/issues)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 