import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { fetchQueriesPage, fetchQueryWorkspaceStats, QueryWorkspaceStats } from '../services/queryService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useServerListQuery } from '../hooks/useServerListQuery';
import { useServerQuery } from '../hooks/useServerQuery';
import { CustomerQuery, QueryFormInput } from '../types';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { QueryAssignModal } from '../components/queries/QueryAssignModal';
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Pagination, Select, Table, TableToolbar, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getQueryPriorityBadge, getQueryStatusBadge } from '../utils/badges';
import { formatDateTime } from '../utils/format';
import { HelpCircle, Plus, Search, Inbox, User, Users, X, ShoppingBag, Package, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type WorkspaceTab = 'all' | 'my' | 'team';

export const Queries: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigningQuery, setAssigningQuery] = useState<CustomerQuery | null>(null);

  const categories = useMemo(() => localDb.getCategories(), [dbVersion]);
  const agents = useMemo(() => localDb.getUsers(), [dbVersion]);
  const teams = useMemo(() => localDb.getTeams(), [dbVersion]);

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find((t) => t.id === user.team_id) || null;
  }, [user, teams]);

  const EMPTY_STATS: QueryWorkspaceStats = {
    all: 0,
    my: 0,
    team: 0,
    myUrgent: 0,
    myHigh: 0,
    myWaiting: 0,
    myInProgress: 0,
    myResolved: 0,
    teamNew: 0,
    teamAssigned: 0,
    teamInProgress: 0,
    teamWaiting: 0,
    teamUrgent: 0,
  };

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data: workspaceStats } = useServerQuery<QueryWorkspaceStats>({
    key: JSON.stringify({ ws: activeTab, userId: user?.id, teamId: userTeam?.id }),
    fetcher: () => (user ? fetchQueryWorkspaceStats(user.id, userTeam?.id) : Promise.resolve(EMPTY_STATS)),
    localFallback: () => {
      const all = localDb.getQueries();
      const mine = user ? all.filter((q) => q.assigned_to === user.id) : [];
      const teamList = userTeam ? all.filter((q) => q.assigned_team_id === userTeam.id) : [];
      return {
        all: all.length,
        my: mine.length,
        team: teamList.length,
        myUrgent: mine.filter((q) => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length,
        myHigh: mine.filter((q) => q.priority === 'high' && q.status !== 'closed' && q.status !== 'resolved').length,
        myWaiting: mine.filter((q) => q.status === 'waiting_customer').length,
        myInProgress: mine.filter((q) => q.status === 'in_progress').length,
        myResolved: mine.filter((q) => q.status === 'resolved').length,
        teamNew: teamList.filter((q) => q.status === 'new' || q.status === 'open').length,
        teamAssigned: teamList.filter((q) => q.status === 'assigned').length,
        teamInProgress: teamList.filter((q) => q.status === 'in_progress').length,
        teamWaiting: teamList.filter((q) => q.status === 'waiting_customer').length,
        teamUrgent: teamList.filter((q) => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length,
      };
    },
  });

  const {
    data: paginatedQueries,
    total: filteredQueryCount,
    loading: queriesLoading,
  } = useServerListQuery<CustomerQuery>({
    key: JSON.stringify({
      search: debouncedSearch,
      status: statusFilter,
      priority: priorityFilter,
      category: categoryFilter,
      agent: agentFilter,
      team: teamFilter,
      tab: activeTab,
      userId: user?.id,
      userTeamId: userTeam?.id,
      page: currentPage,
    }),
    fetcher: () =>
      fetchQueriesPage({
        searchTerm: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        category_id: categoryFilter,
        assigned_to: agentFilter,
        team_id: teamFilter,
        workspace: activeTab,
        workspaceTeamId: userTeam?.id,
        userId: user?.id,
        page: currentPage,
      }),
    localFallback: () => {
      let result = localDb.getQueries();
      if (activeTab === 'my' && user) {
        result = result.filter((q) => q.assigned_to === user.id);
      } else if (activeTab === 'team' && userTeam) {
        result = result.filter((q) => q.assigned_team_id === userTeam.id);
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'open') {
          result = result.filter((q) => ['new', 'open', 'assigned'].includes(q.status));
        } else {
          result = result.filter((q) => q.status === statusFilter);
        }
      }
      if (priorityFilter !== 'all') result = result.filter((q) => q.priority === priorityFilter);
      if (categoryFilter !== 'all') result = result.filter((q) => q.category_id === categoryFilter);
      if (agentFilter !== 'all') result = result.filter((q) => q.assigned_to === agentFilter);
      if (teamFilter !== 'all') result = result.filter((q) => q.assigned_team_id === teamFilter);

      if (debouncedSearch.trim()) {
        const s = debouncedSearch.toLowerCase().trim();
        result = result.filter(
          (query) =>
            query.query_number.toLowerCase().includes(s) ||
            query.subject.toLowerCase().includes(s) ||
            query.description.toLowerCase().includes(s) ||
            (query.customer && (query.customer.company_name.toLowerCase().includes(s) || query.customer.customer_code.toLowerCase().includes(s))) ||
            (query.order && query.order.order_number.toLowerCase().includes(s)) ||
            (query.product && query.product.sku.toLowerCase().includes(s)) ||
            (query.assigned_to_profile && query.assigned_to_profile.full_name.toLowerCase().includes(s))
        );
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return { data: result.slice(start, start + ITEMS_PER_PAGE), total: result.length };
    },
  });

  const myUrgentCount = workspaceStats?.myUrgent ?? 0;
  const myHighCount = workspaceStats?.myHigh ?? 0;
  const myWaitingCount = workspaceStats?.myWaiting ?? 0;
  const myInProgressCount = workspaceStats?.myInProgress ?? 0;
  const myResolvedCount = workspaceStats?.myResolved ?? 0;

  const teamNewCount = workspaceStats?.teamNew ?? 0;
  const teamAssignedCount = workspaceStats?.teamAssigned ?? 0;
  const teamInProgressCount = workspaceStats?.teamInProgress ?? 0;
  const teamWaitingCount = workspaceStats?.teamWaiting ?? 0;
  const teamUrgentCount = workspaceStats?.teamUrgent ?? 0;

  const totalPages = Math.ceil(filteredQueryCount / ITEMS_PER_PAGE) || 1;

  if (!user) return null;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setAgentFilter('all');
    setTeamFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || agentFilter !== 'all' || teamFilter !== 'all';

  const handleCreateQuery = (data: QueryFormInput) => {
    setIsSubmitting(true);
    try {
      const created = localDb.createQuery(data, user.id);
      setIsCreateModalOpen(false);
      toast({ type: 'success', title: 'Support ticket created', message: `${created.query_number} has been created.` });
      navigate(`/queries/${created.id}`);
    } catch {
      toast({ type: 'error', title: 'Creation failed', message: 'Unable to create the support ticket.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = (queryId: string, assignedToUserId: string | null) => {
    try {
      localDb.assignQuery(queryId, assignedToUserId, user.id);
      setAssigningQuery(null);
      toast({ type: 'success', title: 'Ticket assigned', message: 'Support ticket assignment updated.' });
    } catch {
      toast({ type: 'error', title: 'Assignment failed', message: 'Unable to update the assignment.' });
    }
  };

  const workloadCards =
    activeTab === 'my'
      ? [
          { label: 'Urgent', value: myUrgentCount, className: 'text-red-600', dot: 'bg-red-500' },
          { label: 'High Priority', value: myHighCount, className: 'text-amber-600', dot: 'bg-amber-500' },
          { label: 'Waiting Customer', value: myWaitingCount, className: 'text-amber-600', dot: 'bg-amber-400' },
          { label: 'In Progress', value: myInProgressCount, className: 'text-sky-600', dot: 'bg-sky-500' },
          { label: 'Resolved', value: myResolvedCount, className: 'text-emerald-600', dot: 'bg-emerald-500' },
        ]
      : activeTab === 'team'
        ? [
            { label: 'New Unassigned', value: teamNewCount, className: 'text-sky-600', dot: 'bg-sky-500' },
            { label: 'Assigned', value: teamAssignedCount, className: 'text-violet-600', dot: 'bg-violet-500' },
            { label: 'In Progress', value: teamInProgressCount, className: 'text-blue-600', dot: 'bg-blue-500' },
            { label: 'Waiting Customer', value: teamWaitingCount, className: 'text-amber-600', dot: 'bg-amber-400' },
            { label: 'Urgent Items', value: teamUrgentCount, className: 'text-red-600', dot: 'bg-red-500' },
          ]
        : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HelpCircle className="w-5 h-5 text-brand-400" />}
        title="Support Ticket System"
        description="Record, track, assign, resolve, and audit customer inquiries and support tickets"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            New Support Ticket
          </Button>
        }
      />

      <TableToolbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs
              size="md"
              tabs={[
                { value: 'all' as const, label: (<span className="flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5" /> All Tickets</span>), count: workspaceStats?.all ?? 0 },
                { value: 'my' as const, label: (<span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> My Queries</span>), count: workspaceStats?.my ?? 0 },
                ...(userTeam
                  ? [{ value: 'team' as const, label: (<span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {userTeam.name}</span>), count: workspaceStats?.team ?? 0 }]
                  : []),
              ]}
              active={activeTab}
              onChange={(value) => {
                setActiveTab(value);
                setCurrentPage(1);
              }}
            />
            {myUrgentCount > 0 && activeTab === 'my' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                {myUrgentCount} urgent
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">
              <X className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          )}
        </div>

        {workloadCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-[#F5F7FA] rounded-[12px] border border-slate-200 mb-3">
            {workloadCards.map((card) => (
              <div key={card.label} className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-xs">
                <span className={`text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 ${card.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
                  {card.label}
                </span>
                <span className="text-xl font-extrabold text-slate-900 block mt-1 tabular-nums">{card.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search query #, customer, subject, order #, SKU..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />
            {queriesLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 animate-pulse">
                Loading…
              </span>
            )}
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Ticket Statuses</option>
            <option value="open">Active Open Queue (New / Assigned)</option>
            <option value="new">New (Unassigned)</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed Archive</option>
            <option value="reopened">Reopened</option>
          </Select>
          <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Priority Levels</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Normal Priority</option>
            <option value="low">Low Priority</option>
          </Select>
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Issue Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Select value={agentFilter} onChange={(e) => { setAgentFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </Select>
        </div>
      </TableToolbar>

      <Card flush>
        {paginatedQueries.length > 0 ? (
          <Table minWidth={1300}>
            <THead>
              <Tr hover={false}>
                <Th width={130}>Query Number</Th>
                <Th width={220}>Customer Account</Th>
                <Th width={320}>Subject & Related Entity</Th>
                <Th width={110}>Priority</Th>
                <Th width={130}>Status</Th>
                <Th width={160}>Assigned Agent</Th>
                <Th width={140}>Last Updated</Th>
                <Th width={90} align="right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedQueries.map((query) => (
                <Tr key={query.id}>
                  <Td width={130} className="font-mono font-bold text-brand-700">
                    <Link to={`/queries/${query.id}`} className="hover:underline">{query.query_number}</Link>
                  </Td>
                  <Td width={220} truncate>
                    {query.customer ? (
                      <div>
                        <Link to={`/customers/${query.customer.id}`} className="font-bold text-slate-900 hover:text-brand-600 block truncate">{query.customer.company_name}</Link>
                        <span className="font-mono text-[10px] text-slate-500">{query.customer.customer_code}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unknown Customer</span>
                    )}
                  </Td>
                  <Td width={320} truncate maxWidth={320}>
                    <div className="font-semibold text-slate-900 truncate" title={query.subject}>{query.subject}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {query.category && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{query.category.name}</span>
                      )}
                      {query.order && (
                        <Link to={`/orders/${query.order.id}`} className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-semibold px-1.5 py-0.5 rounded border border-emerald-200 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap">
                          <ShoppingBag className="w-2.5 h-2.5" /> {query.order.order_number}
                        </Link>
                      )}
                      {query.product && (
                        <Link to={`/products/${query.product.id}`} className="text-[10px] bg-purple-50 text-purple-800 font-mono font-semibold px-1.5 py-0.5 rounded border border-purple-200 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap">
                          <Package className="w-2.5 h-2.5" /> {query.product.sku}
                        </Link>
                      )}
                    </div>
                  </Td>
                  <Td width={110}><Badge badge={getQueryPriorityBadge(query.priority)} /></Td>
                  <Td width={130}><Badge badge={getQueryStatusBadge(query.status)} /></Td>
                  <Td width={160} truncate maxWidth={160}>
                    {query.assigned_to_profile ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <Avatar name={query.assigned_to_profile.full_name} size="xs" />
                        <span className="truncate">{query.assigned_to_profile.full_name}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setAssigningQuery(query)}
                        className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition-colors whitespace-nowrap"
                      >
                        + Assign Agent
                      </button>
                    )}
                  </Td>
                  <Td width={140} className="font-mono text-slate-500">{formatDateTime(query.updated_at)}</Td>
                  <Td width={90} align="right">
                    <Link
                      to={`/queries/${query.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded-lg transition-colors"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={<Inbox className="w-7 h-7" />}
            title="No support tickets found"
            description={
              hasActiveFilters
                ? 'No support tickets matched your active workspace filter query.'
                : 'Get started by creating a new support ticket.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Search & Filters
                </Button>
              ) : (
                <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCreateModalOpen(true)}>
                  Create First Ticket
                </Button>
              )
            }
          />
        )}

        {filteredQueryCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQueryCount}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
          />
        )}
      </Card>

      <QueryFormModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateQuery} isSubmitting={isSubmitting} />

      <QueryAssignModal isOpen={!!assigningQuery} onClose={() => setAssigningQuery(null)} onSubmit={handleAssignSubmit} query={assigningQuery} />
    </div>
  );
};
