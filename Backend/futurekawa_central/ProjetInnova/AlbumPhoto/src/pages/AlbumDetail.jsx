import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { albumsApi, photosApi, sharesApi, tagsApi, getFileUrl } from '../services/api';
import PhotoModal from '../components/PhotoModal';
import { useAuth } from '../context/AuthContext';
import QualityPanel from '../components/QualityPanel';

export default function AlbumDetail() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [shares, setShares] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [filtering, setFiltering] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [shareRole, setShareRole] = useState('viewer');
  const [uploadWarnings, setUploadWarnings] = useState([]);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const fetchData = async () => {
    const roleData = await sharesApi.getMyRole(id);
    setMyRole(roleData.role);
    try {
      const [albumData, photosData, sharesData] = await Promise.all([
        albumsApi.getById(id),
        photosApi.getByAlbum(id),
        sharesApi.getShares(id),
      ]);
      setAlbum(albumData);
      setPhotos(photosData);
      setShares(sharesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleFileChange = async (e) => {
  const files = e.target.files;
  if (!files.length) return;
  setUploading(true);
  setError('');
  setUploadWarnings([]);
  try {
    const result = await photosApi.upload(id, files);
    const warnings = result.warnings || [];
    setUploadWarnings(warnings);
    fetchData();
  } catch (err) {
    setError(err.message);
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};

  const handleDelete = async (photoId) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await photosApi.delete(photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShare = async (e) => {
    await sharesApi.share(id, shareEmail, shareRole);
    e.preventDefault();
    setShareError('');
    setShareSuccess('');
    try {
      await sharesApi.share(id, shareEmail);
      setShareSuccess('Album partagé avec succès !');
      setShareEmail('');
      const sharesData = await sharesApi.getShares(id);
      setShares(sharesData);
    } catch (err) {
      setShareError(err.message);
    }
  };

  const handleRemoveShare = async (userId) => {
    try {
      await sharesApi.remove(id, userId);
      setShares(shares.filter((s) => s.id !== userId));
    } catch (err) {
      setShareError(err.message);
    }
  };

  const handlePhotoUpdate = (updatedPhoto) => {
    setPhotos(photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    setSelectedPhoto(updatedPhoto);
  };

  const handleLocationFilter = async (e) => {
    e.preventDefault();
    if (!locationFilter.trim()) {
      fetchData();
      return;
    }
    setFiltering(true);
    try {
      const filtered = await photosApi.filterByLocation(id, locationFilter);
      setPhotos(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setFiltering(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!album) return <div className="p-8">Album non trouvé</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link to="/albums" className="text-blue-500 hover:underline">
        ← Retour aux albums
      </Link>

      <h1 className="text-3xl font-bold mt-4">{album.name}</h1>
      {album.description && <p className="text-gray-500 mt-1">{album.description}</p>}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-6 flex gap-3">
        {(myRole === 'owner' || myRole === 'contributor') && (
          <>
            <button
              onClick={() => setShowQualityPanel(!showQualityPanel)}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              🔍 Qualité
            </button>
            <label className="inline-block bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
              {uploading ? 'Envoi en cours...' : '+ Ajouter des photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </>
        )}

        {uploadWarnings.length > 0 && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 max-w-md">
            <p className="text-sm font-medium text-yellow-700 mb-1">⚠️ Attention</p>
            {uploadWarnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-600">
                {w.filename} :
                {w.reason === 'doublon' && ` possible doublon détecté`}
              </p>
            ))}
          </div>
        )}
        
        {myRole === 'owner' && (
          <button
            onClick={() => setShowSharePanel(!showSharePanel)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            {showSharePanel ? 'Fermer' : '🔗 Partager'}
        </button>
        )}
        
      </div>

      {showSharePanel && (
        <>
          <QualityPanel
            albumId={id}
            onDelete={(photoId) => setPhotos(photos.filter((p) => p.id !== photoId))}
          />
          <div className="mt-4 bg-white p-4 rounded-lg shadow max-w-md">
            <h3 className="font-semibold mb-3">Partager avec un utilisateur</h3>
            <form onSubmit={handleShare} className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Email de l'utilisateur"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
                required
              />
              <form onSubmit={handleShare} className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Email de l'utilisateur"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  required
                />
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="px-3 py-2 border rounded text-sm"
                >
                  <option value="viewer">Lecteur</option>
                  <option value="contributor">Contributeur</option>
                </select>
                <button type="submit" className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600">
                  Partager
                </button>
              </form>
              <button type="submit" className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600">
                Partager
              </button>
            </form>
            {shareError && <p className="text-red-500 text-sm mb-2">{shareError}</p>}
            {shareSuccess && <p className="text-green-500 text-sm mb-2">{shareSuccess}</p>}
            {shares.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Partagé avec :</p>
                <ul className="space-y-2">
                  {shares.map((share) => (
                    <li key={share.id} className="flex justify-between items-center text-sm">
                      <span>{share.username} ({share.email})</span>
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Révoquer
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Filtre par lieu */}
      <form onSubmit={handleLocationFilter} className="mt-4 flex gap-2 max-w-sm">
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filtrer par lieu..."
          className="flex-1 px-3 py-2 border rounded text-sm"
        />
        <button
          type="submit"
          disabled={filtering}
          className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
        >
          Filtrer
        </button>
        {locationFilter && (
          <button
            type="button"
            onClick={() => { setLocationFilter(''); fetchData(); }}
            className="text-gray-400 text-sm hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </form>

      {photos.length === 0 ? (
        <p className="text-gray-500 mt-6">Aucune photo dans cet album.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={getFileUrl(photo.url)}
                alt={photo.description || ''}
                className="w-full h-40 object-cover rounded-lg"
              />

              {/* Lieu en haut à gauche */}
              {photo.location_name && (
                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                  📍 {photo.location_name}
                </div>
              )}

              {/* Description en bas */}
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                  {photo.description}
                </div>
              )}

              {/* Bouton suppression */}
              {(myRole === 'owner' || photo.uploader_id === currentUserID) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
              </button>
              )}
              
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={handlePhotoUpdate}
        />
      )}
    </div>
  );
}