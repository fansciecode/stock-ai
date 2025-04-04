import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  return jwt.sign({ 
    id: userId,
    userId: userId // Add userId field for backward compatibility
  }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;
