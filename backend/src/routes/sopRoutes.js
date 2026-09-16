const express = require('express');
const { listSOPs, getSOP, createSOP, updateSOP, deleteSOP, testRetrieval } = require('../controllers/sopController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listSOPs);
router.get('/:id', getSOP);
router.post('/', requireRole('admin'), createSOP);
router.put('/:id', requireRole('admin'), updateSOP);
router.delete('/:id', requireRole('admin'), deleteSOP);
router.post('/test-retrieval', requireRole('responder', 'admin'), testRetrieval);

module.exports = router;

