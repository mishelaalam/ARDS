/**
 * admin.js is the URL router for adminController.js
 * manages:
 * 1. Add flight
 * 2. Update flight
 * 3. Delete flight
 * 4. Get all bookings
 * 5. Get all flights
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// flight management
router.post('/flights', adminController.addFlight);
router.put('/flights/:flight_id', adminController.updateFlight);
router.delete('/flights/:flight_id', adminController.deleteFlight);

// monitoring
router.get('/bookings', adminController.getAllBookings);
router.get('/flights', adminController.getAllFlights);

module.exports = router;
