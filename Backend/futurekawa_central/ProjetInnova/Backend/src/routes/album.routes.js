const express = require('express');
const router = express.Router();
const albumsController = require('../controllers/albums.controller');
const authMiddleware = require('../middleware/auth.middleware'); 

router.use(authMiddleware); 

router.post('/', albumsController.createAlbum);
router.get('/', albumsController.getAlbums);
router.get('/:id', albumsController.getAlbumById);
router.put('/:id', albumsController.updateAlbum);
router.delete('/:id', albumsController.deleteAlbum);

module.exports = router;