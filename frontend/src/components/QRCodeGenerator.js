import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { QrCode2, Share, ContentCopy } from '@mui/icons-material';
import QRCode from 'qrcode';

// ---- Helpers ----
const stripTrailingSlash = (s) => (s || '').replace(/\/+$/, '');
const PUBLIC_ORIGIN =
  stripTrailingSlash(process.env.REACT_APP_PUBLIC_ORIGIN) ||
  stripTrailingSlash(window.location.origin);

const buildDriverUrl = () => `${PUBLIC_ORIGIN}/?tab=3&driver=true`;
const isLocalhostOrigin = () =>
  /^(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(PUBLIC_ORIGIN);

const QRCodeGenerator = () => {
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const generateQRCode = async () => {
    const driverUrl = buildDriverUrl();
    setQrCodeUrl(driverUrl);

    try {
      const qrDataUrl = await QRCode.toDataURL(driverUrl, {
        width: 350,
        margin: 6,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.9
      });
      setQrCodeDataUrl(qrDataUrl);
      setShowQR(true);

      if (isLocalhostOrigin()) {
        setSnackbarMessage(
          'Uyarı: URL localhost. Telefonda çalışmaz. REACT_APP_PUBLIC_ORIGIN ile LAN IP veya canlı domain verin.'
        );
        setSnackbarSeverity('warning');
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error('QR Code generation error:', err);
      setSnackbarMessage('QR üretilemedi.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage('Link panoya kopyalandı!');
    setSnackbarSeverity('success');
    setShowSnackbar(true);
  };

  const shareUrl = () => {
    const url = buildDriverUrl();
    if (navigator.share) {
      navigator
        .share({
          title: 'MagicSell Driver App',
          text: 'Driver uygulamasını aç',
          url
        })
        .catch(() => copyToClipboard(url));
    } else {
      copyToClipboard(url);
    }
  };

  const baseUrl = PUBLIC_ORIGIN;
  const iphoneUrl = buildDriverUrl();

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          📱 Quick Mobile Access
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          iPhone için QR kod — kamerayla tara veya link paylaş
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<QrCode2 />} onClick={generateQRCode}>
            Show QR Code
          </Button>

          <Button variant="outlined" startIcon={<Share />} onClick={shareUrl}>
            Share Link
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => copyToClipboard(iphoneUrl)}
          >
            Copy iPhone URL
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => copyToClipboard(baseUrl)}
          >
            Copy Base URL
          </Button>
        </Box>
      </Paper>

      <Dialog open={showQR} onClose={() => setShowQR(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📱 Driver App QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Telefon kamerasıyla bu kodu tarayın
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code for Driver App" style={{ width: 300, height: 300 }} />
              ) : (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    border: '2px dashed #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    QR Code Placeholder
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {qrCodeUrl}
            </Typography>

            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(qrCodeUrl)}
              fullWidth
            >
              Copy Link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQR(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={showSnackbar} autoHideDuration={3000} onClose={() => setShowSnackbar(false)}>
        <Alert severity={snackbarSeverity} onClose={() => setShowSnackbar(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QRCodeGenerator;
