const pool = require('../config/db');

module.exports = async (req, res, next) => {
  const albumId = req.params.albumId || req.params.id;
  const userId = req.user.id;

  try {
    // Propriétaire → OK
    const ownerCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, userId]
    );
    if (ownerCheck.rows.length > 0) return next();

    // Contributeur → OK
    const shareCheck = await pool.query(
      `SELECT role FROM album_shares
       WHERE album_id = $1 AND shared_with_user_id = $2 AND role = 'contributor'`,
      [albumId, userId]
    );
    if (shareCheck.rows.length > 0) return next();

    res.status(403).json({ message: 'Action réservée aux contributeurs' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};