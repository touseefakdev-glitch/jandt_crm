import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { UserProfile, UserRole, UserFormInput } from '../../types';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { UserDeactivateModal } from '../../components/admin/UserDeactivateModal';
import { Users, Plus, Search, Eye, Edit, UserX, UserCheck, Building2, UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { getRoleBadge } from '../../utils/badges';
import { formatDate } from '../../utils/format';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
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
        toast({ type: 'success', message: `User ${data.full_name} updated successfully.` });
      } else {
        const created = localDb.createUser(data, currentUser.id);
        toast({ type: 'success', message: `User account created for ${created.full_name}. Invitation sent.` });
      }
      setIsFormModalOpen(false);
      setEditingUser(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Error saving user account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = (userId: string) => {
    try {
      localDb.setUserActiveStatus(userId, false, currentUser.id);
      setDeactivatingUser(null);
      setRefreshKey(prev => prev + 1);
      toast({ type: 'success', message: 'User account deactivated. Historical records preserved.' });
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Error deactivating user.' });
    }
  };

  const handleActivateUser = (u: UserProfile) => {
    try {
      localDb.setUserActiveStatus(u.id, true, currentUser.id);
      setRefreshKey(prev => prev + 1);
      toast({ type: 'success', message: `User account for ${u.full_name} activated.` });
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Error activating user.' });
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Roster Management"
        description="Create, edit, activate, deactivate, and assign team roles for CRM users"
        icon={<Users className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        actions={
          <Button variant="secondary" icon={<Plus className="w-4 h-4 text-sky-400" />} onClick={openCreateModal}>
            Create New User Account
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by user name or email..."
          icon={<Search className="w-4 h-4" />}
          className="lg:col-span-1"
        />

        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">System Admin</option>
          <option value="sales_agent">Sales Agent</option>
          <option value="support_agent">Support Agent</option>
        </Select>

        <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="all">All Operational Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Account Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <THead>
            <Tr hover={false}>
              <Th>Full Name & Email</Th>
              <Th>Role</Th>
              <Th>Operational Team</Th>
              <Th>Status</Th>
              <Th>Created Date</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0">
                        <Link to={`/admin/users/${u.id}`} className="font-bold text-slate-900 hover:text-brand-600 block">
                          {u.full_name}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-500">{u.email}</span>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <Badge badge={getRoleBadge(u.role)} />
                  </Td>

                  <Td>
                    {u.team ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {u.team.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No Team</span>
                    )}
                  </Td>

                  <Td>
                    {u.is_active ? (
                      <Badge
                        badge={{
                          subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                          solid: 'bg-emerald-600 text-white',
                          dot: 'bg-emerald-500',
                          label: 'Active',
                        }}
                      />
                    ) : (
                      <Badge
                        badge={{
                          subtle: 'bg-red-50 text-red-700 ring-red-200',
                          solid: 'bg-red-600 text-white',
                          dot: 'bg-red-500',
                          label: 'Inactive',
                        }}
                      />
                    )}
                  </Td>

                  <Td className="font-mono text-xs text-slate-500">{formatDate(u.created_at)}</Td>

                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/admin/users/${u.id}`}
                        title="View Full User Profile"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-violet-600 hover:bg-violet-50 px-2"
                        title="Edit User Details & Role"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => {
                          setEditingUser(u);
                          setIsFormModalOpen(true);
                        }}
                      />

                      {u.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 px-2"
                          title="Deactivate Account"
                          icon={<UserX className="w-4 h-4" />}
                          onClick={() => setDeactivatingUser(u)}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 px-2"
                          title="Activate Account"
                          icon={<UserCheck className="w-4 h-4" />}
                          onClick={() => handleActivateUser(u)}
                        />
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr hover={false}>
                <Td colSpan={6} className="p-0">
                  <EmptyState
                    icon={<UserPlus className="w-6 h-6" />}
                    title="No users found"
                    description="No users matched your filter criteria. Try adjusting the filters or create a new user account."
                    action={
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
                        Create New User Account
                      </Button>
                    }
                  />
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>

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
