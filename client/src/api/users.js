const BASE_URL = 'http://localhost:5000';

export const getUserProfile = async (user_id) => {
  const res = await fetch(`${BASE_URL}/users/${user_id}/profile`);
  return res.json();
};

export const updateUserInfo = async (user_id, data) => {
  const res = await fetch(`${BASE_URL}/users/${user_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const responseData = await res.json();
  return responseData;
};

export const updatePassword = async (user_id, current_password, new_password) => {
  const res = await fetch(`${BASE_URL}/users/${user_id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password, new_password })
  });
  const responseData = await res.json();
  return responseData;
};