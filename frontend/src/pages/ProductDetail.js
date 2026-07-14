import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, addReview } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// Self-contained placeholder (no external network dependency —
// via.placeholder.com has been unreliable).
const NO_IMAGE_PLACEHOLDER = (label) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(label || 'No Image')}%3C/text%3E%3C/svg%3E`;

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const getImageUrl = (imgUrl, fallbackName) => {
    if (!imgUrl || typeof imgUrl !== 'string') return NO_IMAGE_PLACEHOLDER(fallbackName);
    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
    // Handle local backend uploads with /uploads/ prefix
    // (guards against double-prefixing if the stored path already
    // includes "uploads/")
    const cleanPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
    const path = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
    return `${BACKEND_URL}/${path}`;
  };

  useEffect(() => {
    getProduct(id).then(r => setProduct(r.data)).catch(() => navigate('/products'));
  }, [id]);

  const handleAddCart = () => { addItem(product, qty); toast.success('Added to cart!'); };
  const handleBuyNow = () => { addItem(product, qty); navigate('/cart'); };
  
  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await addReview(id, review);
      toast.success('Review submitted!');
      const r = await getProduct(id);
      setProduct(r.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (!product) return <div className="loader">Loading...</div>;
  
  const img = product.images?.[activeImg] 
    ? getImageUrl(product.images[activeImg], product.name)
    : NO_IMAGE_PLACEHOLDER(product.name);

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <div className="product-detail">
      <div className="detail-gallery">
        <img
          className="detail-main-img"
          src={img}
          alt={product.name}
          onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_PLACEHOLDER(product.name); }}
        />
        {product.images?.length > 1 && (
          <div className="thumbnail-row">
            {product.images.map((im, i) => (
              <img 
                key={i} 
                src={getImageUrl(im, `${product.name} ${i}`)} 
                alt={`${product.name} view ${i + 1}`} 
                className={i === activeImg ? 'active' : ''} 
                onClick={() => setActiveImg(i)}
                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_PLACEHOLDER(product.name); }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="detail-info">
        <p className="detail-category">{product.category} / {product.brand}</p>
        <h1>{product.name}</h1>
        <div className="detail-rating">
          {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
          <span> ({product.numReviews} reviews)</span>
        </div>
        <div className="detail-price">
          <span className="price-big">PKR {price.toLocaleString()}</span>
          {product.discountPrice > 0 && <span className="price-striked">PKR {product.price.toLocaleString()}</span>}
        </div>
        <p className="detail-desc">{product.description}</p>

        {product.specifications?.length > 0 && (
          <table className="specs-table">
            <tbody>{product.specifications.map((s, i) => <tr key={i}><td>{s.key}</td><td>{s.value}</td></tr>)}</tbody>
          </table>
        )}

        <div className="detail-actions">
          <div className="qty-control">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
            <span>{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
          </div>
          <button className="btn-primary" onClick={handleAddCart} disabled={product.stock === 0}>Add to Cart</button>
          <button className="btn-secondary" onClick={handleBuyNow} disabled={product.stock === 0}>Buy Now</button>
        </div>
        <p className="stock-info">{product.stock > 0 ? `✅ ${product.stock} in stock` : '❌ Out of stock'}</p>
        <p className="seller-info">Sold by: {product.seller?.name}</p>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        {product.reviews?.map(r => (
          <div key={r._id} className="review-card">
            <div className="review-header">
              <strong>{r.name}</strong>
              <span>{'★'.repeat(r.rating)}</span>
            </div>
            <p>{r.comment}</p>
            <small>{new Date(r.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
        {user && (
          <form className="review-form" onSubmit={handleReview}>
            <h3>Write a Review</h3>
            <select value={review.rating} onChange={e => setReview(prev => ({ ...prev, rating: Number(e.target.value) }))}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
            </select>
            <textarea placeholder="Share your experience..." value={review.comment} onChange={e => setReview(prev => ({ ...prev, comment: e.target.value }))} required />
            <button className="btn-primary" type="submit">Submit Review</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;