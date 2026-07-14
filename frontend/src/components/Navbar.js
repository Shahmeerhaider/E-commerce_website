import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?keyword=${search}`);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">SAS Collection</Link>
        <form className="nav-search" onSubmit={handleSearch}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
          <button type="submit">⚲</button>
        </form>
        <div className="nav-actions">
          <Link to="/cart" className="nav-cart">
            🛒 <span className="cart-badge">{cartCount}</span>
          </Link>
          {user ? (
            <div className="nav-user">
              <span className="nav-username">{user.name}</span>
              <div className="dropdown">
                <Link to="/profile">My Profile</Link>
                <Link to="/orders">My Orders</Link>
                <Link to="/wishlist">Wishlist</Link>
                {user.role === 'seller' && <Link to="/seller">Seller Dashboard</Link>}
                {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                <button onClick={logoutUser}>Logout</button>
              </div>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </div>
          )}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              <button onClick={() => { logoutUser(); setMenuOpen(false); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
