import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { albumsApi, sharesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [albums, setAlbums] = useState([]);
  const [sharedAlbums, setSharedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { logout } = useAuth();

  const fetchAlbums = async () => {
    try {
      const [myAlbums, sharedData] = await Promise.all([
        albumsApi.getAll(),
        sharesApi.getSharedWithMe(),
      ]);
      setAlbums(myAlbums);
      setSharedAlbums(sharedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingAlbum(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingAlbum) {
        await albumsApi.update(editingAlbum.id, { name, description });
      } else {
        await albumsApi.create({ name, description });
      }
      resetForm();
      fetchAlbums();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (album) => {
    setEditingAlbum(album);
    setName(album.name);
    setDescription(album.description || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet album ?')) return;
    try {
      await albumsApi.delete(id);
      fetchAlbums();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes albums</h1>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">
          Déconnexion
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
        className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {showForm ? 'Annuler' : '+ Nouvel album'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingAlbum ? "Modifier l'album" : 'Nouvel album'}
          </h2>
          <input
            type="text"
            placeholder="Nom de l'album"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
            required
          />
          <textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
            rows={3}
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            {editingAlbum ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      )}

      {albums.length === 0 ? (
        <p className="text-gray-500">Aucun album pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div key={album.id} className="bg-white p-4 rounded-lg shadow">
              <Link to={`/albums/${album.id}`} className="text-xl font-semibold hover:underline">
                {album.name}
              </Link>
              {album.description && (
                <p className="text-gray-500 text-sm mt-1">{album.description}</p>
              )}
              <div className="mt-3 flex gap-3 text-sm">
                <button onClick={() => handleEdit(album)} className="text-blue-500 hover:underline">
                  Modifier
                </button>
                <button onClick={() => handleDelete(album.id)} className="text-red-500 hover:underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sharedAlbums.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Partagés avec moi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sharedAlbums.map((album) => (
              <div key={album.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-400">
                <Link to={`/albums/${album.id}`} className="text-xl font-semibold hover:underline">
                  {album.name}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  Par {album.owner_name} · {album.role === 'contributor' ? '✏️ Contributeur' : '👁️ Lecteur'}
                </p>
                {album.description && (
                  <p className="text-gray-500 text-sm mt-1">{album.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}