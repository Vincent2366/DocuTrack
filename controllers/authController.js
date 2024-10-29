const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Mongoose User model example
const otpService = require('../services/otpService'); // 2FA service example
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

// Registers a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Authenticates a user and returns a JWT
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

// Verifies 2FA code
exports.verify2FA = async (req, res) => {
  try {
    const { userId, otpCode } = req.body;
    const isVerified = otpService.verifyOTP(userId, otpCode);
    if (!isVerified) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }
    res.json({ message: '2FA verification successful' });
  } catch (error) {
    res.status(500).json({ error: '2FA verification failed' });
  }
};

// Refreshes the JWT
exports.refreshToken = (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ token: newToken });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token has expired' });
    }
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// Logs out the user
exports.logoutUser = (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Retrieves the current user detail and role
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
};
