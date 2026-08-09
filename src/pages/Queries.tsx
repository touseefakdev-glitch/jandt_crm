import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { CustomerQuery, QueryStatus, QueryPriority, QueryFormInput } from '../types';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ArrowRight,
  User,
  ShieldCheck,
  AlertTriangle,
  Users,
  ShoppingBag,
  Package,
  Layers,
  Inbox
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Queries: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  // Tab State: 'all' | 'my' | 'team'
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'team'>('all');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Modal
  const [assigningQuery, setAssigningQuery] = useState<CustomerQuery | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Subscribe to real-time notification events
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => localDb.getCategories(), []);
  const agents = useMemo(() => localDb.getUsers(), []);
  const teams = useMemo(() => localDb.getTeams(), []);

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find(t => t.id === user.team_id) || null;
  }, [user, teams]);

  // All Queries list from database
  const allQueriesList = useMemo(() => {
    return localDb.getQueries();
  }, [refreshKey]);

  // Filtered queries list
  const filteredQueries = useMemo(() => {
    let result = allQueriesList;

    // Tab filtering
    if (activeTab === 'my' && user) {
      result = result.filter(q => q.assigned_to === user.id);
    } else if (activeTab === 'team' && userTeam) {
      result = result.filter(q => q.assigned_team_id === userTeam.id);
    }

    // Filter controls
    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        result = result.filter(q => q.status === 'new' || q.status === 'open' || q.status === 'assigned');
      } else {
        result = result.filter(q => q.status === statusFilter);
      }
    }
    if (priorityFilter !== 'all') {
      result = result.filter(q => q.priority === priorityFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(q => q.category_id === categoryFilter);
    }
    if (agentFilter !== 'all') {
      result = result.filter(q => q.assigned_to === agentFilter);
    }
    if (teamFilter !== 'all') {
      result = result.filter(q => q.assigned_team_id === teamFilter);
    }

    // Multi-field search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(query =>
        query.query_number.toLowerCase().includes(q) ||
        query.subject.toLowerCase().includes(q) ||
        query.description.toLowerCase().includes(q) ||
        (query.customer && query.customer.company_name.toLowerCase().includes(q)) ||
        (query.customer && query.customer.customer_code.toLowerCase().includes(q)) ||
        (query.order && query.order.order_number.toLowerCase().includes(q)) ||
        (query.product && query.product.sku.toLowerCase().includes(q)) ||
        (query.assigned_to_profile && query.assigned_to_profile.full_name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allQueriesList, activeTab, user, userTeam, statusFilter, priorityFilter, categoryFilter, agentFilter, teamFilter, searchTerm]);

  // Workload Metrics calculation for My Queries
  const myQueries = useMemo(() => {
    if (!user) return [];
    return allQueriesList.filter(q => q.assigned_to === user.id);
  }, [allQueriesList, user]);

  const myUrgentCount = myQueries.filter(q => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;
  const myHighCount = myQueries.filter(q => q.priority === 'high' && q.status !== 'closed' && q.status !== 'resolved').length;
  const myWaitingCount = myQueries.filter(q => q.status === 'waiting_customer').length;
  const myInProgressCount = myQueries.filter(q => q.status === 'in_progress').length;
  const myResolvedCount = myQueries.filter(q => q.status === 'resolved').length;

  // Workload Metrics for Team Queries
  const teamQueries = useMemo(() => {
    if (!userTeam) return [];
    return allQueriesList.filter(q => q.assigned_team_id === userTeam.id);
  }, [allQueriesList, userTeam]);

  const teamNewCount = teamQueries.filter(q => q.status === 'new' || q.status === 'open').length;
  const teamAssignedCount = teamQueries.filter(q => q.status === 'assigned').length;
  const teamInProgressCount = teamQueries.filter(q => q.status === 'in_progress').length;
  const teamWaitingCount = teamQueries.filter(q => q.status === 'waiting_customer').length;
  const teamUrgentCount = teamQueries.filter(q => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;

  // Pagination calculation
  const totalPages = Math.ceil(filteredQueries.length / ITEMS_PER_PAGE) || 1;
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQueries, currentPage]);

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
      setRefreshKey(prev => prev + 1);
      navigate(`/queries/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningQuery) return;
    try {
      localDb.assignQuery(assigningQuery.id, selectedAgentId || null, user.id);
      setAssigningQuery(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority: QueryPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-200">
            🔴 URGENT
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
            🟠 HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-sky-100 text-sky-800 border border-sky-200">
            🔵 NORMAL
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200">
            ⚪ LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: QueryStatus) => {
    switch (status) {
      case 'new':
      case 'open':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">NEW</span>;
      case 'assigned':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">ASSIGNED</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">IN PROGRESS</span>;
      case 'waiting_customer':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">WAITING CUSTOMER</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">RESOLVED</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">CLOSED</span>;
      case 'reopened':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">REOPENED</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <HelpCircle className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Ticket System</h1>
            <p className="text-xs text-slate-500">Record, track, assign, resolve, and audit customer inquiries and support tickets</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tabs Row: All Queries | My Queries | Team Queries */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>All Tickets ({allQueriesList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('my'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'my' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Assigned Queries ({myQueries.length})</span>
              {myUrgentCount > 0 && (
                <span className="bg-red-500 text-white px-1.5 py-0.2 text-[10px] rounded-full font-extrabold">{myUrgentCount}</span>
              )}
            </button>

            {userTeam && (
              <button
                onClick={() => { setActiveTab('team'); setCurrentPage(1); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'team' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{userTeam.name} Queries ({teamQueries.length})</span>
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Tab Specific Workload Metrics Summary Cards */}
        {activeTab === 'my' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase block">🔴 Urgent</span>
              <span className="text-xl font-extrabold text-slate-900">{myUrgentCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">🟠 High Priority</span>
              <span className="text-xl font-extrabold text-slate-900">{myHighCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">🟡 Waiting Customer</span>
              <span className="text-xl font-extrabold text-slate-900">{myWaitingCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-sky-700 uppercase block">🔵 In Progress</span>
              <span className="text-xl font-extrabold text-slate-900">{myInProgressCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">🟢 Resolved Today</span>
              <span className="text-xl font-extrabold text-slate-900">{myResolvedCount}</span>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-sky-700 uppercase block">New Unassigned</span>
              <span className="text-xl font-extrabold text-slate-900">{teamNewCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">Assigned</span>
              <span className="text-xl font-extrabold text-slate-900">{teamAssignedCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">In Progress</span>
              <span className="text-xl font-extrabold text-slate-900">{teamInProgressCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Waiting Customer</span>
              <span className="text-xl font-extrabold text-slate-900">{teamWaitingCount}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-red-700 uppercase block">🔴 Urgent Team Items</span>
              <span className="text-xl font-extrabold text-slate-900">{teamUrgentCount}</span>
            </div>
          </div>
        )}

        {/* Multi-Field Search & Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Multi-Field Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search query #, customer code/name, subject, order #, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Ticket Statuses</option>
              <option value="open">Active Open Queue (New / Assigned)</option>
              <option value="new">New (Unassigned)</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting for Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed Archive</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Priority Levels</option>
              <option value="urgent">🔴 Urgent Priority</option>
              <option value="high">🟠 High Priority</option>
              <option value="medium">🔵 Normal Priority</option>
              <option value="low">⚪ Low Priority</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Issue Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Support Queries Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Query Number</th>
                <th className="px-5 py-3">Customer Account</th>
                <th className="px-5 py-3">Subject & Related Entity</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3 font-mono">Last Updated</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedQueries.length > 0 ? (
                paginatedQueries.map((query) => (
                  <tr key={query.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Query Number */}
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-700">
                      <Link to={`/queries/${query.id}`} className="hover:underline">
                        {query.query_number}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      {query.customer ? (
                        <div>
                          <Link to={`/customers/${query.customer.id}`} className="font-bold text-slate-900 hover:text-sky-600 block">
                            {query.customer.company_name}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-500">{query.customer.customer_code}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Customer</span>
                      )}
                    </td>

                    {/* Subject & Related Entity Pills */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={query.subject}>
                        {query.subject}
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        {query.category && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded border border-slate-200">
                            {query.category.name}
                          </span>
                        )}

                        {query.order && (
                          <Link to={`/orders/${query.order.id}`} className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-semibold px-1.5 py-0.2 rounded border border-emerald-200 hover:underline flex items-center">
                            <ShoppingBag className="w-2.5 h-2.5 mr-0.5" />
                            {query.order.order_number}
                          </Link>
                        )}

                        {query.product && (
                          <Link to={`/products/${query.product.id}`} className="text-[10px] bg-purple-50 text-purple-800 font-mono font-semibold px-1.5 py-0.2 rounded border border-purple-200 hover:underline flex items-center">
                            <Package className="w-2.5 h-2.5 mr-0.5" />
                            {query.product.sku}
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-5 py-3.5">
                      {getPriorityBadge(query.priority)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      {getStatusBadge(query.status)}
                    </td>

                    {/* Assigned Agent */}
                    <td className="px-5 py-3.5">
                      {query.assigned_to_profile ? (
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {query.assigned_to_profile.full_name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{query.assigned_to_profile.full_name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAssigningQuery(query); setSelectedAgentId(''); }}
                          className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200"
                        >
                          + Assign Agent
                        </button>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {new Date(query.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/queries/${query.id}`}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400 italic">
                    No support tickets matched your active workspace filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {filteredQueries.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredQueries.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredQueries.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filteredQueries.length}</span> tickets
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

      {/* Query Creation Form Modal */}
      <QueryFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuery}
        isSubmitting={isSubmitting}
      />

      {/* Quick Agent Assign Modal */}
      {assigningQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <h3>Assign Support Agent ({assigningQuery.query_number})</h3>
            </div>
            
            <p className="text-xs text-slate-600">
              Select a Support Agent to assign responsibility for query <span className="font-mono font-bold text-sky-700">{assigningQuery.query_number}</span>.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Support Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                >
                  <option value="">-- Unassigned Queue --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name} ({a.role.replace(/_/g, ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningQuery(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
