import { useState, useEffect } from 'react';
import { getDashboard, getUsers, blockUser, getPendingProducts, approveProduct, getAllOrders, getCoupons, createCoupon, toggleCoupon, deleteCoupon, getAllProducts } from '../services/api';
import { toast } from 'react-toastify';

// ---- Theme tokens (synced to src/App.css :root variables) ----
const THEME = {
  primary: '#4a5d53',      // --navy
  primaryDark: '#3d4d44',  // darker navy for contrast accents
  secondary: '#6b7d73',    // --navy-light
  accent: '#c2b2a3',       // --gold
  accentDark: '#a89484',   // darker gold for contrast accents
  cream: '#e2e4e1',        // --cream
  creamDark: '#ced4d0',    // --gray-200
  white: '#ffffff',
  textDark: '#4a5d53',     // --navy
  textMuted: '#8b9691',    // --gray-500
  border: '#ced4d0',       // --gray-200
  danger: '#a35a5a',       // --red
  dangerLight: '#b97878',
  success: '#688f7a',      // --green
  warning: '#b7893f',
};

const BACKEND_URL = "http://localhost:5000";

const getProductImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  const cleanPath = img.startsWith('/') ? img.substring(1) : img;
  const path = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  return `${BACKEND_URL}/${path}`;
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, ordersRes] = await Promise.all([
        getDashboard(),
        getAllOrders()
      ]);

      // Get dashboard stats
      const dashboardData = dashboardRes.data?.data || dashboardRes.data || {};

      // Calculate revenue from delivered orders only
      const allOrders = ordersRes.data?.data || ordersRes.data || [];
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];

      const deliveredRevenue = ordersArray
        .filter(order => order.status === 'delivered')
        .reduce((total, order) => total + (order.totalPrice || 0), 0);

      setStats({
        users: dashboardData.users || dashboardData.totalUsers || 0,
        products: dashboardData.products || dashboardData.totalProducts || 0,
        orders: dashboardData.orders || dashboardData.totalOrders || 0,
        revenue: deliveredRevenue,
        pendingRevenue: ordersArray
          .filter(order => order.status === 'pending' || order.status === 'processing')
          .reduce((total, order) => total + (order.totalPrice || 0), 0),
        totalOrders: ordersArray.length,
        deliveredOrders: ordersArray.filter(order => order.status === 'delivered').length,
        pendingOrders: ordersArray.filter(order => order.status === 'pending').length,
        processingOrders: ordersArray.filter(order => order.status === 'processing').length
      });

    } catch (err) {
      console.error('Error loading dashboard:', err);
      // Fallback: try just dashboard API
      try {
        const r = await getDashboard();
        const data = r.data?.data || r.data || {};
        setStats({
          users: data.users || 0,
          products: data.products || 0,
          orders: data.orders || 0,
          revenue: data.revenue || 0
        });
      } catch (e) {
        console.error('Complete dashboard load failed:', e);
        setStats({
          users: 0,
          products: 0,
          orders: 0,
          revenue: 0
        });
      }
    }
  };

  const loadUsers = async () => {
    try {
      const r = await getUsers();
      setUsers(Array.isArray(r.data) ? r.data : r.data?.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
      toast.error('Failed to load users');
    }
  };

  const loadPending = async () => {
    try {
      const r = await getPendingProducts();
      setPending(Array.isArray(r.data) ? r.data : r.data?.products || []);
    } catch (err) {
      console.error('Error loading pending products:', err);
      setPending([]);
      toast.error('Failed to load pending products');
    }
  };

  const loadOrders = async () => {
    try {
      const r = await getAllOrders();
      const ordersData = r.data?.data || r.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrders([]);
      toast.error('Failed to load orders');
    }
  };

  const loadCoupons = async () => {
    try {
      const r = await getCoupons();
      setCoupons(Array.isArray(r.data) ? r.data : r.data?.coupons || []);
    } catch (err) {
      console.error('Error loading coupons:', err);
      setCoupons([]);
      toast.error('Failed to load coupons');
    }
  };

  const loadProducts = async () => {
    try {
      const r = await getAllProducts();
      let productsData = [];

      if (Array.isArray(r.data)) {
        productsData = r.data;
      } else if (r.data?.data && Array.isArray(r.data.data)) {
        productsData = r.data.data;
      } else if (r.data?.products && Array.isArray(r.data.products)) {
        productsData = r.data.products;
      }

      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      toast.error('Failed to load products');
    }
  };

  const handleTab = (t) => {
    setTab(t);
    if (t === 'users') loadUsers();
    if (t === 'pending') loadPending();
    if (t === 'orders') loadOrders();
    if (t === 'coupons') loadCoupons();
    if (t === 'products') loadProducts();
    if (t === 'dashboard') loadDashboard(); // Refresh dashboard stats
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUserId = currentUser?._id || currentUser?.id;

  const handleBlock = async (id) => {
    if (id === currentUserId) {
      toast.error("You can't block your own account");
      return;
    }
    try {
      await blockUser(id);
      loadUsers();
      toast.success('User status updated!');
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveProduct(id);
      loadPending();
      toast.success('Product approved!');
    } catch (err) {
      toast.error('Failed to approve product');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await toggleCoupon(id);
      loadCoupons();
      toast.success('Coupon status updated!');
    } catch (err) {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      loadCoupons();
      toast.success('Coupon deleted!');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const product = products.find(p => p._id === id);

      if (!product) {
        toast.error('Product not found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          isFeatured: !product.isFeatured
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      toast.success(product.isFeatured ? 'Product removed from featured' : 'Product marked as featured');
      loadProducts();
    } catch (err) {
      toast.error('Error updating featured status');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await createCoupon({
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
        expiresAt: couponForm.expiresAt || undefined
      });
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
      loadCoupons();
      toast.success('Coupon created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating coupon');
    }
  };

  return (
    <div className="admin-page" style={{ background: THEME.cream, minHeight: '100vh', padding: '30px' }}>
      <h1 style={{ color: THEME.primary, letterSpacing: '0.5px', marginBottom: '25px' }}>Admin Dashboard</h1>
      <div className="admin-tabs" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: `2px solid ${THEME.border}`,
        paddingBottom: '10px',
        flexWrap: 'wrap'
      }}>
        {['dashboard', 'users', 'pending', 'products', 'orders', 'coupons'].map(t => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => handleTab(t)}
            style={{
              padding: '10px 20px',
              border: tab === t ? 'none' : `1px solid ${THEME.border}`,
              background: tab === t ? THEME.primary : THEME.white,
              color: tab === t ? THEME.white : THEME.textMuted,
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: tab === t ? '600' : '400',
              transition: 'all 0.3s ease',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div className="stat-card" style={{
              background: THEME.primary,
              color: THEME.white,
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(74,93,83,0.25)'
            }}>
              <h3 style={{ marginTop: '0', fontSize: '14px', opacity: '0.85', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Users</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{stats.users || 0}</p>
            </div>

            <div className="stat-card" style={{
              background: THEME.secondary,
              color: THEME.white,
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(107,128,115,0.25)'
            }}>
              <h3 style={{ marginTop: '0', fontSize: '14px', opacity: '0.85', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Products</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{stats.products || 0}</p>
            </div>

            <div className="stat-card" style={{
              background: THEME.accent,
              color: THEME.textDark,
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(201,168,118,0.35)'
            }}>
              <h3 style={{ marginTop: '0', fontSize: '14px', opacity: '0.75', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Orders</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{stats.orders || 0}</p>
            </div>

            <div className="stat-card" style={{
              background: THEME.primaryDark,
              color: THEME.white,
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(58,74,66,0.3)'
            }}>
              <h3 style={{ marginTop: '0', fontSize: '14px', opacity: '0.85', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Revenue (Delivered)</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
                PKR {(stats.revenue || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div className="stat-card" style={{
              background: THEME.white,
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: `1px solid ${THEME.border}`
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: THEME.textMuted, fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivered Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: THEME.success }}>
                {stats.deliveredOrders || 0}
              </p>
            </div>

            <div className="stat-card" style={{
              background: THEME.white,
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: `1px solid ${THEME.border}`
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: THEME.textMuted, fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Processing Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: THEME.accentDark }}>
                {stats.processingOrders || 0}
              </p>
            </div>

            <div className="stat-card" style={{
              background: THEME.white,
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: `1px solid ${THEME.border}`
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: THEME.textMuted, fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: THEME.warning }}>
                {stats.pendingOrders || 0}
              </p>
            </div>

            <div className="stat-card" style={{
              background: THEME.white,
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: `1px solid ${THEME.border}`
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: THEME.textMuted, fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Revenue</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: THEME.secondary }}>
                PKR {(stats.pendingRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: THEME.white,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}>
            <thead>
              <tr style={{ background: THEME.primary, color: THEME.white }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map(u => (
                <tr key={u._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '12px', color: THEME.textDark }}>{u.name}</td>
                  <td style={{ padding: '12px', color: THEME.textDark }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: u.role === 'admin' ? THEME.primary : u.role === 'seller' ? THEME.accent : THEME.secondary,
                      color: u.role === 'seller' ? THEME.textDark : THEME.white,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={u.isBlocked ? 'badge-red' : 'badge-green'} style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: u.isBlocked ? THEME.danger : THEME.success,
                      color: THEME.white,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {u._id === currentUserId ? (
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '5px',
                        background: THEME.creamDark,
                        color: THEME.textMuted,
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        This is you
                      </span>
                    ) : (
                      <button
                        className="btn-sm"
                        onClick={() => handleBlock(u._id)}
                        style={{
                          padding: '6px 14px',
                          border: 'none',
                          borderRadius: '5px',
                          background: u.isBlocked ? THEME.success : THEME.danger,
                          color: THEME.white,
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pending' && (
        <div className="pending-list" style={{
          display: 'grid',
          gap: '15px'
        }}>
          {pending.length > 0 ? pending.map(p => (
            <div key={p._id} className="pending-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              background: THEME.white,
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              border: `1px solid ${THEME.border}`
            }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: THEME.textDark }}>{p.name}</h4>
                <p style={{ margin: '0', color: THEME.textMuted }}>By: {p.seller?.name || 'Unknown'}</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: THEME.primary }}>
                  PKR {p.price?.toLocaleString()}
                </p>
              </div>
              <button
                className="btn-primary btn-sm"
                onClick={() => handleApprove(p._id)}
                style={{
                  padding: '8px 22px',
                  background: THEME.accent,
                  color: THEME.textDark,
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Approve
              </button>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
              No pending products
            </div>
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className="products-management">
          <h2 style={{ marginBottom: '20px', color: THEME.primary }}>Manage Products - Featured Status</h2>
          {!Array.isArray(products) || products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
              <p>No products found or loading...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: THEME.white,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
              }}>
                <thead>
                  <tr style={{ background: THEME.primary, color: THEME.white }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Image</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Product Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Seller</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Featured</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                      <td style={{ padding: '10px' }}>
                        {p.images && p.images[0] ? (
                          <img
                            src={getProductImageUrl(p.images[0])}
                            alt={p.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: THEME.creamDark,
                          borderRadius: '4px',
                          display: p.images && p.images[0] ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: THEME.textMuted
                        }}>
                          No img
                        </div>
                      </td>
                      <td style={{ padding: '10px', fontWeight: '500', color: THEME.textDark }}>{p.name}</td>
                      <td style={{ padding: '10px', color: THEME.textDark }}>{p.category || 'N/A'}</td>
                      <td style={{ padding: '10px', fontWeight: '600', color: THEME.textDark }}>PKR {p.price?.toLocaleString()}</td>
                      <td style={{ padding: '10px', fontSize: '14px', color: THEME.textMuted }}>{p.seller?.name || 'Unknown'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: p.isFeatured ? THEME.accent : THEME.creamDark,
                          color: p.isFeatured ? THEME.textDark : THEME.textMuted
                        }}>
                          {p.isFeatured ? 'Featured' : 'Not Featured'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button
                          onClick={() => handleToggleFeatured(p._id)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '5px',
                            border: 'none',
                            background: p.isFeatured ? THEME.danger : THEME.primary,
                            color: THEME.white,
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {p.isFeatured ? 'Remove Featured' : 'Set Featured'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '12px' }}>
            Order status is updated by the seller fulfilling the order. This view is read-only for admins.
          </p>
          <table className="admin-table" style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: THEME.white,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}>
            <thead>
              <tr style={{ background: THEME.primary, color: THEME.white }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Seller</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map(o => (
                <tr key={o._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: THEME.textDark }}>#{o._id?.slice(-6)}</td>
                  <td style={{ padding: '12px', color: THEME.textDark }}>{o.user?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px', fontWeight: '600', color: THEME.textDark }}>PKR {o.totalPrice?.toLocaleString()}</td>
                  <td style={{ padding: '12px', color: THEME.textMuted, fontSize: '14px' }}>
                    {[...new Set((o.orderItems || []).map(i => i.seller?.name || i.product?.seller?.name).filter(Boolean))].join(', ') || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background:
                        o.status === 'delivered' ? THEME.success :
                        o.status === 'processing' ? THEME.accentDark :
                        o.status === 'shipped' ? THEME.secondary :
                        o.status === 'cancelled' ? THEME.danger : THEME.warning,
                      color: THEME.white,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="coupons-section">
          <form className="coupon-form" onSubmit={handleCreateCoupon} style={{
            background: THEME.white,
            padding: '25px',
            borderRadius: '10px',
            marginBottom: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            border: `1px solid ${THEME.border}`
          }}>
            <h3 style={{ marginTop: '0', color: THEME.primary }}>Create New Coupon</h3>
            <div className="form-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <input
                placeholder="Code (e.g. SAVE10)"
                value={couponForm.code}
                onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                required
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark
                }}
              />
              <select
                value={couponForm.discountType}
                onChange={e => setCouponForm(p => ({ ...p, discountType: e.target.value }))}
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark,
                  background: THEME.white
                }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (PKR)</option>
              </select>
              <input
                type="number"
                placeholder="Discount value"
                value={couponForm.discountValue}
                onChange={e => setCouponForm(p => ({ ...p, discountValue: e.target.value }))}
                required
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark
                }}
              />
              <input
                type="number"
                placeholder="Min order (PKR)"
                value={couponForm.minOrderAmount}
                onChange={e => setCouponForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark
                }}
              />
              <input
                type="number"
                placeholder="Max uses (blank = unlimited)"
                value={couponForm.maxUses}
                onChange={e => setCouponForm(p => ({ ...p, maxUses: e.target.value }))}
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark
                }}
              />
              <input
                type="date"
                placeholder="Expires at"
                value={couponForm.expiresAt}
                onChange={e => setCouponForm(p => ({ ...p, expiresAt: e.target.value }))}
                style={{
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '5px',
                  color: THEME.textDark
                }}
              />
            </div>
            <button
              className="btn-primary btn-sm"
              type="submit"
              style={{
                padding: '10px 28px',
                background: THEME.primary,
                color: THEME.white,
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Create Coupon
            </button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: THEME.white,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <thead>
                <tr style={{ background: THEME.primary, color: THEME.white }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Value</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Min Order</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Used / Max</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Expires</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length > 0 ? coupons.map(c => (
                  <tr key={c._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: '12px', color: THEME.textDark }}><strong>{c.code}</strong></td>
                    <td style={{ padding: '12px', color: THEME.textDark }}>{c.discountType}</td>
                    <td style={{ padding: '12px', color: THEME.textDark }}>
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `PKR ${c.discountValue}`}
                    </td>
                    <td style={{ padding: '12px', color: THEME.textDark }}>
                      {c.minOrderAmount ? `PKR ${c.minOrderAmount}` : '—'}
                    </td>
                    <td style={{ padding: '12px', color: THEME.textDark }}>
                      {c.usedCount || 0} / {c.maxUses ?? '∞'}
                    </td>
                    <td style={{ padding: '12px', color: THEME.textDark }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: c.isActive ? THEME.success : THEME.danger,
                        color: THEME.white,
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        className="btn-sm"
                        onClick={() => handleToggleCoupon(c._id)}
                        style={{
                          padding: '6px 12px',
                          marginRight: '5px',
                          border: 'none',
                          borderRadius: '5px',
                          background: c.isActive ? THEME.warning : THEME.success,
                          color: THEME.white,
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleDeleteCoupon(c._id)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '5px',
                          background: THEME.danger,
                          color: THEME.white,
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
                      No coupons found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;