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
import { Card } from '../../components/ui/Card';
import { TableToolbar } from '../../components/ui/TableToolbar';
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

      <TableToolbar>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
      </TableToolbar>

      <Card flush className="p-3 md:p-0">
        {filteredUsers.length > 0 ? (
          <>
            {/* Mobile View User Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0">
                        <Link to={`/admin/users/${u.id}`} className="font-extrabold text-sm text-slate-900 hover:text-brand-600 block truncate">
                          {u.full_name}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-500 block truncate">{u.email}</span>
                      </div>
                    </div>
                    <Badge badge={getRoleBadge(u.role)} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {u.team?.name || 'No Team'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-violet-600 hover:bg-violet-50 px-2 min-h-[38px]"
                      title="Edit User Details & Role"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => {
                        setEditingUser(u);
                        setIsFormModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>

                    {u.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 px-2 min-h-[38px]"
                        title="Deactivate Account"
                        icon={<UserX className="w-4 h-4" />}
                        onClick={() => setDeactivatingUser(u)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 px-2 min-h-[38px]"
                        title="Activate Account"
                        icon={<UserCheck className="w-4 h-4" />}
                        onClick={() => handleActivateUser(u)}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block">
              <Table minWidth={1030}>
                <THead>
                  <Tr hover={false}>
                    <Th width={260}>Full Name & Email</Th>
                    <Th width={130}>Role</Th>
                    <Th width={220}>Operational Team</Th>
                    <Th width={130}>Status</Th>
                    <Th width={150}>Created Date</Th>
                    <Th width={140} align="right">Actions</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredUsers.map((u) => (
                    <Tr key={u.id}>
                      <Td width={260} truncate maxWidth={260}>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} size="sm" />
                          <div className="min-w-0">
                            <Link to={`/admin/users/${u.id}`} className="font-bold text-slate-900 hover:text-brand-600 block truncate">
                              {u.full_name}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </Td>

                      <Td width={130}>
                        <Badge badge={getRoleBadge(u.role)} />
                      </Td>

                      <Td width={220} truncate maxWidth={220}>
                        {u.team ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {u.team.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Team</span>
                        )}
                      </Td>

                      <Td width={130}>
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

                      <Td width={150} className="font-mono text-xs text-slate-500">{formatDate(u.created_at)}</Td>

                      <Td width={140} align="right" className="whitespace-nowrap">
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
                  ))}
                </TBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No users found.</p>
          </div>
        )}
      </Card>

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
