import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeatured, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [f, c] = await Promise.all([getFeatured(), getCategories()]);
        setFeatured(f.data || []);
        setCategories(c.data || []);
      } catch (e) { 
        console.error(e);
        setFeatured([
          {
            _id: '1',
            name: 'Classic White Shirt',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            category: 'Men',
            isFeatured: true
          },
          {
            _id: '2',
            name: 'Summer Floral Dress',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
            category: 'Women',
            isFeatured: true
          },
          {
            _id: '3',
            name: 'Leather Sneakers',
            price: 79.99,
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
            category: 'Footwear',
            isFeatured: true
          },
          {
            _id: '4',
            name: 'Denim Jacket',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400',
            category: 'Men',
            isFeatured: true
          }
        ]);
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const colors = {
    navy: '#4a5d53',
    gold: '#c2b2a3',
    cream: '#e2e4e1', 
    white: '#ffffff',
    grayText: '#8b9691' 
  };

  return (
    <div className="home">
      {}
      <section className="hero" style={{
        background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600') center/cover no-repeat`,
        padding: '80px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '80vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="hero-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${colors.navy}dd 0%, ${colors.navy}88 100%)`,
          zIndex: 0
        }}></div>
        <div className="hero-content" style={{
          color: '#ffffff',
          maxWidth: '600px',
          zIndex: 1
        }}>
          <p className="hero-sub" style={{
            color: colors.gold,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '15px',
            fontWeight: '600'
          }}>New Collection 2026</p>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            marginBottom: '20px',
            lineHeight: '1.2',
            color: '#ffffff'
          }}>Elevate Your Style with <span style={{
            color: colors.gold,
            WebkitTextFillColor: 'initial',
            background: 'none'
          }}>SAS Collection</span></h1>
          <p className="hero-desc" style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '30px'
          }}>Discover premium fashion for every occasion. Quality fabrics, timeless designs.</p>
          <div className="hero-btns" style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <Link to="/products" className="btn-primary btn-lg" style={{
              background: colors.gold,
              color: colors.navy,
              padding: '12px 30px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>Shop Now</Link>
            <Link to="/products?isFeatured=true" className="btn-ghost btn-lg" style={{
              background: 'transparent',
              color: '#ffffff',
              padding: '12px 30px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: '600',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>View Collection</Link>
          </div>
        </div>
      </section>

      {}
      <section className="section" style={{
        padding: '80px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: colors.cream
      }}>
        <div className="section-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: colors.navy,
            margin: '0'
          }}>Shop by Category</h2>
          <Link to="/products" style={{
            color: colors.navy,
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>View All →</Link>
        </div>
        <div className="category-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {['Men', 'Women', 'Kids', 'Accessories', 'Footwear', 'Sale'].map(cat => (
            <Link to={`/products?category=${cat}`} key={cat} className="category-card" style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              aspectRatio: '1',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}>
              <div className="category-icon" style={{ width: '100%', height: '100%' }}>
                <img 
                  src={
                    cat === 'Men' ? 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400' : 
                    cat === 'Women' ? 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400' : 
                    cat === 'Kids' ? 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400' : 
                    cat === 'Accessories' ? 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400' : 
                    cat === 'Footwear' ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' : 
                    'https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?w=400'
                  } 
                  alt={cat}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '15px',
                background: 'linear-gradient(to top, rgba(74, 93, 83, 0.9), transparent)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '1.1rem',
                textAlign: 'center'
              }}>{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {}
      <section className="section" style={{
        padding: '80px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: colors.white
      }}>
        <div className="section-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: colors.navy,
            margin: '0'
          }}>Featured Products</h2>
          <Link to="/products" style={{
            color: colors.gold,
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>See All →</Link>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f0f0f0',
              borderTopColor: colors.gold,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            Loading...
          </div>
        ) : (
          <div className="products-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {featured.length > 0 ? (
              featured.map(p => <ProductCard key={p._id} product={p} />)
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#666' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🛍️</div>
                <h3 style={{ color: colors.navy, marginBottom: '10px' }}>Coming Soon!</h3>
                <p>Our featured collection is being curated. Check back soon for amazing products!</p>
                <Link to="/products" style={{
                  display: 'inline-block',
                  marginTop: '20px',
                  padding: '10px 25px',
                  background: colors.gold,
                  color: colors.navy,
                  textDecoration: 'none',
                  borderRadius: '25px',
                  fontWeight: '600'
                }}>Browse All Products</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {}
      <section className="promo-banner" style={{
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600') center/cover no-repeat`,
        color: '#ffffff',
        textAlign: 'center',
        padding: '80px 40px',
        position: 'relative'
      }}>
        <div className="promo-content" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '15px'
          }}>Get 20% Off Your First Order</h2>
          <p style={{
            fontSize: '1.2rem',
            color: colors.cream,
            marginBottom: '30px'
          }}>Use code <strong style={{
            backgroundColor: colors.gold,
            padding: '4px 12px',
            borderRadius: '6px',
            color: colors.navy,
            fontWeight: '700'
          }}>WELCOME20</strong> at checkout</p>
          <Link to="/register" className="btn-primary" style={{
            background: colors.gold,
            color: colors.navy,
            padding: '12px 30px',
            borderRadius: '25px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'inline-block'
          }}>Sign Up & Save</Link>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .section { padding: 60px 20px !important; }
          h1 { font-size: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;