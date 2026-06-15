const API_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur API');
  }

  return res.json();
}

export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (username, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
};

export const albumsApi = {
  getAll: () => request('/albums'),
  getById: (id) => request(`/albums/${id}`),
  create: (data) => request('/albums', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/albums/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/albums/${id}`, { method: 'DELETE' }),
};

const FILES_URL = 'http://localhost:5000';

export const photosApi = {
  getByAlbum: (albumId) => request(`/albums/${albumId}/photos`),
  upload: async (albumId, files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file);
    }
    const token = getToken();
    const res = await fetch(`${API_URL}/albums/${albumId}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Erreur upload');
    }
    return res.json();
  },
  getBlurry: (albumId) => request(`/albums/${albumId}/blurry`),
  getDuplicates: (albumId) => request(`/albums/${albumId}/duplicates`),
  updateDescription: (id, description) =>
    request(`/photos/${id}`, { method: 'PUT', body: JSON.stringify({ description }) }),
  delete: (id) => request(`/photos/${id}`, { method: 'DELETE' }),
  updateLocation: (id, data) =>
    request(`/photos/${id}/location`, { method: 'PUT', body: JSON.stringify(data) }),
  filterByLocation: (albumId, location) =>
    request(`/albums/${albumId}/photos/filter?location=${encodeURIComponent(location)}`),
};

export const sharesApi = {
  share: (albumId, email, role = 'viewer') =>
  request(`/albums/${albumId}/shares`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  }),
  getShares: (albumId) => request(`/albums/${albumId}/shares`),
  remove: (albumId, userId) => request(`/albums/${albumId}/shares/${userId}`, { method: 'DELETE' }),
  getSharedWithMe: () => request('/shared-with-me'),
  getMyRole: (albumId) => request(`/albums/${albumId}/my-role`),
};


export const tagsApi = {
  getByPhoto: (photoId) => request(`/photos/${photoId}/tags`),
  tag: (photoId, data) =>
    request(`/photos/${photoId}/tags`, { method: 'POST', body: JSON.stringify(data) }),
  remove: (tagId) => request(`/tags/${tagId}`, { method: 'DELETE' }),
};




export const getFileUrl = (path) => `${FILES_URL}${path}`;