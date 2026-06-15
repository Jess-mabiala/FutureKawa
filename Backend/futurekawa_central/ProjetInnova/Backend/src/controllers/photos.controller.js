const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const {
  computeHash,
  hammingDistance,
  computeBlurScore,
  BLUR_THRESHOLD,
  DUPLICATE_THRESHOLD,
} = require('../utils/imageAnalysis');

// Upload d'une ou plusieurs photos dans un album
exports.uploadPhotos = async (req, res) => {
  const { albumId } = req.params;
  const ownerId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Aucun fichier envoyé' });
  }

  try {
    const albumCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    // Récupérer les hashs existants dans l'album
    const existingHashes = await pool.query(
      'SELECT id, filename, phash FROM photos WHERE album_id = $1 AND phash IS NOT NULL',
      [albumId]
    );

    const insertedPhotos = [];
    const warnings = [];

    for (const file of req.files) {
      const filePath = file.path;
      const url = `/uploads/${file.filename}`;

      // Calcul hash et score de flou
      const [phash, blurScore] = await Promise.all([
        computeHash(filePath),
        computeBlurScore(filePath),
      ]);

      const isBlurry = blurScore < BLUR_THRESHOLD;

      // Vérifier les doublons
      let duplicateOf = null;
      for (const existing of existingHashes.rows) {
        if (existing.phash && hammingDistance(phash, existing.phash) <= DUPLICATE_THRESHOLD) {
          duplicateOf = existing.filename;
          break;
        }
      }

      if (duplicateOf) {
        warnings.push({ filename: file.originalname, reason: 'doublon', duplicateOf });
      }

      const result = await pool.query(
        `INSERT INTO photos (album_id, filename, url, uploader_id, phash, blur_score, is_blurry)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [albumId, file.filename, url, ownerId, phash, blurScore, isBlurry]
      );

      insertedPhotos.push({
        ...result.rows[0],
        warnings: {
          isBlurry,
          isDuplicate: !!duplicateOf,
          duplicateOf,
        },
      });
    }

    res.status(201).json({ photos: insertedPhotos, warnings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer toutes les photos d'un album
exports.getPhotosByAlbum = async (req, res) => {
  const { albumId } = req.params;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(`SELECT a.id FROM albums a
    LEFT JOIN album_shares s ON s.album_id = a.id
    WHERE a.id = $1 AND (a.owner_id = $2 OR s.shared_with_user_id = $2)`,
    [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const result = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY uploaded_at DESC',
      [albumId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier la description d'une photo
exports.updatePhoto = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE photos SET description = $1 WHERE id = $2 RETURNING *`,
      [description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une photo
exports.deletePhoto = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '../../uploads', result.rows[0].filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erreur suppression fichier:', err);
    });

    res.json({ message: 'Photo supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateLocation = async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, location_name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE photos SET latitude = $1, longitude = $2, location_name = $3 WHERE id = $4 RETURNING *`,
      [latitude, longitude, location_name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Récupérer les photos d'un album filtrées par lieu
exports.getPhotosByLocation = async (req, res) => {
  const { albumId } = req.params;
  const { location } = req.query;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(
      `SELECT a.id FROM albums a
       LEFT JOIN album_shares s ON s.album_id = a.id
       WHERE a.id = $1 AND (a.owner_id = $2 OR s.shared_with_user_id = $2)`,
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const result = await pool.query(
      `SELECT * FROM photos
       WHERE album_id = $1 AND location_name ILIKE $2
       ORDER BY uploaded_at DESC`,
      [albumId, `%${location}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les photos floues d'un album
exports.getBlurryPhotos = async (req, res) => {
  const { albumId } = req.params;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(
      `SELECT a.id FROM albums a
       LEFT JOIN album_shares s ON s.album_id = a.id
       WHERE a.id = $1 AND (a.owner_id = $2 OR s.shared_with_user_id = $2)`,
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const result = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 AND is_blurry = TRUE ORDER BY blur_score ASC',
      [albumId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les doublons d'un album
exports.getDuplicates = async (req, res) => {
  const { albumId } = req.params;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(
      `SELECT a.id FROM albums a
       LEFT JOIN album_shares s ON s.album_id = a.id
       WHERE a.id = $1 AND (a.owner_id = $2 OR s.shared_with_user_id = $2)`,
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    // Récupérer toutes les photos avec hash
    const result = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 AND phash IS NOT NULL ORDER BY uploaded_at ASC',
      [albumId]
    );

    const photos = result.rows;
    const duplicateGroups = [];
    const seen = new Set();

    for (let i = 0; i < photos.length; i++) {
      if (seen.has(photos[i].id)) continue;
      const group = [photos[i]];

      for (let j = i + 1; j < photos.length; j++) {
        if (seen.has(photos[j].id)) continue;
        if (hammingDistance(photos[i].phash, photos[j].phash) <= DUPLICATE_THRESHOLD) {
          group.push(photos[j]);
          seen.add(photos[j].id);
        }
      }

      if (group.length > 1) {
        seen.add(photos[i].id);
        duplicateGroups.push(group);
      }
    }

    res.json(duplicateGroups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};