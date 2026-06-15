const pool = require('../config/db');

// Créer une personne et la taguer sur une photo
exports.tagPerson = async (req, res) => {
  const { photoId } = req.params;
  const { name, x, y, width, height } = req.body;
  const userId = req.user.id;

  if (!name || x == null || y == null || width == null || height == null) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  try {
    // Créer la personne si elle n'existe pas encore pour cet utilisateur
    let personResult = await pool.query(
      'SELECT id FROM persons WHERE name = $1 AND user_id = $2',
      [name, userId]
    );

    let personId;
    if (personResult.rows.length === 0) {
      const inserted = await pool.query(
        'INSERT INTO persons (name, user_id) VALUES ($1, $2) RETURNING id',
        [name, userId]
      );
      personId = inserted.rows[0].id;
    } else {
      personId = personResult.rows[0].id;
    }

    // Créer le tag sur la photo
    const tag = await pool.query(
      `INSERT INTO photo_persons (photo_id, person_id, x, y, width, height)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (photo_id, person_id) DO UPDATE SET x=$3, y=$4, width=$5, height=$6
       RETURNING *`,
      [photoId, personId, x, y, width, height]
    );

    res.status(201).json({ ...tag.rows[0], name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les tags d'une photo
exports.getTagsByPhoto = async (req, res) => {
  const { photoId } = req.params;

  try {
    const result = await pool.query(
      `SELECT pp.id, pp.x, pp.y, pp.width, pp.height, p.id as person_id, p.name
       FROM photo_persons pp
       JOIN persons p ON p.id = pp.person_id
       WHERE pp.photo_id = $1`,
      [photoId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un tag
exports.removeTag = async (req, res) => {
  const { tagId } = req.params;

  try {
    await pool.query('DELETE FROM photo_persons WHERE id = $1', [tagId]);
    res.json({ message: 'Tag supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Lister toutes les personnes de l'utilisateur
exports.getPersons = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM persons WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};