import { useState, useEffect } from 'react';
import { getDashboard, getUsers, blockUser, getPendingProducts, approveProduct, getAllOrders, getCoupons, createCoupon, toggleCoupon, deleteCoupon, getAllProducts } from '../services/api';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getProductImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  const cleanPath = img.startsWith('/') ? img.substring(1) : img;
  const path = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  return `${BACKEND_URL}/${path}`;
};

const statusBadgeClass = (status) => {
  if (status === 'delivered') return 'badge-green';
  if (status === 'processing') return 'badge-gold';
  if (status === 'shipped') return 'badge-navy';
  if (status === 'cancelled') return 'badge-red';
  return 'badge-yellow';
};

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-navy';
  if (role === 'seller') return 'badge-gold';
  return 'badge-muted';
};

const initials = (name) => (name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u2302' },
  { key: 'users', label: 'Users', icon: '\u25A4' },
  { key: 'pending', label: 'Pending', icon: '\u23F3' },
  { key: 'products', label: 'Products', icon: '\u25A6' },
  { key: 'orders', label: 'Orders', icon: '\u25A3' },
  { key: 'coupons', label: 'Coupons', icon: '\u2731' },
];

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
      const [dashboardRes, ordersRes, usersRes] = await Promise.all([
        getDashboard(),
        getAllOrders(),
        getUsers().catch(() => ({ data: [] }))
      ]);

      const dashboardData = dashboardRes.data?.data || dashboardRes.data || {};
      const allOrders = ordersRes.data?.data || ordersRes.data || [];
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || [];

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
        processingOrders: ordersArray.filter(order => order.status === 'processing').length,
        shippedOrders: ordersArray.filter(order => order.status === 'shipped').length,
      });

      setOrders(ordersArray);
      setUsers(allUsers);

    } catch (err) {
      console.error('Error loading dashboard:', err);
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
    if (t === 'dashboard') loadDashboard();
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

  const statusCounts = [
    { label: 'Pending', count: stats.pendingOrders || 0 },
    { label: 'Processing', count: stats.processingOrders || 0 },
    { label: 'Shipped', count: stats.shippedOrders || 0 },
    { label: 'Delivered', count: stats.deliveredOrders || 0 },
  ];
  const maxStatusCount = Math.max(1, ...statusCounts.map(s => s.count));
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">SAS <span>Admin</span></div>
        <nav className="dash-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={tab === item.key ? 'active' : ''}
              onClick={() => handleTab(item.key)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="dash-sidebar-footer">
          <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}>
            <span className="dash-nav-icon">{'\u2190'}</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <div className="dash-topbar">
          <div className="dash-topbar-search">Search or type a command</div>
          <div className="dash-topbar-actions">
            <div className="dash-avatar">{initials(currentUser?.name)}</div>
          </div>
        </div>

        <div className="dash-content">
          {tab === 'dashboard' && (
            <>
              <h1>Dashboard</h1>
              <p className="dash-content-sub">Overview of your marketplace</p>

              <div className="overview-row">
                <div className="overview-pill">
                  <div>
                    <div className="overview-pill-label">Total Users</div>
                    <div className="overview-pill-value">{stats.users || 0}</div>
                  </div>
                  <span className="overview-badge">Live</span>
                </div>
                <div className="overview-pill">
                  <div>
                    <div className="overview-pill-label">Revenue (Delivered)</div>
                    <div className="overview-pill-value">PKR {(stats.revenue || 0).toLocaleString()}</div>
                  </div>
                  <span className="overview-badge">{stats.deliveredOrders || 0} orders</span>
                </div>
                <div className="overview-pill">
                  <div>
                    <div className="overview-pill-label">Total Products</div>
                    <div className="overview-pill-value">{stats.products || 0}</div>
                  </div>
                </div>
                <div className="overview-pill">
                  <div>
                    <div className="overview-pill-label">Pending Revenue</div>
                    <div className="overview-pill-value">PKR {(stats.pendingRevenue || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {recentUsers.length > 0 && (
                <div className="avatar-row">
                  {recentUsers.map(u => (
                    <div className="avatar-item" key={u._id}>
                      <div className="avatar-circle">{initials(u.name)}</div>
                      <span>{u.name?.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="dash-grid">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3>Orders by Status</h3>
                  </div>
                  <div className="bar-chart-row">
                    {statusCounts.map(s => (
                      <div key={s.label} className="bar-chart-col">
                        <div className="bar-chart-bar" style={{ height: `${Math.max(6, (s.count / maxStatusCount) * 140)}px` }} />
                        <span className="bar-chart-label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="side-panel">
                    <h3>Recent Orders</h3>
                    {recentOrders.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>No orders yet</p>
                    ) : recentOrders.map(o => (
                      <div className="side-list-item" key={o._id}>
                        <span>{o.user?.name || 'Unknown'}</span>
                        <strong>PKR {o.totalPrice?.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="side-panel">
                    <h3>Quick Stats</h3>
                    <div className="side-list-item"><span>Pending Orders</span><strong className="text-warning">{stats.pendingOrders || 0}</strong></div>
                    <div className="side-list-item"><span>Processing</span><strong>{stats.processingOrders || 0}</strong></div>
                    <div className="side-list-item"><span>Delivered</span><strong className="text-success">{stats.deliveredOrders || 0}</strong></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <h1>Users</h1>
              <p className="dash-content-sub">Manage all registered accounts</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={roleBadgeClass(u.role)}>{u.role}</span></td>
                        <td><span className={u.isBlocked ? 'badge-red' : 'badge-green'}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                        <td>
                          {u._id === currentUserId ? (
                            <span className="badge-muted">This is you</span>
                          ) : (
                            <button
                              className={`btn-sm ${u.isBlocked ? '' : 'btn-danger'}`}
                              onClick={() => handleBlock(u._id)}
                            >
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'pending' && (
            <>
              <h1>Pending Products</h1>
              <p className="dash-content-sub">Review and approve new listings</p>
              <div className="pending-list">
                {pending.length > 0 ? pending.map(p => (
                  <div key={p._id} className="pending-card">
                    <div>
                      <h4>{p.name}</h4>
                      <p className="text-muted">By: {p.seller?.name || 'Unknown'}</p>
                      <p className="text-navy" style={{ fontWeight: 'bold' }}>PKR {p.price?.toLocaleString()}</p>
                    </div>
                    <button className="btn-secondary btn-sm" onClick={() => handleApprove(p._id)}>Approve</button>
                  </div>
                )) : (
                  <div className="empty-state"><p>No pending products</p></div>
                )}
              </div>
            </>
          )}

          {tab === 'products' && (
            <>
              <h1>Products</h1>
              <p className="dash-content-sub">Manage featured status across the marketplace</p>
              {!Array.isArray(products) || products.length === 0 ? (
                <div className="empty-state"><p>No products found or loading...</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Seller</th>
                        <th>Featured</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                              {p.images && p.images[0] ? (
                                <img
                                  src={getProductImageUrl(p.images[0])}
                                  alt={p.name}
                                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }}
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div style={{
                                width: '48px', height: '48px', background: 'var(--gray-100)', borderRadius: 'var(--radius)',
                                display: p.images && p.images[0] ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', color: 'var(--gray-500)', position: p.images && p.images[0] ? 'absolute' : 'static', top: 0, left: 0
                              }}>
                                No img
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: '500' }}>{p.name}</td>
                          <td>{p.category || 'N/A'}</td>
                          <td style={{ fontWeight: '600' }}>PKR {p.price?.toLocaleString()}</td>
                          <td className="text-muted">{p.seller?.name || 'Unknown'}</td>
                          <td><span className={p.isFeatured ? 'badge-gold' : 'badge-muted'}>{p.isFeatured ? 'Featured' : 'Not Featured'}</span></td>
                          <td>
                            <button
                              className={`btn-sm ${p.isFeatured ? 'btn-danger' : ''}`}
                              onClick={() => handleToggleFeatured(p._id)}
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
            </>
          )}

          {tab === 'orders' && (
            <>
              <h1>Orders</h1>
              <p className="dash-content-sub">Order status is updated by the seller fulfilling the order. This view is read-only for admins.</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Seller</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? orders.map(o => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'monospace' }}>#{o._id?.slice(-6)}</td>
                        <td>{o.user?.name || 'Unknown'}</td>
                        <td style={{ fontWeight: '600' }}>PKR {o.totalPrice?.toLocaleString()}</td>
                        <td className="text-muted">
                          {[...new Set((o.orderItems || []).map(i => i.seller?.name || i.product?.seller?.name).filter(Boolean))].join(', ') || '—'}
                        </td>
                        <td><span className={statusBadgeClass(o.status)}>{o.status}</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'coupons' && (
            <>
              <h1>Coupons</h1>
              <p className="dash-content-sub">Create and manage discount codes</p>
              <form className="product-form" onSubmit={handleCreateCoupon} style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>Create New Coupon</h3>
                <div className="form-row">
                  <input
                    placeholder="Code (e.g. SAVE10)"
                    value={couponForm.code}
                    onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    required
                  />
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm(p => ({ ...p, discountType: e.target.value }))}
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
                  />
                  <input
                    type="number"
                    placeholder="Min order (PKR)"
                    value={couponForm.minOrderAmount}
                    onChange={e => setCouponForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Max uses (blank = unlimited)"
                    value={couponForm.maxUses}
                    onChange={e => setCouponForm(p => ({ ...p, maxUses: e.target.value }))}
                  />
                  <input
                    type="date"
                    placeholder="Expires at"
                    value={couponForm.expiresAt}
                    onChange={e => setCouponForm(p => ({ ...p, expiresAt: e.target.value }))}
                  />
                </div>
                <button className="btn-primary btn-sm" type="submit">Create Coupon</button>
              </form>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Min Order</th>
                      <th>Used / Max</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length > 0 ? coupons.map(c => (
                      <tr key={c._id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.discountType}</td>
                        <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `PKR ${c.discountValue}`}</td>
                        <td>{c.minOrderAmount ? `PKR ${c.minOrderAmount}` : '—'}</td>
                        <td>{c.usedCount || 0} / {c.maxUses ?? '∞'}</td>
                        <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                        <td><span className={c.isActive ? 'badge-green' : 'badge-red'}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-sm" onClick={() => handleToggleCoupon(c._id)}>{c.isActive ? 'Disable' : 'Enable'}</button>
                            <button className="btn-sm btn-danger" onClick={() => handleDeleteCoupon(c._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                          No coupons found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;