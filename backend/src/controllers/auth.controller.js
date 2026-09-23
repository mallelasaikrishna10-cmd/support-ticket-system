const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const config = require('../config/environment');

/**
 * Helper to generate signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Email validation regex
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register a new customer account
   * @access  Public
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // 1. Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: name, email, password.',
        });
      }

      // 2. Validate email format
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      // 3. Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      // 4. Check for duplicate email
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      // 5. Securely hash password with bcrypt (cost factor 10)
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 6. Persist user in MySQL database (default role: customer)
      const newUser = await UserModel.create({
        name,
        email,
        passwordHash,
        role: 'customer',
      });

      // 7. Generate JWT
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Customer registration successful.',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/login
   * @desc    Authenticate user (customer or agent) and return JWT
   * @access  Public
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Validate input presence
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
      }

      // 2. Lookup user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 3. Verify password hash using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 4. Generate JWT with user claims
      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/auth/me
   * @desc    Get currently authenticated user's profile
   * @access  Protected (Customer or Agent)
   */
  static async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.',
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/auth/agent-only
   * @desc    Protected endpoint demonstrating role authorization for Agents only
   * @access  Protected (Agent only)
   */
  static async agentOnlyCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: `Agent authorization verified. Welcome Agent ${req.user.name}!`,
      user: req.user,
    });
  }
}

module.exports = AuthController;
