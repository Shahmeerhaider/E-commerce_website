import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { loginUser } = useAuth();

  useEffect(() => {
    getProfile().then(r => setForm({ name: r.data.name, email: r.data.email, phone: r.data.phone || '', password: '' }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(form);
      loginUser(res.data);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div className="page-container">
      <h1>My Profile</h1>
      <div className="profile-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="form-group"><label>New Password (leave blank to keep)</label><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
          <button className="btn-primary" type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
