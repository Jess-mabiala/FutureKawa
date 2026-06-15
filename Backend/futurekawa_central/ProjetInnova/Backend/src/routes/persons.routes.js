const express = require('express');
const router = express.Router();
const personsController = require('../controllers/persons.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/photos/:photoId/tags', personsController.tagPerson);
router.get('/photos/:photoId/tags', personsController.getTagsByPhoto);
router.delete('/tags/:tagId', personsController.removeTag);
router.get('/persons', personsController.getPersons);

module.exports = router;