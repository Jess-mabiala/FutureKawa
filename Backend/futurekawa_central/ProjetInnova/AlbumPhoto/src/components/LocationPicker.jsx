import { useState } from 'react';

export default function LocationPicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un lieu..."
          className="flex-1 px-3 py-2 border rounded text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {searching ? '...' : 'Chercher'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="border rounded bg-white shadow text-sm max-h-40 overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.place_id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect({
                  latitude: parseFloat(r.lat),
                  longitude: parseFloat(r.lon),
                  location_name: r.display_name.split(',').slice(0, 2).join(',').trim(),
                });
                setResults([]);
                setQuery('');
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}