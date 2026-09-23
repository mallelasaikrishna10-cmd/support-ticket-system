const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorize.middleware');

// Protected: Agent only
router.get('/', authenticateToken, authorizeRoles('agent'), UserController.getUsers);

module.exports = router;
