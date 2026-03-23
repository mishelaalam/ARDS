/**
 * Flights.js is the URL router for flightsController.js
 * the flight will manage these roles:
 * 1. Search
 * 2. Reccomendations
 * 3. Compare
 */

const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flightsController');

router.get('/search', flightsController.searchFlights);

module.exports = router;