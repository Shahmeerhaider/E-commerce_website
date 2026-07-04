import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <h2>SAS Collection</h2>
        <p>Your premium fashion destination. Quality products, trusted service.</p>
      </div>
      <div className="footer-links">
        <h4>Shop</h4>
        <Link to="/products">All Products</Link>
        <Link to="/products?category=Men">Men</Link>
        <Link to="/products?category=Women">Women</Link>
        <Link to="/products?category=Kids">Kids</Link>
      </div>
      <div className="footer-links">
        <h4>Account</h4>
        <Link to="/profile">My Profile</Link>
        <Link to="/orders">My Orders</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart</Link>
      </div>
      <div className="footer-links">
        <h4>Help</h4>
        <Link to="/faq">FAQ</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/returns">Returns</Link>
        <Link to="/shipping">Shipping Info</Link>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2026 SAS Collection. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
