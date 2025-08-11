export default async function handler(req, res) {
  // Security: Only show in development or with specific key
  const isDev = process.env.NODE_ENV === 'development';
  const hasKey = req.query.key === process.env.ENV_CHECK_KEY;
  
  if (!isDev && !hasKey) {
    return res.status(403).json({ 
      ok: false, 
      error: 'Access denied. Use ?key=YOUR_ENV_CHECK_KEY' 
    });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? 
      `${process.env.MONGODB_URI.substring(0, 20)}...` : 'NOT_SET',
    DB_NAME: process.env.DB_NAME || 'NOT_SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
    VERCEL_REGION: process.env.VERCEL_REGION || 'NOT_SET'
  };

  return res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: envVars,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasDbName: !!process.env.DB_NAME
  });
}
