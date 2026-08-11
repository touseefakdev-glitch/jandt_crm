import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { ShiftHandover as ShiftHandoverType } from '../types';
import { HandoverFormModal } from '../components/handover/HandoverFormModal';
import { HandoverDetailModal } from '../components/handover/HandoverDetailModal';
import { Badge, Button, Card, CardBody, EmptyState, Input, PageHeader, Pagination, Select, Table, TBody, Td, Th, THead, Tr } from '../components/ui';
import { getHandoverStatusBadge } from '../utils/badges';
import { formatDateTime } from '../utils/format';
import { Clock, FileText, Plus, Search, Users, CheckCircle2, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const ShiftHandover: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<ShiftHandoverType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const teams = useMemo(() => localDb.getTeams(), []);

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find((t) => t.id === user.team_id) || teams[0];
  }, [user, teams]);

  const activeShift = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getCurrentShiftForTeam(userTeam.id);
  }, [userTeam, refreshKey]);

  const activeAgents = useMemo(() => {
    if (!userTeam) return [];
    return localDb.getUsers().filter((u) => u.team_id === userTeam.id && u.is_active);
  }, [userTeam]);

  const handovers = useMemo(() => {
    return localDb.getHandovers({
      status: statusFilter,
      teamId: teamFilter,
      searchTerm,
    });
  }, [statusFilter, teamFilter, searchTerm, refreshKey]);

  const latestPendingHandover = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getHandovers({ status: 'submitted' }).find((h) => h.incoming_team_id === userTeam.id) || null;
  }, [userTeam, refreshKey]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Clock className="w-5 h-5 text-brand-400" />}
        title="Shift Handover & Team Operations"
        description="Operational shift continuity management across multi-shift schedules"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsFormOpen(true)}>
            Create Shift Handover
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-card border border-slate-800 lg:col-span-2 flex flex-col justify-between space-y-4">
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
                <div className="text-xl font-extrabold text-white">{userTeam ? userTeam.name : 'Team 1'}</div>
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
              Shift Opened:{' '}
              <span className="text-white font-mono">{activeShift ? formatDateTime(activeShift.opened_at) : 'Today'}</span>
            </div>
            <div className="text-sky-300 font-medium">Overnight & Multi-Shift Flexible Configuration Active</div>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Active Team Roster</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">{activeAgents.length} Agents</span>
            </div>

            <div className="space-y-2.5 max-h-40 overflow-y-auto">
              {activeAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
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
          </CardBody>
        </Card>
      </div>

      {latestPendingHandover && (
        <div className="bg-sky-50 rounded-xl border border-sky-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-sky-900">Action Required</span>
                <span className="text-[10px] bg-sky-200 text-sky-900 font-extrabold px-2 py-0.5 rounded">
                  SUBMITTED HANDOVER READY
                </span>
              </div>
              <p className="text-xs text-sky-950 mt-0.5 font-medium">
                {latestPendingHandover.outgoing_team ? latestPendingHandover.outgoing_team.name : 'Outgoing Team'}{' '}
                submitted a shift handover with {latestPendingHandover.items ? latestPendingHandover.items.length : 0}{' '}
                flagged item(s).
              </p>
            </div>
          </div>

          <Button icon={<ArrowRight className="w-4 h-4" />} onClick={() => handleOpenDetail(latestPendingHandover)}>
            Review & Acknowledge Handover
          </Button>
        </div>
      )}

      <Card flush>
        <CardBody className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Shift Handover History & Logs</h2>
            <p className="text-xs text-slate-500">
              Immutable audit record of all past shift handovers across operational teams
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search handover summary or team notes..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Handover Statuses</option>
              <option value="submitted">Submitted (Awaiting Receipt)</option>
              <option value="acknowledged">Acknowledged</option>
            </Select>

            <Select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Operational Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
        </CardBody>

        {paginatedHandovers.length > 0 ? (
          <Table minWidth={1400}>
            <THead>
              <Tr hover={false}>
                <Th width={170}>Shift Date & Time</Th>
                <Th width={200}>Outgoing Team</Th>
                <Th width={200}>Incoming Team</Th>
                <Th width={150}>Handover Status</Th>
                <Th width={200}>Submitted By</Th>
                <Th width={200}>Acknowledged By</Th>
                <Th width={80} align="center">Items</Th>
                <Th width={150} align="right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedHandovers.map((h) => (
                <Tr key={h.id}>
                  <Td width={170} className="font-mono text-slate-600">{formatDateTime(h.created_at)}</Td>
                  <Td width={200} truncate className="font-bold text-slate-900">{h.outgoing_team ? h.outgoing_team.name : 'Team 1'}</Td>
                  <Td width={200} truncate className="font-bold text-slate-900">{h.incoming_team ? h.incoming_team.name : 'Team 2'}</Td>
                  <Td width={150}><Badge badge={getHandoverStatusBadge(h.status)} /></Td>
                  <Td width={200} truncate className="font-semibold text-slate-800">
                    {h.submitted_by_profile ? h.submitted_by_profile.full_name : 'Agent'}
                  </Td>
                  <Td width={200} truncate className="text-slate-600">
                    {h.acknowledged_by_profile ? (
                      <span className="font-semibold text-emerald-700">{h.acknowledged_by_profile.full_name}</span>
                    ) : (
                      <span className="italic text-slate-400">Pending</span>
                    )}
                  </Td>
                  <Td width={80} align="center" className="font-bold text-slate-900 font-mono">{h.items ? h.items.length : 0}</Td>
                  <Td width={150} align="right">
                    <Button size="sm" variant="outline" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => handleOpenDetail(h)}>
                      View Details
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={<FileText className="w-7 h-7" />}
            title="No Shift Handover Records"
            description="No shift handover records matched your filter query."
          />
        )}

        {handovers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={handovers.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="shift handovers"
          />
        )}
      </Card>

      <HandoverFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      <HandoverDetailModal
        handover={selectedHandover}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedHandover(null);
        }}
        onUpdate={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};
