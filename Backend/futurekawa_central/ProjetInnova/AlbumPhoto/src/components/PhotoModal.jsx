import { useState, useEffect, useRef } from 'react';
import LocationPicker from './LocationPicker';
import { photosApi, tagsApi, getFileUrl } from '../services/api';

export default function PhotoModal({ photo, onClose, onUpdate }) {
  const [description, setDescription] = useState(photo.description || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tags, setTags] = useState([]);
  const [pendingTag, setPendingTag] = useState(null); // zone cliquée, en attente de nom
  const [tagName, setTagName] = useState('');
  const imgRef = useRef(null);

  useEffect(() => {
    tagsApi.getByPhoto(photo.id).then(setTags).catch(console.error);
  }, [photo.id]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await photosApi.updateDescription(photo.id, description);
      onUpdate(updated);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = (e) => {
    // Si on clique sur un tag existant, on ignore
    if (e.target !== imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Cadre de 15% x 20% centré sur le clic
    setPendingTag({
      x: Math.max(0, x - 7.5),
      y: Math.max(0, y - 10),
      width: 15,
      height: 20,
    });
    setTagName('');
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim() || !pendingTag) return;

    try {
      const newTag = await tagsApi.tag(photo.id, { name: tagName.trim(), ...pendingTag });
      setTags([...tags, newTag]);
      setPendingTag(null);
      setTagName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await tagsApi.remove(tagId);
      setTags(tags.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLocationSelect = async (selectedLocation) => {
  setLocation(selectedLocation);
  setSavingLocation(true);
  try {
    await photosApi.updateLocation(photo.id, selectedLocation);
  } catch (err) {
    console.error(err);
  } finally {
    setSavingLocation(false);
  }
};



const [location, setLocation] = useState(
  photo.location_name
    ? { latitude: photo.latitude, longitude: photo.longitude, location_name: photo.location_name }
    : null
);
const [savingLocation, setSavingLocation] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zone image avec tags */}
        <div className="relative bg-black" onClick={pendingTag ? () => setPendingTag(null) : undefined}>
          <img
            ref={imgRef}
            src={getFileUrl(photo.url)}
            alt={photo.description || ''}
            className="w-full max-h-96 object-contain cursor-crosshair select-none"
            onClick={handleImageClick}
            draggable={false}
          />

          {/* Tags existants */}
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="absolute border-2 border-yellow-400 group"
              style={{
                left: `${tag.x}%`,
                top: `${tag.y}%`,
                width: `${tag.width}%`,
                height: `${tag.height}%`,
              }}
            >
              <span className="absolute -bottom-6 left-0 bg-yellow-400 text-black text-xs px-1 rounded whitespace-nowrap">
                {tag.name}
              </span>
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Tag en cours de création */}
          {pendingTag && (
            <div
              className="absolute border-2 border-blue-400 border-dashed"
              style={{
                left: `${pendingTag.x}%`,
                top: `${pendingTag.y}%`,
                width: `${pendingTag.width}%`,
                height: `${pendingTag.height}%`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={handleTagSubmit}
                className="absolute top-full left-0 mt-1 flex gap-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Nom..."
                  className="px-2 py-1 text-xs border rounded shadow bg-white w-28"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                >
                  OK
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center py-1">
          Cliquez sur la photo pour taguer une personne
        </p>

        {/* Description */}
        <div className="p-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ajouter une description..."
            className="w-full px-3 py-2 border rounded resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            <div>
              {success && <span className="text-green-500 text-sm">Enregistré ✓</span>}
            </div>
            <div className="mt-3 border-t pt-3">
                <p className="text-sm font-medium text-gray-600 mb-2">📍 Lieu</p>
                {location ? (
                    <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{location.location_name}</span>
                    <button
                        onClick={() => setLocation(null)}
                        className="text-red-400 text-xs hover:underline"
                    >
                        Supprimer
                    </button>
                    </div>
                ) : (
                    <LocationPicker onSelect={handleLocationSelect} />
                )}
                {savingLocation && <p className="text-xs text-gray-400 mt-1">Enregistrement du lieu...</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:underline"
              >
                Fermer
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}