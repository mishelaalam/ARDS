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

//search flights with filters
router.get('/search', flightsController.searchFlights);

//get personalized recommendations (top 3-5 flights)
router.get('/recommendations', flightsController.getRecommendations);

//compare multiple flights
router.get('/compare', flightsController.compareFlights);

//get flight details for "more details" model
router.get('/:id/details', flightsController.getFlightDetails);

module.exports = router;