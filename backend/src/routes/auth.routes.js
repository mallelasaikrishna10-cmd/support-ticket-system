const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorize.middleware');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes (Any authenticated role)
router.get('/me', authenticateToken, AuthController.getMe);

// Protected route (Agent role only - tests role-based authorization)
router.get('/agent-only', authenticateToken, authorizeRoles('agent'), AuthController.agentOnlyCheck);

module.exports = router;
