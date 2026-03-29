
/**
 * bookings.js is the URL router for bookingsController.js
 * manages:
 * 1. Create booking
 * 2. Get user bookings
 * 3. Cancel booking
 */

const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

// create a new booking
router.post('/create', bookingsController.createBooking);

// get all bookings for a user
router.get('/user/:user_id', bookingsController.getUserBookings);

// cancel a booking
router.put('/cancel/:booking_id', bookingsController.cancelBooking);

module.exports = router;
