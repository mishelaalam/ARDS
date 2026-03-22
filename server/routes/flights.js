const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flightsController');

router.get('/search', flightsController.searchFlights);

module.exports = router;