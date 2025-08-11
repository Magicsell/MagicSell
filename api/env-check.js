module.exports = (req, res) => {
  res.setHeader('Content-Type','application/json');
  res.status(200).json({
    MONGODB_URI: !!process.env.MONGODB_URI,
    DB_NAME: !!process.env.DB_NAME
  });
};
