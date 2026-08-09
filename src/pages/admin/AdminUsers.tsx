import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { UserProfile, UserRole, UserFormInput } from '../../types';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { UserDeactivateModal } from '../../components/admin/UserDeactivateModal';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Eye, 
  Edit, 
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const allUsers = useMemo(() => localDb.getUsers(), [refreshKey]);
  const teams = useMemo(() => localDb.getTeams(), []);

  const filteredUsers = useMemo(() => {
    let list = allUsers;

    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    if (teamFilter !== 'all') {
      list = list.filter(u => u.team_id === teamFilter);
    }
    if (statusFilter !== 'all') {
      const active = statusFilter === 'active';
      list = list.filter(u => u.is_active === active);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allUsers, roleFilter, teamFilter, statusFilter, searchTerm]);

  if (!currentUser) return null;

  const handleFormSubmit = (data: UserFormInput) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        localDb.updateUser(editingUser.id, data, currentUser.id);
        setToast({ type: 'success', message: `User ${data.full_name} updated successfully.` });
      } else {
        const created = localDb.createUser(data, currentUser.id);
        setToast({ type: 'success', message: `User account created for ${created.full_name}. Invitation sent.` });
      }
      setIsFormModalOpen(false);
      setEditingUser(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error saving user account.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleConfirmDeactivate = (userId: string) => {
    try {
      localDb.setUserActiveStatus(userId, false, currentUser.id);
      setDeactivatingUser(null);
      setRefreshKey(prev => prev + 1);
      setToast({ type: 'success', message: 'User account deactivated. Historical records preserved.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error deactivating user.' });
    }
    setTimeout(() => setToast(null), 3500);
  };

  const handleActivateUser = (u: UserProfile) => {
    try {
      localDb.setUserActiveStatus(u.id, true, currentUser.id);
      setRefreshKey(prev => prev + 1);
      setToast({ type: 'success', message: `User account for ${u.full_name} activated.` });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error activating user.' });
    }
    setTimeout(() => setToast(null), 3500);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales_agent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'support_agent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm animate-in fade-in duration-200 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">User Roster Management</h2>
          <p className="text-xs text-slate-500">Create, edit, activate, deactivate, and assign team roles for CRM users</p>
        </div>

        <button
          onClick={() => { setEditingUser(null); setIsFormModalOpen(true); }}
          className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Create New User Account</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">System Admin</option>
            <option value="sales_agent">Sales Agent</option>
            <option value="support_agent">Support Agent</option>
          </select>
        </div>

        <div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Operational Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Full Name & Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Operational Team</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 font-mono">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* User Name & Email */}
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/users/${u.id}`} className="font-bold text-slate-900 hover:text-sky-600 block text-sm">
                        {u.full_name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-500">{u.email}</span>
                    </td>

                    {/* Role Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(u.role)}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Operational Team */}
                    <td className="px-5 py-3.5 font-medium">
                      {u.team ? (
                        <div className="flex items-center space-x-1 text-slate-800 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.team.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Team</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      {u.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        title="View Full User Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => { setEditingUser(u); setIsFormModalOpen(true); }}
                        className="inline-flex items-center p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Edit User Details & Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {u.is_active ? (
                        <button
                          onClick={() => setDeactivatingUser(u)}
                          className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deactivate Account"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(u)}
                          className="inline-flex items-center p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Activate Account"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                    No users matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        userToEdit={editingUser}
        isSubmitting={isSubmitting}
      />

      <UserDeactivateModal
        isOpen={!!deactivatingUser}
        user={deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onConfirmDeactivate={handleConfirmDeactivate}
      />

    </div>
  );
};
