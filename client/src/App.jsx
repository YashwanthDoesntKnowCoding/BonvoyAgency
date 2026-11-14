import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import PackagesPage from './pages/PackagesPage';
import PackageDetailPage from './pages/PackageDetailPage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import MyBookingsPage from './pages/MyBookingsPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

function Layout({ children }) {
  const [dark, setDark] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <>
      <header className="topbar">
        <div className="container nav-wrap">
          <Link to="/" className="brand">Bonvoyagency</Link>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/packages">Packages</Link>
            <Link to="/booking">Book</Link>
            <Link to="/my-bookings">My trips</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="nav-actions">
            <button className="ghost-btn" onClick={() => setDark((value) => !value)}>{dark ? 'Light' : 'Dark'}</button>
            {user ? (
              <>
                <span className="user-pill">{user.full_name || user.email}</span>
                <button className="secondary-btn" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-btn">Login</Link>
                <Link to="/register" className="primary-btn">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>Bonvoyagency • Travel made simple</div>
          <div>© 2026</div>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/packages/:slug" element={<PackageDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage initialMode="register" />} />
        <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'agent']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
