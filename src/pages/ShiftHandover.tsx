import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { ShiftHandover as ShiftHandoverType, Shift, UserProfile } from '../types';
import { HandoverFormModal } from '../components/handover/HandoverFormModal';
import { HandoverDetailModal } from '../components/handover/HandoverDetailModal';
import { 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  CheckCheck, 
  Users, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  Package
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const ShiftHandover: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<ShiftHandoverType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Listen to real-time notification events
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const teams = useMemo(() => localDb.getTeams(), []);

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find(t => t.id === user.team_id) || teams[0];
  }, [user, teams]);

  const activeShift = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getCurrentShiftForTeam(userTeam.id);
  }, [userTeam, refreshKey]);

  // Active agents in current team
  const activeAgents = useMemo(() => {
    if (!userTeam) return [];
    return localDb.getUsers().filter(u => u.team_id === userTeam.id && u.is_active);
  }, [userTeam]);

  // Handovers list
  const handovers = useMemo(() => {
    return localDb.getHandovers({
      status: statusFilter,
      teamId: teamFilter,
      searchTerm,
    });
  }, [statusFilter, teamFilter, searchTerm, refreshKey]);

  // Latest submitted handover for user's team
  const latestPendingHandover = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getHandovers({ status: 'submitted' }).find(h => h.incoming_team_id === userTeam.id) || null;
  }, [userTeam, refreshKey]);

  // Pagination calculation
  const totalPages = Math.ceil(handovers.length / ITEMS_PER_PAGE) || 1;
  const paginatedHandovers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return handovers.slice(start, start + ITEMS_PER_PAGE);
  }, [handovers, currentPage]);

  if (!user) return null;

  const handleOpenDetail = (handover: ShiftHandoverType) => {
    setSelectedHandover(handover);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCheck className="w-3 h-3 mr-1" />
            Acknowledged
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 mr-1" />
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shift Handover & Team Operations</h1>
            <p className="text-xs text-slate-500">Operational shift continuity management across multi-shift schedules</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shift Handover</span>
          </button>
        </div>
      </div>

      {/* Current Operational Shift Card & Active Team Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Shift Summary Box */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 bg-sky-950 px-2.5 py-1 rounded border border-sky-800">
                CURRENT OPERATIONAL SHIFT
              </span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active Shift
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Assigned Operational Team</span>
                <div className="text-xl font-extrabold text-white">
                  {userTeam ? userTeam.name : 'Team 1'}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Configured Shift Schedule</span>
                <div className="text-xl font-extrabold text-sky-300 font-mono">
                  {userTeam ? userTeam.shift_info : '3 PM – 11 AM'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Shift Opened: <span className="text-white font-mono">{activeShift ? new Date(activeShift.opened_at).toLocaleString() : 'Today'}</span>
            </div>
            <div className="text-sky-300 font-medium">
              Overnight & Multi-Shift Flexible Configuration Active
            </div>
          </div>
        </div>

        {/* Active Team Agents Box */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Active Team Roster</h3>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">{activeAgents.length} Agents</span>
          </div>

          <div className="space-y-2.5 max-h-40 overflow-y-auto">
            {activeAgents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {agent.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block leading-tight">{agent.full_name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{agent.role.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Banner for Submitted Handover Awaiting Receipt */}
      {latestPendingHandover && (
        <div className="bg-sky-50 rounded-xl border border-sky-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase text-sky-900">Action Required</span>
                <span className="text-[10px] bg-sky-200 text-sky-900 font-extrabold px-2 py-0.5 rounded">SUBMITTED HANDOVER READY</span>
              </div>
              <p className="text-xs text-sky-950 mt-0.5 font-medium">
                {latestPendingHandover.outgoing_team ? latestPendingHandover.outgoing_team.name : 'Outgoing Team'} submitted a shift handover with {latestPendingHandover.items ? latestPendingHandover.items.length : 0} flagged item(s).
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenDetail(latestPendingHandover)}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center space-x-1"
          >
            <span>Review & Acknowledge Handover</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Handover History List & Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header & Controls */}
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Shift Handover History & Logs</h2>
              <p className="text-xs text-slate-500">Immutable audit record of all past shift handovers across operational teams</p>
            </div>
          </div>

          {/* Search & Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search handover summary or team notes..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">All Handover Statuses</option>
                <option value="submitted">🔵 Submitted (Awaiting Receipt)</option>
                <option value="acknowledged">🟢 Acknowledged</option>
              </select>
            </div>

            <div>
              <select
                value={teamFilter}
                onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">All Operational Teams</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Handovers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Shift Date & Time</th>
                <th className="px-5 py-3">Outgoing Team</th>
                <th className="px-5 py-3">Incoming Team</th>
                <th className="px-5 py-3">Handover Status</th>
                <th className="px-5 py-3">Submitted By</th>
                <th className="px-5 py-3">Acknowledged By</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedHandovers.length > 0 ? (
                paginatedHandovers.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {h.outgoing_team ? h.outgoing_team.name : 'Team 1'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {h.incoming_team ? h.incoming_team.name : 'Team 2'}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(h.status)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {h.submitted_by_profile ? h.submitted_by_profile.full_name : 'Agent'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {h.acknowledged_by_profile ? (
                        <span className="font-semibold text-emerald-700">{h.acknowledged_by_profile.full_name}</span>
                      ) : (
                        <span className="italic text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900 font-mono">
                      {h.items ? h.items.length : 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetail(h)}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded-lg transition-colors space-x-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400 italic">
                    No shift handover records matched your filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {handovers.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, handovers.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, handovers.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{handovers.length}</span> shift handovers
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-800 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Handover Form Modal */}
      <HandoverFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Handover Detail Modal */}
      <HandoverDetailModal
        handover={selectedHandover}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedHandover(null); }}
        onUpdate={() => setRefreshKey(prev => prev + 1)}
      />

    </div>
  );
};
