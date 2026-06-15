const pool = require('../config/db');

// Partager un album avec un utilisateur
exports.shareAlbum = async (req, res) => {
  const { albumId } = req.params;
  const { email, role } = req.body;
  const ownerId = req.user.id;

  if (!email) {
    return res.status(400).json({ message: 'Email requis' });
  }

  const validRoles = ['viewer', 'contributor'];
  const assignedRole = validRoles.includes(role) ? role : 'viewer';

  try {
    const albumCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const targetUserId = userResult.rows[0].id;

    if (targetUserId === ownerId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas partager avec vous-même' });
    }

    await pool.query(
      `INSERT INTO album_shares (album_id, shared_with_user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (album_id, shared_with_user_id) DO UPDATE SET role = $3`,
      [albumId, targetUserId, assignedRole]
    );

    res.status(201).json({ message: `Album partagé en tant que ${assignedRole}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Lister les utilisateurs avec qui un album est partagé
exports.getShares = async (req, res) => {
  const { albumId } = req.params;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, s.role, s.created_at
       FROM album_shares s
       JOIN users u ON u.id = s.shared_with_user_id
       WHERE s.album_id = $1`,
      [albumId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Révoquer un partage
exports.removeShare = async (req, res) => {
  const { albumId, userId } = req.params;
  const ownerId = req.user.id;

  try {
    const albumCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, ownerId]
    );
    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    await pool.query(
      'DELETE FROM album_shares WHERE album_id = $1 AND shared_with_user_id = $2',
      [albumId, userId]
    );

    res.json({ message: 'Partage révoqué' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Albums partagés avec l'utilisateur connecté
exports.getSharedWithMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT a.*, u.username as owner_name, s.role
       FROM album_shares s
       JOIN albums a ON a.id = s.album_id
       JOIN users u ON u.id = a.owner_id
       WHERE s.shared_with_user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Vérifier le rôle de l'utilisateur sur un album
exports.getMyRole = async (req, res) => {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    // Propriétaire ?
    const ownerCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND owner_id = $2',
      [albumId, userId]
    );
    if (ownerCheck.rows.length > 0) {
      return res.json({ role: 'owner' });
    }

    // Invité ?
    const shareCheck = await pool.query(
      'SELECT role FROM album_shares WHERE album_id = $1 AND shared_with_user_id = $2',
      [albumId, userId]
    );
    if (shareCheck.rows.length > 0) {
      return res.json({ role: shareCheck.rows[0].role });
    }

    res.status(403).json({ message: 'Accès refusé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};