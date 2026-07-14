import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/api';

const STATUS_COLORS = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getMyOrders().then(r => setOrders(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loader">Loading orders...</div>;

  return (
    <div className="page-container">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state"><h3>No orders yet</h3><Link to="/products" className="btn-primary">Start Shopping</Link></div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span>#{order._id.slice(-8).toUpperCase()}</span>
                <span style={{ color: STATUS_COLORS[order.status] }}>{order.status.toUpperCase()}</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <strong>PKR {order.totalPrice.toLocaleString()}</strong>
              </div>
              <div className="order-items">
                {order.orderItems.slice(0, 3).map((item, i) => (
                  <span key={i}>{item.name} × {item.quantity}</span>
                ))}
                {order.orderItems.length > 3 && <span>+{order.orderItems.length - 3} more</span>}
              </div>
              <div className="order-actions">
                <Link to={`/orders/${order._id}`} className="btn-ghost">View Details</Link>
                {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
