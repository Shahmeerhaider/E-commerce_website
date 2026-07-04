import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrder } from '../services/api';

const BACKEND_URL = "http://localhost:5000";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='9' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getItemImageUrl = (img) => {
  if (!img || typeof img !== 'string') return NO_IMAGE_PLACEHOLDER;
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  const cleanPath = img.startsWith('/') ? img.substring(1) : img;
  const path = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  return `${BACKEND_URL}/${path}`;
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => { getOrder(id).then(r => setOrder(r.data)); }, [id]);
  if (!order) return <div className="loader">Loading...</div>;

  return (
    <div className="page-container">
      <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
      <div className="order-detail-grid">
        <div>
          <h3>Items</h3>
          {order.orderItems.map((item, i) => (
            <div key={i} className="order-detail-item">
              <img
                src={getItemImageUrl(item.image)}
                alt={item.name}
                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_PLACEHOLDER; }}
              />
              <span>{item.name}</span><span>× {item.quantity}</span>
              <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div>
          <h3>Shipping Address</h3>
          <p>{order.shippingAddress.street}<br />{order.shippingAddress.city}, {order.shippingAddress.state}<br />{order.shippingAddress.country}</p>
          <h3>Payment</h3>
          <p>Method: {order.paymentMethod}<br />Status: {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Not Paid'}</p>
          <h3>Summary</h3>
          <p>Items: PKR {order.itemsPrice?.toLocaleString()}</p>
          <p>Shipping: PKR {order.shippingPrice?.toLocaleString()}</p>
          <p>Tax: PKR {order.taxPrice?.toLocaleString()}</p>
          <p><strong>Total: PKR {order.totalPrice?.toLocaleString()}</strong></p>
          <p>Status: <strong>{order.status}</strong></p>
          {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;