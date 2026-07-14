import { useState, useEffect } from 'react';
import { getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { getWishlist().then(r => setItems(r.data)); }, []);

  return (
    <div className="page-container">
      <h1>My Wishlist ({items.length})</h1>
      {items.length === 0 ? <p>Your wishlist is empty.</p> : (
        <div className="products-grid">{items.map(p => <ProductCard key={p._id} product={p} />)}</div>
      )}
    </div>
  );
};

export default Wishlist;
