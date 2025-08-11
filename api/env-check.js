export default (req, res) => {
  res.setHeader('Content-Type','application/json');
  const keys = ['MONGODB_URI','DB_NAME'];
  res.status(200).json(
    Object.fromEntries(keys.map(k => [k, !!process.env[k]]))
  );
};
