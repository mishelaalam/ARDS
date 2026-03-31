const BASE_URL = 'http://localhost:5000';

export const getUserSearches = async (user_id) => {
  const res = await fetch(`${BASE_URL}/searches/user/${user_id}`);
  return res.json();
};

export const saveSearch = async (searchData) => {
  const res = await fetch(`${BASE_URL}/searches/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchData)
  });
  return res.json();
};

export const deleteSearch = async (search_id) => {
  const res = await fetch(`${BASE_URL}/searches/${search_id}`, {
    method: 'DELETE'
  });
  return res.json();
};

export const getPreferences = async (user_id) => {
  const res = await fetch(`${BASE_URL}/searches/preferences/${user_id}`);
  return res.json();
};

export const savePreferences = async (user_id, preferences) => {
  const res = await fetch(`${BASE_URL}/searches/preferences/${user_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  return res.json();
};

export const updatePreferences = async (user_id, preferences) => {
  const res = await fetch(`${BASE_URL}/searches/preferences/${user_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  return res.json();
};