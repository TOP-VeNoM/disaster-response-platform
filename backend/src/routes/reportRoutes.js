const express = require('express');
const { createReport, listReports, getReport } = require('../controllers/reportController');
const { getMapData } = require('../controllers/mapController');
const { getAnalytics } = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createReport);
router.get('/', listReports);
router.get('/map-data', getMapData);
router.get('/analytics', getAnalytics);
router.get('/:id', getReport);

module.exports = router;



