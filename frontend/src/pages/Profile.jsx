import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateMeAPI, changePasswordAPI } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

const roleBadge = {
  admin: 'bg-purple-100 text-purple-700',
  analyst: 'bg-blue-100 text-blue-700',
  viewer: 'bg-green-100 text-green-700',
};

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePwdChange = (e) => setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateMeAPI(profileForm);
      updateUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPwd(true);
    try {
      await changePasswordAPI({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile info card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold text-white uppercase">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge capitalize ${roleBadge[user?.role]}`}>{user?.role}</span>
              <span className={`badge ${user?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 mb-4">Update Profile</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              className="input"
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              className="input"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
        <form onSubmit={handlePwdSave} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={pwdForm.currentPassword}
              onChange={handlePwdChange}
              className="input"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={pwdForm.newPassword}
              onChange={handlePwdChange}
              className="input"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={pwdForm.confirmPassword}
              onChange={handlePwdChange}
              className="input"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPwd}>
            {savingPwd ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">User ID</dt>
            <dd className="font-mono text-gray-700 text-xs">{user?._id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Member since</dt>
            <dd className="text-gray-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd className="capitalize text-gray-700">{user?.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
