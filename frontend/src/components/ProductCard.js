// components/ProductCard.jsx
import { Link } from 'react-router-dom';

// Same backend origin used across ProductDetail / SellerDashboard.
// (Previously this file used process.env.REACT_APP_API_URL, which is
// never set anywhere in this project, so relative image paths resolved
// against the frontend's own origin instead of the backend and 404'd.)
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Self-contained placeholder (no external network dependency —
// via.placeholder.com has been unreliable, so a broken real image
// plus a broken placeholder was showing as a blank box with no text).
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getFullImageUrl = (imgUrl) => {
  if (!imgUrl || typeof imgUrl !== 'string') return null;
  // Already a complete URL (http/https) or a base64 data URI — use as-is.
  if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
  // Otherwise treat it as a server-relative upload path.
  const cleanPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
  const path = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  return `${BACKEND_URL}/${path}`;
};

const ProductCard = ({ product }) => {
  // Check if product has image property
  const imageUrl = product.image || product.images?.[0] || product.imageUrl || product.thumbnail;

  const fullImageUrl = getFullImageUrl(imageUrl) || NO_IMAGE_PLACEHOLDER;

  return (
    <div className="product-card" style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          width: '100%',
          height: '300px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
          position: 'relative'
        }}>
          <img 
            src={fullImageUrl} 
            alt={product.name || product.title || 'Product'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = NO_IMAGE_PLACEHOLDER;
            }}
          />
          {product.isFeatured && (
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              backgroundColor: '#e94560',
              color: '#ffffff',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}>
              Featured
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1a1a2e',
            marginBottom: '10px',
            lineHeight: '1.4'
          }}>
            {product.name || product.title || 'Unnamed Product'}
          </h3>
          
          {product.category && (
            <p style={{
              color: '#666',
              fontSize: '0.9rem',
              marginBottom: '10px'
            }}>
              {product.category}
            </p>
          )}
          
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              color: '#e94560'
            }}>
              PKR.{product.price?.toFixed(2) || '0.00'}
            </span>
            
            {product.rating && (
              <span style={{
                color: '#f59e0b',
                fontSize: '0.9rem'
              }}>
                ★ {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;