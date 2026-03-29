/**
 * searches.js is the URL router for searchesController.js
 * manages:
 * 1. Save search
 * 2. Get user searches
 * 3. Delete search
 * 4. Get preferences
 * 5. Save preferences
 * 6. Update preferences
 */

const express = require('express');
const router = express.Router();
const searchesController = require('../controllers/searchesController');

// saved searches
router.post('/save', searchesController.saveSearch);
router.get('/user/:user_id', searchesController.getUserSearches);
router.delete('/:search_id', searchesController.deleteSearch);

// preferences
router.get('/preferences/:user_id', searchesController.getPreferences);
router.post('/preferences/:user_id', searchesController.savePreferences);
router.put('/preferences/:user_id', searchesController.updatePreferences);

module.exports = router;
