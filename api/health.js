export default (req, res) => {
  res.setHeader('Content-Type','application/json');
  res.status(200).json({ ok: true, env: !!process.env.MONGODB_URI });
};


