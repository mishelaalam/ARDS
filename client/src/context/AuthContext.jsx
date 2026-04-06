import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if(storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  //distinguish between regular users and admins
  const login = (userData) => {
    //check if user is an admin (from ADMIN table) ==> if so redirect them to different dashboard page
    const isAdmin = userData.is_admin || false;
    const normalizedUser = {
      user_id: userData.user_id || userData.User_ID,
      username: userData.username || userData.Username,
      email: userData.email || userData.Email,
      phone: userData.phone || userData.Phone,
      is_admin: isAdmin,
      role: userData.role || null,
      access_level: userData.access_level || null
    };
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);