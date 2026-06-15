const express = require('express');
const router = express.Router();
const photosController = require('../controllers/photos.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../config/multer');
const contributorMiddleware = require('../middleware/contributor.middleware');

router.use(authMiddleware);

router.post('/albums/:albumId/photos', upload.array('photos', 10), photosController.uploadPhotos);
router.get('/albums/:albumId/photos', photosController.getPhotosByAlbum);
router.get('/albums/:albumId/photos/filter', photosController.getPhotosByLocation);
router.put('/photos/:id', photosController.updatePhoto);
router.put('/photos/:id/location', photosController.updateLocation);
router.delete('/photos/:id', photosController.deletePhoto);
router.get('/albums/:albumId/blurry', photosController.getBlurryPhotos);
router.get('/albums/:albumId/duplicates', photosController.getDuplicates);
// Upload réservé aux propriétaires et contributeurs
router.post(
  '/albums/:albumId/photos',
  contributorMiddleware,
  upload.array('photos', 10),
  photosController.uploadPhotos
);

module.exports = router;