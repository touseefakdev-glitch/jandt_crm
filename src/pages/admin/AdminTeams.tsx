import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Team, TeamFormInput } from '../../types';
import { TeamFormModal } from '../../components/admin/TeamFormModal';
import { UsersRound, Plus, Clock, Edit, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { getRoleBadge } from '../../utils/badges';

export const AdminTeams: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const allTeams = useMemo(() => localDb.getTeams(), [refreshKey]);
  const allUsers = useMemo(() => localDb.getUsers(), [refreshKey]);
  const allQueries = useMemo(() => localDb.getQueries(), [refreshKey]);
  const allOrders = useMemo(() => localDb.getOrders(), [refreshKey]);

  if (!currentUser) return null;

  const handleFormSubmit = (data: TeamFormInput) => {
    if (editingTeam) {
      localDb.updateTeam(editingTeam.id, data, currentUser.id);
    } else {
      localDb.createTeam(data, currentUser.id);
    }
    setIsFormModalOpen(false);
    setEditingTeam(null);
    setRefreshKey(prev => prev + 1);
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Teams & Workload"
        description="Configure team shift schedules, active roster members, and team workload summary"
        icon={<Building2 className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        actions={
          <Button variant="secondary" icon={<Plus className="w-4 h-4 text-sky-400" />} onClick={openCreateModal}>
            Create Operational Team
          </Button>
        }
      />

      {allTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allTeams.map(team => {
            const members = allUsers.filter(u => u.team_id === team.id);
            const teamOpenQueries = allQueries.filter(q => q.assigned_team_id === team.id && q.status !== 'closed' && q.status !== 'resolved').length;
            const teamPendingOrders = allOrders.filter(o => members.some(m => m.id === o.sales_agent_id) && o.current_status !== 'completed' && o.current_status !== 'cancelled').length;

            return (
              <Card key={team.id}>
                <CardHeader
                  title={team.name}
                  subtitle={
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      Shift: {team.shift_info}
                    </span>
                  }
                  icon={<UsersRound className="w-5 h-5 text-violet-600" />}
                  actions={
                    <>
                      {team.is_active ? (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2"
                        title="Edit Team Settings"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => {
                          setEditingTeam(team);
                          setIsFormModalOpen(true);
                        }}
                      />
                    </>
                  }
                />

                <CardBody className="space-y-5">
                  {team.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {team.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Roster Members</span>
                      <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{members.length}</span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                      <span className="text-[10px] font-extrabold uppercase text-amber-700 block">Open Queries</span>
                      <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{teamOpenQueries}</span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">Pending Orders</span>
                      <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{teamPendingOrders}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Team Members Roster ({members.length})</h4>

                    {members.length > 0 ? (
                      <div className="space-y-1.5">
                        {members.map(m => (
                          <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={m.full_name} size="xs" />
                              <div className="min-w-0 truncate">
                                <span className="font-bold text-slate-900">{m.full_name}</span>
                                <span className="text-slate-500 font-mono text-[10px] ml-2">{m.email}</span>
                              </div>
                            </div>
                            <Badge badge={getRoleBadge(m.role)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No users assigned to this operational team.</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<UsersRound className="w-6 h-6" />}
            title="No operational teams"
            description="Create your first operational team to configure shift schedules and roster members."
            action={
              <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
                Create Operational Team
              </Button>
            }
          />
        </Card>
      )}

      <TeamFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        teamToEdit={editingTeam}
      />
    </div>
  );
};
