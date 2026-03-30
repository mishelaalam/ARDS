/**
 * auth.js is the URL router for authController.js
 * the authentication will manage these roles:
 * 1. Register
 * 2. Login
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//register
router.post('/register', authController.register);

//login
router.post('/login', authController.login);

module.exports = router;