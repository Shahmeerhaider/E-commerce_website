import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  
  // Use URLSearchParams to handle the redirect path safely
  const queryParams = new URLSearchParams(search);
  const redirect = queryParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    setLoading(true);

    try {
      const res = await login(form);
      
      // CRITICAL: Check your console to see if 'res.data' contains the user directly 
      // or if it's inside 'res.data.user'
      console.log('Login Response:', res.data);

      // We pass the data to context (adjust res.data based on your API structure)
      loginUser(res.data); 
      
      toast.success('Welcome back!');
      navigate(redirect);
    } catch (err) {
      console.error('Login Error:', err);
      const errorMsg = err.response?.data?.message || 'Invalid email or password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-sub">Sign in to your SAS Collection account</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            name="email" // Added name attribute for better handling
            placeholder="Email Address" 
            value={form.email} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            required 
          />
          <button 
            className="btn-primary btn-full" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;