import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);

  const [filters, setFilters] = useState({
    keyword: params.get('keyword') || '',
    category: params.get('category') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([getProducts(filters), getCategories()]);
        setProducts(p.data.products || []);
        setTotal(p.data.total || 0);
        setPages(p.data.pages || 1);
        setCategories(c.data || []);
      } catch (e) { 
        console.error('Error loading products:', e);
        setProducts([]);
        setTotal(0);
        setPages(1);
      }
      setLoading(false);
    };
    load();
  }, [filters]);

  const updateFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val, page: 1 }));

  return (
    <div className="products-page" style={{
      display: 'flex',
      gap: '30px',
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <aside className="filters-sidebar" style={{
        width: '280px',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
        height: 'fit-content',
        position: 'sticky',
        top: '20px'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1a1a2e',
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #f0f0f0'
        }}>Filters</h3>
        
        <div className="filter-group" style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#1a1a2e',
            fontSize: '0.9rem'
          }}>Category</label>
          <select 
            value={filters.category} 
            onChange={e => updateFilter('category', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              color: '#1a1a2e',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#1a1a2e',
            fontSize: '0.9rem'
          }}>Price Range</label>
          <div className="price-inputs" style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              placeholder="Min" 
              value={filters.minPrice} 
              onChange={e => updateFilter('minPrice', e.target.value)} 
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa',
                fontSize: '0.9rem'
              }}
            />
            <input 
              type="number" 
              placeholder="Max" 
              value={filters.maxPrice} 
              onChange={e => updateFilter('maxPrice', e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        <div className="filter-group" style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#1a1a2e',
            fontSize: '0.9rem'
          }}>Sort By</label>
          <select 
            value={filters.sort} 
            onChange={e => updateFilter('sort', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              color: '#1a1a2e',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="rating">Best Rating</option>
          </select>
        </div>

        <button 
          className="btn-ghost" 
          onClick={() => setFilters({ keyword: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 })}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            color: '#e94560',
            border: '2px solid #e94560',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e94560';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#e94560';
          }}
        >
          Clear Filters
        </button>
      </aside>

      <main className="products-main" style={{
        flex: 1
      }}>
        <div className="products-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
        }}>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            margin: 0,
            fontWeight: '500'
          }}>{total} products found</p>
          <input 
            className="search-input" 
            value={filters.keyword} 
            onChange={e => updateFilter('keyword', e.target.value)} 
            placeholder="Search products..." 
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              fontSize: '0.9rem',
              minWidth: '300px',
              outline: 'none'
            }}
          />
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f0f0f0',
              borderTopColor: '#e94560',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#666' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
            <h3 style={{ color: '#1a1a2e', marginBottom: '10px' }}>No products found</h3>
            <p style={{ color: '#666' }}>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="products-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '25px'
            }}>
              {products.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
            
            {pages > 1 && (
              <div className="pagination" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '40px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
              }}>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={filters.page === 1}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
                    opacity: filters.page === 1 ? 0.5 : 1
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(pg => (
                  <button 
                    key={pg} 
                    className={pg === filters.page ? 'active' : ''} 
                    onClick={() => setFilters(prev => ({ ...prev, page: pg }))}
                    style={{
                      padding: '10px 20px',
                      border: pg === filters.page ? '2px solid #e94560' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: pg === filters.page ? '#e94560' : '#ffffff',
                      color: pg === filters.page ? '#ffffff' : '#1a1a2e',
                      fontWeight: pg === filters.page ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {pg}
                  </button>
                ))}
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={filters.page === pages}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: filters.page === pages ? 'not-allowed' : 'pointer',
                    opacity: filters.page === pages ? 0.5 : 1
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .products-page {
            flex-direction: column;
            padding: 20px !important;
          }
          
          .filters-sidebar {
            width: 100% !important;
            position: static !important;
          }
          
          .search-input {
            min-width: 200px !important;
          }
        }
        
        @media (max-width: 640px) {
          .products-header {
            flex-direction: column;
            gap: 15px;
          }
          
          .search-input {
            width: 100%;
          }
          
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;