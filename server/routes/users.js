/**
 * user.js is the URL router for userController.js
 * the user will manage these roles:
 * 1. update personal info
 */

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

//get user profile
router.get('/:user_id/profile', usersController.getUserProfile);

module.exports = router;