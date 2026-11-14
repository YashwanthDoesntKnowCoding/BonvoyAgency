import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('bonvoy_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = ({ user: currentUser, token }) => {
    localStorage.setItem('bonvoy_token', token);
    localStorage.setItem('bonvoy_user', JSON.stringify(currentUser));
    setUser(currentUser);
  };

  const logout = () => {
    localStorage.removeItem('bonvoy_token');
    localStorage.removeItem('bonvoy_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
