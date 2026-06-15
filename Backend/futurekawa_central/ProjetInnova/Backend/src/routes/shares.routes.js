const express = require('express');
const router = express.Router();
const sharesController = require('../controllers/shares.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/albums/:albumId/shares', sharesController.shareAlbum);
router.get('/albums/:albumId/shares', sharesController.getShares);
router.delete('/albums/:albumId/shares/:userId', sharesController.removeShare);
router.get('/shared-with-me', sharesController.getSharedWithMe);
router.get('/albums/:albumId/my-role', sharesController.getMyRole);

module.exports = router;