import { useState, useEffect, useRef } from 'react';
import { getMyProducts, createProduct, updateProduct, deleteProduct, getSellerOrders, updateOrderStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const THEME = {
  primary: '#4a5d53',
  primaryDark: '#3a4a42',
  secondary: '#6b8073',
  accent: '#c9a876',
  accentDark: '#b8935f',
  cream: '#f5f3ee',
  creamDark: '#ece8df',
  white: '#ffffff',
  textDark: '#2d3a34',
  textMuted: '#6b6b62',
  border: '#e0ddd3',
  danger: '#a8544a',
  success: '#5c8a6a',
  warning: '#c98f4a',
};

const EMPTY_FORM = {
  name: '', description: '', price: '', discountPrice: '',
  category: '', stock: '', brand: '', images: [],
};

const MAX_IMAGE_DIMENSION = 1400;
const IMAGE_QUALITY = 0.8;

const SellerDashboard = () => {
  const [products,  setProducts]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [tab,       setTab]       = useState('dashboard');
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [previews,  setPreviews]  = useState([]);   // { file, url } for new local files
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [urlInput,  setUrlInput]  = useState('');
  const [showUrl,   setShowUrl]   = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const BACKEND_URL = "http://localhost:5000";

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string' && image.startsWith('http')) return image;
    if (typeof image === 'string' && image.startsWith('data:')) return image; // base64
    if (typeof image === 'string') {
      const cleanPath = image.startsWith('/') ? image.substring(1) : image;
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    }
    return null;
  };

  const load = () => getMyProducts().then(r => setProducts(r.data.products));
  const loadOrders = () => {
    getSellerOrders()
      .then(r => setOrders(r.data?.orders || r.data || []))
      .catch(() => setOrders([]));
  };

  useEffect(() => { load(); loadOrders(); }, []);

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status });
      toast.success('Order status updated');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const totalOrders = orders.length;
  const totalSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const pendingPct = totalOrders ? Math.round((pendingCount / totalOrders) * 100) : 0;
  const shippedPct = totalOrders ? Math.round((shippedCount / totalOrders) * 100) : 0;
  const statusCounts = [
    { label: 'Pending', count: pendingCount, color: THEME.warning },
    { label: 'Processing', count: processingCount, color: THEME.accentDark },
    { label: 'Shipped', count: shippedCount, color: THEME.secondary },
    { label: 'Delivered', count: deliveredCount, color: THEME.success },
  ];
  const maxStatusCount = Math.max(1, ...statusCounts.map(s => s.count));
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // ── Image helpers ──────────────────────────────────────────────────────────

  // Resize + re-encode an image file down to a manageable base64 string.
  // This is the key fix: without this, a handful of phone photos can push
  // the request payload well past your backend's body-size limit, and the
  // whole "attach images" step fails silently.
  const compressImageFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
            height = MAX_IMAGE_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      };
      img.onerror = () => reject(new Error('Could not read image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  const processFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    const oversized = imageFiles.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      oversized.forEach(f => toast.error(`${f.name} is too large. Max 5MB per image.`));
    }
    const validFiles = imageFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (!validFiles.length) return;

    setProcessingImages(true);
    try {
      for (const file of validFiles) {
        const compressedUrl = await compressImageFile(file);
        setPreviews(prev => [...prev, { file, url: compressedUrl }]);
        setForm(prev => ({ ...prev, images: [...prev.images, compressedUrl] }));
      }
    } catch (err) {
      toast.error('One or more images could not be processed');
    } finally {
      setProcessingImages(false);
    }
  };

  const onFileInput = (e) => {
    processFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) { toast.error('Please enter a valid URL'); return; }
    if (form.images.includes(url)) { toast.error('Image already added'); return; }
    setForm(prev => ({ ...prev, images: [...prev.images, url] }));
    setUrlInput('');
    setShowUrl(false);
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= form.images.length) return;
    const imgs = [...form.images];
    [imgs[index], imgs[to]] = [imgs[to], imgs[index]];
    setForm(prev => ({ ...prev, images: imgs }));
  };

  // ── Form submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }

    setUploading(true);
    try {
      const payload = {
        ...form,
        price:         Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock:         Number(form.stock),
        // images array contains compressed base64 strings or URLs
        // your backend should handle saving them (Cloudinary, S3, disk, etc.)
        images: form.images,
      };

      if (editId) {
        await updateProduct(editId, payload);
        toast.success('Product updated!');
      } else {
        await createProduct(payload);
        toast.success('Product submitted for admin approval!');
      }

      resetForm();
      setTab('products');
      load();
    } catch (err) {
      const status = err.response?.status;
      if (status === 413) {
        toast.error('Images are too large for the server to accept. Try fewer images or smaller photos.');
      } else if (!err.response) {
        toast.error('Could not reach the server. Check your connection and try again.');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPreviews([]);
    setEditId(null);
    setUrlInput('');
    setShowUrl(false);
  };

  const handleEdit = (p) => {
    setForm({
      name:          p.name,
      description:   p.description,
      price:         p.price,
      discountPrice: p.discountPrice || '',
      category:      p.category,
      stock:         p.stock,
      brand:         p.brand || '',
      images:        p.images || [],
    });
    setPreviews([]);   // existing images come from URLs, no local previews
    setEditId(p._id);
    setTab('add');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      load();
      toast.success('Product deleted');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page" style={{ background: THEME.cream, minHeight: '100vh', padding: '30px', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <h1 style={{ color: THEME.primary, letterSpacing: '0.5px', marginBottom: '25px' }}>Seller Dashboard</h1>

      <div className="admin-tabs" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: `2px solid ${THEME.border}`,
        paddingBottom: '10px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'products', label: 'My Products' },
          { key: 'orders', label: 'Orders' },
        ].map(t => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => { setTab(t.key); if (t.key === 'orders') loadOrders(); }}
            style={{
              padding: '10px 20px',
              border: tab === t.key ? 'none' : `1px solid ${THEME.border}`,
              background: tab === t.key ? THEME.primary : THEME.white,
              color: tab === t.key ? THEME.white : THEME.textMuted,
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: tab === t.key ? '600' : '400',
              transition: 'all 0.3s ease'
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          className={tab === 'add' ? 'active' : ''}
          onClick={() => { resetForm(); setTab('add'); }}
          style={{
            padding: '10px 20px',
            border: tab === 'add' ? 'none' : `1px solid ${THEME.border}`,
            background: tab === 'add' ? THEME.primary : THEME.white,
            color: tab === 'add' ? THEME.white : THEME.textMuted,
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: tab === 'add' ? '600' : '400',
            transition: 'all 0.3s ease'
          }}
        >
          + Add Product
        </button>
      </div>

      {tab === 'dashboard' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div style={{ background: THEME.primary, color: THEME.white, padding: '22px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(74,93,83,0.25)' }}>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</p>
              <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 'bold' }}>{totalOrders}</p>
            </div>
            <div style={{ background: THEME.accent, color: THEME.textDark, padding: '22px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(201,168,118,0.35)' }}>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales (Delivered)</p>
              <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 'bold' }}>PKR {totalSales.toLocaleString()}</p>
            </div>
            <div style={{ background: THEME.secondary, color: THEME.white, padding: '22px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(107,128,115,0.25)' }}>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</p>
              <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 'bold' }}>{products.length}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div style={{ background: THEME.white, padding: '22px', borderRadius: '10px', border: `1px solid ${THEME.border}` }}>
              <h3 style={{ margin: '0 0 18px', color: THEME.primary, fontSize: '16px' }}>Order Summary</h3>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: THEME.textDark, fontWeight: '600', fontSize: '14px' }}>Pending Orders</span>
                  <span style={{ color: THEME.textMuted, fontSize: '13px' }}>{pendingCount}/{totalOrders} orders</span>
                </div>
                <div style={{ background: THEME.creamDark, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pendingPct}%`, background: THEME.warning, height: '100%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: THEME.textDark, fontWeight: '600', fontSize: '14px' }}>Shipped Orders</span>
                  <span style={{ color: THEME.textMuted, fontSize: '13px' }}>{shippedCount}/{totalOrders} orders</span>
                </div>
                <div style={{ background: THEME.creamDark, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${shippedPct}%`, background: THEME.secondary, height: '100%' }} />
                </div>
              </div>
            </div>

            <div style={{ background: THEME.white, padding: '22px', borderRadius: '10px', border: `1px solid ${THEME.border}` }}>
              <h3 style={{ margin: '0 0 18px', color: THEME.primary, fontSize: '16px' }}>Orders by Status</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '120px' }}>
                {statusCounts.map(s => (
                  <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '4px' }}>{s.count}</span>
                    <div style={{
                      width: '100%',
                      height: `${Math.max(6, (s.count / maxStatusCount) * 90)}px`,
                      background: s.color,
                      borderRadius: '4px 4px 0 0'
                    }} />
                    <span style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '6px' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: THEME.white, padding: '22px', borderRadius: '10px', border: `1px solid ${THEME.border}` }}>
            <h3 style={{ margin: '0 0 16px', color: THEME.primary, fontSize: '16px' }}>Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <p style={{ color: THEME.textMuted, textAlign: 'center', padding: '20px 0' }}>No orders yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: THEME.textMuted, fontSize: '13px', fontWeight: '600' }}>Order</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: THEME.textMuted, fontSize: '13px', fontWeight: '600' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: THEME.textMuted, fontSize: '13px', fontWeight: '600' }}>Total</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: THEME.textMuted, fontSize: '13px', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: THEME.textDark }}>#{o._id?.slice(-6)}</td>
                      <td style={{ padding: '10px 8px', color: THEME.textDark }}>{o.user?.name || 'Unknown'}</td>
                      <td style={{ padding: '10px 8px', color: THEME.textDark, fontWeight: '600' }}>PKR {o.totalPrice?.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: THEME.white,
                          background:
                            o.status === 'delivered' ? THEME.success :
                            o.status === 'processing' ? THEME.accentDark :
                            o.status === 'shipped' ? THEME.secondary :
                            o.status === 'cancelled' ? THEME.danger : THEME.warning
                        }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', background: THEME.white, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <thead>
              <tr style={{ background: THEME.primary, color: THEME.white }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map(o => (
                <tr key={o._id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: THEME.textDark }}>#{o._id?.slice(-6)}</td>
                  <td style={{ padding: '12px', color: THEME.textDark }}>{o.user?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px', fontWeight: '600', color: THEME.textDark }}>PKR {o.totalPrice?.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: THEME.white,
                      background:
                        o.status === 'delivered' ? THEME.success :
                        o.status === 'processing' ? THEME.accentDark :
                        o.status === 'shipped' ? THEME.secondary :
                        o.status === 'cancelled' ? THEME.danger : THEME.warning
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      value={o.status}
                      onChange={(e) => handleOrderStatusChange(o._id, e.target.value)}
                      disabled={o.status === 'delivered' || o.status === 'cancelled'}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${THEME.border}`,
                        cursor: o.status === 'delivered' || o.status === 'cancelled' ? 'not-allowed' : 'pointer',
                        color: THEME.textDark,
                        background: THEME.white
                      }}
                    >
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0] ? (
                    <img
                      src={getImageUrl(p.images[0]) || 'https://via.placeholder.com/48x60?text=No+Image'}
                      alt={p.name}
                      style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 60, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#999', borderRadius: 4 }}>
                      No image
                    </div>
                  )}
                </td>
                <td>{p.name}</td>
                <td>PKR {p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <span className={p.isApproved ? 'badge-green' : 'badge-yellow'}>
                    {p.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button className="btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                  No products yet. Click "+ Add Product" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ── Add / Edit Form ────────────────────────────────────────────────── */}
      {tab === 'add' && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>

          {/* Basic fields */}
          {['name', 'brand', 'category'].map(f => (
            <input
              key={f}
              placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]}
              onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
              required={f !== 'brand'}
            />
          ))}

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            required
            rows={3}
          />

          <div className="form-row">
            <input type="number" placeholder="Price (PKR)" value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
            <input type="number" placeholder="Discount Price (optional)" value={form.discountPrice}
              onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))} />
            <input type="number" placeholder="Stock" value={form.stock}
              onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} required />
          </div>

          {/* ── IMAGE UPLOAD SECTION ──────────────────────────────────────── */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Product Images <span style={{ color: 'red' }}>*</span>
              <span style={{ fontWeight: 400, color: '#888', marginLeft: 6 }}>(at least 1 required)</span>
            </label>

            {/* Drop zone */}
            <div
              onDragEnter={e => { e.preventDefault(); setDragging(true); }}
              onDragOver={e  => { e.preventDefault(); setDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setDragging(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#c47878' : '#e4cfa0'}`,
                borderRadius: 8,
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#fff5f5' : '#fdfaf4',
                transition: 'all 0.2s',
                marginBottom: '0.75rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileInput}
              />
              <p style={{ margin: 0, fontWeight: 600, color: '#3a3535', fontSize: '0.9rem' }}>
                {processingImages ? 'Processing images...' : dragging ? 'Drop images here' : 'Drag & drop images here'}
              </p>
              <p style={{ margin: '0.25rem 0 0.75rem', color: '#888', fontSize: '0.8rem' }}>
                PNG, JPG, WEBP — max 5 MB each
              </p>
              <button
                type="button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0.45rem 1.25rem',
                  background: '#2a2424', color: '#fdfaf4',
                  border: 'none', borderRadius: 4,
                  fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', pointerEvents: 'none',
                }}
              >
                Attach Files
              </button>
            </div>

            {/* Add by URL toggle */}
            {!showUrl ? (
              <button
                type="button"
                onClick={() => setShowUrl(true)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Or add image by URL
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: '0.5rem' }}>
                <input
                  autoFocus
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                  placeholder="https://example.com/photo.jpg"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', border: '1px solid #e4cfa0', borderRadius: 4, fontSize: '0.85rem' }}
                />
                <button type="button" onClick={addImageUrl} className="btn-sm">Add</button>
                <button type="button" onClick={() => { setShowUrl(false); setUrlInput(''); }} className="btn-sm">✕</button>
              </div>
            )}

            {/* Image previews grid */}
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, marginTop: '0.75rem' }}>
                {form.images.map((url, i) => (
                  <div
                    key={i}
                    style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: i === 0 ? '2px solid #d4a840' : '1px solid #e4cfa0', background: '#f5f0e8' }}
                  >
                    {/* Image */}
                    <img
                      src={url}
                      alt={`Product ${i + 1}`}
                      style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />

                    {/* Main badge */}
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', top: 4, left: 4,
                        background: '#2a2424', color: '#fdfaf4',
                        fontSize: '0.55rem', fontWeight: 700,
                        padding: '2px 5px', letterSpacing: '0.08em', textTransform: 'uppercase',
                      }}>
                        Main
                      </span>
                    )}

                    {/* Controls overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(26,22,22,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      {/* Move left */}
                      {i > 0 && (
                        <button type="button" onClick={() => moveImage(i, -1)}
                          style={iconBtnStyle} title="Move left">←</button>
                      )}
                      {/* Remove */}
                      <button type="button" onClick={() => removeImage(i)}
                        style={{ ...iconBtnStyle, background: 'rgba(220,38,38,0.8)' }} title="Remove">✕</button>
                      {/* Move right */}
                      {i < form.images.length - 1 && (
                        <button type="button" onClick={() => moveImage(i, 1)}
                          style={iconBtnStyle} title="Move right">→</button>
                      )}
                    </div>

                    {/* Index */}
                    <span style={{
                      position: 'absolute', bottom: 3, right: 3,
                      background: 'rgba(26,22,22,0.7)', color: '#fdfaf4',
                      fontSize: '0.6rem', padding: '1px 4px', borderRadius: 2,
                    }}>
                      {i + 1}/{form.images.length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {form.images.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.4rem' }}>
                First image is the main photo. Hover to reorder or remove.
              </p>
            )}

            {form.images.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: '#c47878', marginTop: '0.4rem' }}>
                Please add at least one image before submitting
              </p>
            )}
          </div>
          {/* ── END IMAGE SECTION ─────────────────────────────────────────── */}

          {/* Submit buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem' }}>
            <button
              className="btn-primary"
              type="submit"
              disabled={uploading || processingImages || form.images.length === 0}
              style={{ opacity: uploading || processingImages || form.images.length === 0 ? 0.6 : 1 }}
            >
              {uploading
                ? 'Submitting…'
                : editId ? 'Update Product' : 'Submit for Approval'
              }
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => { resetForm(); setTab('products'); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SellerDashboard;

// ── Shared inline style for image control buttons ──────────────────────────
const iconBtnStyle = {
  width: 26, height: 26, borderRadius: '50%',
  border: 'none', background: 'rgba(255,255,255,0.2)',
  color: '#fff', fontSize: '0.75rem', fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};