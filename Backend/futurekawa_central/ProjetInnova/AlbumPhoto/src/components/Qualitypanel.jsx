import { useState } from 'react';
import { photosApi, getFileUrl } from '../services/api';

export default function QualityPanel({ albumId, onDelete }) {
  const [blurry, setBlurry] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('blurry');

  const loadData = async () => {
    setLoading(true);
    try {
      const [blurryData, duplicatesData] = await Promise.all([
        photosApi.getBlurry(albumId),
        photosApi.getDuplicates(albumId),
      ]);
      setBlurry(blurryData);
      setDuplicates(duplicatesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await photosApi.delete(photoId);
      setBlurry(blurry.filter((p) => p.id !== photoId));
      setDuplicates(duplicates.map((g) => g.filter((p) => p.id !== photoId)).filter((g) => g.length > 1));
      onDelete(photoId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow max-w-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">🔍 Qualité des photos</h3>
        <button
          onClick={loadData}
          disabled={loading}
          className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
        >
          {loading ? 'Analyse...' : 'Analyser'}
        </button>
      </div>

      <div className="flex gap-3 mb-4 text-sm">
        <button
          onClick={() => setActiveTab('blurry')}
          className={`px-3 py-1 rounded ${activeTab === 'blurry' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
        >
          🌫️ Floues ({blurry.length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-3 py-1 rounded ${activeTab === 'duplicates' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}
        >
          🔁 Doublons ({duplicates.length} groupes)
        </button>
      </div>

      {activeTab === 'blurry' && (
        blurry.length === 0
          ? <p className="text-sm text-gray-400">Aucune photo floue détectée.</p>
          : (
            <div className="grid grid-cols-3 gap-3">
              {blurry.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={getFileUrl(photo.url)}
                    className="w-full h-24 object-cover rounded"
                    alt=""
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )
      )}

      {activeTab === 'duplicates' && (
        duplicates.length === 0
          ? <p className="text-sm text-gray-400">Aucun doublon détecté.</p>
          : duplicates.map((group, i) => (
            <div key={i} className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Groupe {i + 1}</p>
              <div className="flex gap-2 flex-wrap">
                {group.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={getFileUrl(photo.url)}
                      className="w-24 h-24 object-cover rounded"
                      alt=""
                    />
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}