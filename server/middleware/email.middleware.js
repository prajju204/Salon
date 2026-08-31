const restrictUnverified = (req, res, next) => {
  if (req.user && req.user.role === 'customer' && !req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email to access this feature.'
    });
  }
  next();
};

module.exports = { restrictUnverified };
