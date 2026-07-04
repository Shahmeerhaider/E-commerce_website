import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, removeItem, updateQty, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const BACKEND_URL = "http://localhost:5000";

  const getImageUrl = (images) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/100?text=No+Image';
    const img = images[0];
    if (typeof img === 'string' && img.startsWith('http')) return img;
    if (typeof img === 'string') {
      const cleanPath = img.startsWith('/') ? img.substring(1) : img;
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    }
    return 'https://via.placeholder.com/100?text=No+Image';
  };

  const handleCheckout = () => {
    if (!user) navigate('/login?redirect=checkout');
    else navigate('/checkout');
  };

  if (cartItems.length === 0) return (
    <div className="empty-state">
      <h2>🛒 Your cart is empty</h2>
      <p>Add some products to get started!</p>
      <Link to="/products" className="btn-primary">Shop Now</Link>
    </div>
  );

  return (
    <div className="cart-page">
      <h1>Shopping Cart ({cartItems.length} items)</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map(item => {
            const img = getImageUrl(item.images);
            const price = item.discountPrice > 0 ? item.discountPrice : item.price;
            return (
              <div key={item._id} className="cart-item">
                <img src={img} alt={item.name} />
                <div className="cart-item-info">
                  <Link to={`/products/${item._id}`}><h3>{item.name}</h3></Link>
                  <p className="cart-price">PKR {price.toLocaleString()}</p>
                </div>
                <div className="qty-control">
                  <button onClick={() => updateQty(item._id, Math.max(1, item.quantity - 1))}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                </div>
                <p className="cart-subtotal">PKR {(price * item.quantity).toLocaleString()}</p>
                <button className="remove-btn" onClick={() => removeItem(item._id)}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{total > 5000 ? 'Free' : 'PKR 200'}</span></div>
          <div className="summary-row total"><span>Total</span><span>PKR {(total + (total > 5000 ? 0 : 200)).toLocaleString()}</span></div>
          <button className="btn-primary btn-full" onClick={handleCheckout}>Proceed to Checkout</button>
          <Link to="/products" className="btn-ghost btn-full">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
