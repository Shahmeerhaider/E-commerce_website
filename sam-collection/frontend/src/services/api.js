import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    if (error.response?.status === 401) {
      const publicRoutes = ['/auth/login', '/auth/register'];
      const isPublic = publicRoutes.some((r) =>
        error.config?.url?.includes(r)
      );
      if (!isPublic) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    error.message = message;
    return Promise.reject(error);
  }
);

// Auth
export const register      = (data) => API.post('/auth/register', data);
export const login         = (data) => API.post('/auth/login', data);
export const getProfile    = ()     => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Products
export const getProducts    = (params) => API.get('/products', { params });
export const getProduct     = (id)     => API.get(`/products/${id}`);
export const getFeatured    = ()       => API.get('/products/featured');
export const getCategories  = ()       => API.get('/products/categories');
export const getMyProducts  = ()       => API.get('/products/my');
export const getAllProducts = (params) => API.get('/products', { params });
export const createProduct  = (data)     => API.post('/products', data);
export const updateProduct  = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct  = (id)       => API.delete(`/products/${id}`);
export const addReview      = (id, data) => API.post(`/products/${id}/reviews`, data);
export const toggleFeatured = (id)       => API.patch(`/products/${id}/featured`);

// Orders
export const createOrder       = (data)     => API.post('/orders', data);
export const getMyOrders       = ()         => API.get('/orders/myorders');
export const getOrder          = (id)       => API.get(`/orders/${id}`);
export const payOrder          = (id, data) => API.put(`/orders/${id}/pay`, data);
export const getAllOrders      = ()         => API.get('/orders');
export const getSellerOrders   = ()         => API.get('/orders/seller');
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data);

// Cart
export const getCart        = ()         => API.get('/cart');
export const addToCart      = (data)     => API.post('/cart', data);
export const updateCartItem = (id, data) => API.put(`/cart/${id}`, data);
export const removeFromCart = (id)       => API.delete(`/cart/${id}`);
export const clearCart      = ()         => API.delete('/cart');

// Wishlist
export const getWishlist    = ()   => API.get('/wishlist');
export const toggleWishlist = (id) => API.post(`/wishlist/${id}`);

// Coupons
export const applyCoupon  = (data) => API.post('/coupons/apply', data);
export const getCoupons   = ()     => API.get('/coupons');
export const createCoupon = (data) => API.post('/coupons', data);
export const toggleCoupon = (id)   => API.put(`/coupons/${id}/toggle`);
export const deleteCoupon = (id)   => API.delete(`/coupons/${id}`);

// Admin
export const getDashboard       = ()   => API.get('/admin/dashboard');
export const getUsers           = ()   => API.get('/admin/users');
export const blockUser          = (id) => API.put(`/admin/users/${id}/block`);
export const getPendingProducts = ()   => API.get('/admin/products/pending');
export const approveProduct     = (id) => API.put(`/admin/products/${id}/approve`);

export default API;