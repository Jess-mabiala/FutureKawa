const pool = require('../config/db');

// Créer un album
exports.createAlbum = async (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Le nom de l'album est requis" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO albums (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, description, ownerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les albums de l'utilisateur connecté
exports.getAlbums = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM albums WHERE owner_id = $1 ORDER BY created_at DESC`,
      [ownerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un album par id
exports.getAlbumById = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(`SELECT a.* FROM albums a
    LEFT JOIN album_shares s ON s.album_id = a.id
    WHERE a.id = $1 AND (a.owner_id = $2 OR s.shared_with_user_id = $2)`,
    [id, ownerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un album
exports.updateAlbum = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE albums SET name = $1, description = $2 WHERE id = $3 AND owner_id = $4 RETURNING *`,
      [name, description, id, ownerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un album
exports.deleteAlbum = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM albums WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [id, ownerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }
    res.json({ message: 'Album supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};