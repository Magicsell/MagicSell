# MagicSell - PWA + Vercel Deployment

MagicSell is a delivery management system with route optimization, mobile driver app, and PWA capabilities.

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository
- Mapbox API token

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the MagicSell folder

3. **Environment Variables**
   Add these environment variables in Vercel:
   - `REACT_APP_MAPBOX_TOKEN`: Your Mapbox API token
   - `MAPBOX_TOKEN`: Your Mapbox API token (for backend)

4. **Deploy**
   - Vercel will automatically detect the configuration
   - Frontend will be built and deployed
   - Backend API will be deployed as serverless functions

### Project Structure
```
MagicSell/
├── frontend/          # React PWA
├── backend/           # Express API
│   └── api/          # Vercel serverless functions
├── vercel.json       # Vercel configuration
└── README.md
```

### Features
- ✅ PWA (Progressive Web App)
- ✅ Mobile-first design
- ✅ Route optimization with Mapbox
- ✅ QR code generation for mobile access
- ✅ Real-time updates with Socket.io
- ✅ PDF route printing
- ✅ Customer autocomplete
- ✅ Driver app for mobile devices

### URLs
- **Production**: `https://magicsell.vercel.app`
- **Backend API**: `https://magicsell.vercel.app/api/*`

### Mobile Access
- Scan QR code from the Driver tab
- Install as PWA on mobile devices
- Access driver interface for order management

### Environment Variables
```env
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoibWFnaWNzZWxsIiwiYSI6ImNtZGxoeWVlcjA1aTkybHIwaGRsb2VjbnUifQ.NWaZFfNKBs0C3IC0BtRtww
MAPBOX_TOKEN=pk.eyJ1IjoibWFnaWNzZWxsIiwiYSI6ImNtZGxoeWVlcjA1aTkybHIwaGRsb2VjbnUifQ.NWaZFfNKBs0C3IC0BtRtww
```

### Local Development
```bash
# Frontend
cd frontend
npm start

# Backend
cd backend
npm start
```

### Build Commands
```bash
# Frontend build
cd frontend
npm run build

# Backend (no build needed)
cd backend
npm start
``` 