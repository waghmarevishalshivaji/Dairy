module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    // Example: Verify token here
    // If valid:
    next();
  
    // If invalid:
    // return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  };