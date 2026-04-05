import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI } from '../api/user.api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['viewer', 'analyst', 'admin'];
const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer', isActive: true };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const roleBadge = {
  admin: 'bg-purple-100 text-purple-700',
  analyst: 'bg-blue-100 text-blue-700',
  viewer: 'bg-green-100 text-green-700',
};

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', isActive: '', search: '', page: 1 });

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 15 };
      if (filters.role) params.role = filters.role;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.search) params.search = filters.search;

      const res = await getUsersAPI(params);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };

  const openEdit = (u) => {
    setSelected(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setModal('edit');
  };

  const openDelete = (u) => { setSelected(u); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await createUserAPI(form);
        toast.success('User created');
      } else {
        const payload = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
        await updateUserAPI(selected._id, payload);
        toast.success('User updated');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteUserAPI(selected._id);
      toast.success('User deleted');
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="label">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="input"
              placeholder="Name or email..."
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="input w-36"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
              className="input w-32"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="btn-primary ml-auto"
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            Users <span className="text-gray-400 font-normal">({pagination.total} total)</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 text-gray-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`badge capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="text-primary-600 hover:underline text-xs font-medium">
                          Edit
                        </button>
                        {u._id !== currentUser._id && (
                          <button onClick={() => openDelete(u)} className="text-red-500 hover:underline text-xs font-medium">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Add User' : 'Edit User'} onClose={closeModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} className="input" required minLength={2} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleFormChange} className="input" required />
            </div>
            {modal === 'create' && (
              <div>
                <label className="label">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleFormChange} className="input" required minLength={6} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select name="role" value={form.role} onChange={handleFormChange} className="input">
                  {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              {modal === 'edit' && (
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete User" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to permanently delete <strong>{selected?.name}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn-danger flex-1" disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
