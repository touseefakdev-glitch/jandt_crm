import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Team, TeamFormInput } from '../../types';
import { TeamFormModal } from '../../components/admin/TeamFormModal';
import { 
  UsersRound, 
  Plus, 
  Clock, 
  Building2, 
  Edit, 
  CheckCircle2, 
  Users, 
  HelpCircle, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Operational Teams & Workload</h2>
          <p className="text-xs text-slate-500">Configure team shift schedules, active roster members, and team workload summary</p>
        </div>

        <button
          onClick={() => { setEditingTeam(null); setIsFormModalOpen(true); }}
          className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Create Operational Team</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allTeams.map(team => {
          const members = allUsers.filter(u => u.team_id === team.id);
          const teamOpenQueries = allQueries.filter(q => q.assigned_team_id === team.id && q.status !== 'closed' && q.status !== 'resolved').length;
          const teamPendingOrders = allOrders.filter(o => members.some(m => m.id === o.sales_agent_id) && o.current_status !== 'completed' && o.current_status !== 'cancelled').length;

          return (
            <div key={team.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                    <UsersRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
                    <span className="text-xs text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Shift: {team.shift_info}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    team.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {team.is_active ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    onClick={() => { setEditingTeam(team); setIsFormModalOpen(true); }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Team Settings"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {team.description}
                </p>
              )}

              {/* Workload Summary Metrics */}
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

              {/* Team Members List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Team Members Roster ({members.length})</span>
                </h4>

                {members.length > 0 ? (
                  <div className="space-y-1.5">
                    {members.map(m => (
                      <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center text-slate-700">
                            {m.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{m.full_name}</span>
                            <span className="text-slate-500 font-mono text-[10px] ml-2">({m.email})</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {m.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No users assigned to this operational team.</p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <TeamFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        teamToEdit={editingTeam}
      />

    </div>
  );
};
