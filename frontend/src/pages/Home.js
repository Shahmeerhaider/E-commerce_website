import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeatured, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';

const CATEGORY_IMAGES = {
  Men: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400',
  Women: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
  Kids: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400',
  Accessories: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400',
  Footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  Sale: 'https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?w=400',
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [f] = await Promise.all([getFeatured(), getCategories()]);
        setFeatured(f.data || []);
      } catch (e) {
        console.error(e);
        setFeatured([
          { _id: '1', name: 'Classic White Shirt', price: 29.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', category: 'Men', isFeatured: true },
          { _id: '2', name: 'Summer Floral Dress', price: 49.99, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400', category: 'Women', isFeatured: true },
          { _id: '3', name: 'Leather Sneakers', price: 79.99, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', category: 'Footwear', isFeatured: true },
          { _id: '4', name: 'Denim Jacket', price: 89.99, image: 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400', category: 'Men', isFeatured: true },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(74,93,83,0.88), rgba(74,93,83,0.72)), url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hero-content">
          <p className="hero-sub">New Collection 2026</p>
          <h1>Elevate Your Style with <span>SAS Collection</span></h1>
          <p className="hero-desc">Discover premium fashion for every occasion. Quality fabrics, timeless designs.</p>
          <div className="hero-btns">
            <Link to="/products" className="btn-secondary btn-lg">Shop Now</Link>
            <Link to="/products?isFeatured=true" className="btn-ghost btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>View Collection</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <Link to="/products">View All</Link>
        </div>
        <div className="category-grid">
          {Object.keys(CATEGORY_IMAGES).map(cat => (
            <Link to={`/products?category=${cat}`} key={cat} className="category-card category-card-img">
              <img src={CATEGORY_IMAGES[cat]} alt={cat} />
              <span className="category-label">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: 'white' }}>
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products">See All</Link>
        </div>
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : featured.length > 0 ? (
          <div className="products-grid">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Coming Soon</h3>
            <p>Our featured collection is being curated. Check back soon for amazing products.</p>
            <Link to="/products" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>Browse All Products</Link>
          </div>
        )}
      </section>

      <section
        className="promo-banner"
        style={{
          backgroundImage: `linear-gradient(rgba(20,26,23,0.6), rgba(20,26,23,0.6)), url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="promo-content">
          <h2>Get 20% Off Your First Order</h2>
          <p>Use code <strong>WELCOME20</strong> at checkout</p>
          <Link to="/register" className="btn-secondary">Sign Up & Save</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;