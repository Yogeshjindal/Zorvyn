import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getTransactionsAPI,
  createTransactionAPI,
  updateTransactionAPI,
  deleteTransactionAPI,
} from '../api/transaction.api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'salary','freelance','investment','business','gift',
  'food','housing','transport','utilities','healthcare',
  'education','entertainment','shopping','travel','insurance','savings','other',
];

const EMPTY_FORM = { amount: '', type: 'expense', category: 'food', date: '', notes: '' };
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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

export default function Transactions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '', page: 1 });

  // Modal state
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.page = filters.page;
      params.limit = 15;

      const res = await getTransactionsAPI(params);
      setTransactions(res.data.data.transactions);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
    setModal('create');
  };

  const openEdit = (tx) => {
    setSelected(tx);
    setForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: new Date(tx.date).toISOString().split('T')[0],
      notes: tx.notes || '',
    });
    setModal('edit');
  };

  const openDelete = (tx) => {
    setSelected(tx);
    setModal('delete');
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await createTransactionAPI(form);
        toast.success('Transaction created');
      } else {
        await updateTransactionAPI(selected._id, form);
        toast.success('Transaction updated');
      }
      closeModal();
      fetchTransactions();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.response?.data?.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTransactionAPI(selected._id);
      toast.success('Transaction deleted');
      closeModal();
      fetchTransactions();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const setPage = (p) => setFilters((f) => ({ ...f, page: p }));
  const resetFilters = () => setFilters({ type: '', category: '', startDate: '', endDate: '', page: 1 });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="input w-32"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="input w-40"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="input w-36"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="input w-36"
            />
          </div>
          <button onClick={resetFilters} className="btn-secondary">Reset</button>

          {isAdmin && (
            <button onClick={openCreate} className="btn-primary ml-auto">
              + Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">
            Transactions
            <span className="ml-2 text-gray-400 font-normal">({pagination.total} total)</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Type', 'Category', 'Notes', 'Amount', 'Created By', isAdmin ? 'Actions' : ''].filter(Boolean).map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50 group">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge capitalize ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-gray-700">{tx.category}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{tx.notes || '—'}</td>
                    <td className={`py-3 px-4 font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{tx.createdBy?.name || '—'}</td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(tx)}
                            className="text-primary-600 hover:underline text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDelete(tx)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(pagination.page + 1)}
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
        <Modal title={modal === 'create' ? 'Add Transaction' : 'Edit Transaction'} onClose={closeModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} className="input">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleFormChange} className="input">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                className="input resize-none"
                rows={2}
                maxLength={500}
                placeholder="Add a note..."
              />
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

      {/* Delete confirmation modal */}
      {modal === 'delete' && (
        <Modal title="Delete Transaction" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this{' '}
            <strong className={selected?.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
              {selected?.type}
            </strong>{' '}
            of <strong>{fmt(selected?.amount)}</strong>? This action cannot be undone.
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
