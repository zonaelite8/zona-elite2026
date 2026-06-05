const express = require('express');
const router = express.Router();
const { register, login, googleLogin, updateProfile, verifyCode } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.put('/profile', authenticateToken, updateProfile);
router.post('/verify-code', verifyCode);

module.exports = router;
