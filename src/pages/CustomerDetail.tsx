import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFormInput, CustomerQuery, Order } from '../types';
import { localDb } from '../services/db';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  FileText, 
  Clock, 
  ShieldCheck, 
  Edit, 
  Power, 
  HelpCircle, 
  ShoppingBag, 
  Activity,
  Calendar,
  Plus,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'orders' | 'activity'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateQueryModalOpen, setIsCreateQueryModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (id) {
      const data = localDb.getCustomerById(id);
      setCustomer(data);
    }
  }, [id]);

  const customerQueries = useMemo(() => {
    if (!id) return [];
    return localDb.getQueries({ customer_id: id });
  }, [id, isCreateQueryModalOpen]);

  const customerOrders = useMemo(() => {
    if (!id) return [];
    return localDb.getOrders({ customer_id: id });
  }, [id, isCreateOrderModalOpen]);

  if (!customer) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 my-8">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Customer Record Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested customer ID does not exist or has been removed.</p>
        <Link
          to="/customers"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Customer List
        </Link>
      </div>
    );
  }

  const handleUpdateCustomer = (data: CustomerFormInput) => {
    if (!user) return;
    const updated = localDb.updateCustomer(customer.id, data, user.id);
    if (updated) {
      setCustomer(updated);
    }
    setIsEditModalOpen(false);
  };

  const handleToggleStatus = () => {
    if (!user || !isAdmin) return;
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    const updated = localDb.toggleCustomerStatus(customer.id, newStatus, user.id);
    if (updated) {
      setCustomer(updated);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Navigation */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customer Directory
        </Link>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-xs">
            {customer.company_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-100">
                {customer.customer_code}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                customer.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {customer.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {customer.company_name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
              <span>Added {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {customer.created_by_profile && (
                <>
                  <span>•</span>
                  <span>Created by {customer.created_by_profile.full_name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setIsCreateOrderModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Order
          </button>

          <button
            onClick={() => setIsCreateQueryModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Query
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition-colors border border-slate-300"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </button>

          {isAdmin && (
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center px-3.5 py-2 font-medium text-xs rounded-lg transition-colors border ${
                customer.status === 'active'
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5 mr-1.5" />
              {customer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
            </button>
          )}
        </div>

      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer Overview
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'queries'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Support Queries</span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
            {customerQueries.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'orders'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders & Fulfillment</span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
            {customerOrders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'activity'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Timeline</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Contact & Address */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Contact Person</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {customer.contact_person || <span className="text-slate-400 italic">Not specified</span>}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Telephone</span>
                  <span className="font-semibold text-slate-900 font-mono mt-0.5 block">
                    {customer.phone || <span className="text-slate-400 italic">Not specified</span>}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 sm:col-span-2">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Email Address</span>
                  <span className="font-semibold text-slate-900 font-mono mt-0.5 block">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-sky-600 hover:underline">
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not specified</span>
                    )}
                  </span>
                </div>

              </div>
            </div>

            {/* Address Details Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Shipping & Business Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Street Address</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">
                    {customer.address || <span className="text-slate-400 italic">No street address recorded</span>}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">City & Country</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">
                    {customer.city || 'N/A'}, {customer.country || 'USA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Internal Notes Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Internal Account Notes</span>
              </h3>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {customer.notes || <span className="text-slate-400 italic">No operational notes recorded for this customer profile.</span>}
              </div>
            </div>

          </div>

          {/* Right Column: System Audit Metadata */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>System Audit Info</span>
              </h3>

              <div className="space-y-3 text-xs">
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Customer System ID</span>
                  <span className="font-mono text-slate-900 mt-0.5 block">{customer.id}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Created Timestamp</span>
                  <span className="font-mono text-slate-900 mt-0.5 block">
                    {new Date(customer.created_at).toLocaleString()}
                  </span>
                  <span className="text-slate-500 mt-0.5 block">
                    By: <span className="font-semibold text-slate-800">{customer.created_by_profile?.full_name || 'System Admin'}</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Last Modified</span>
                  <span className="font-mono text-slate-900 mt-0.5 block">
                    {new Date(customer.updated_at).toLocaleString()}
                  </span>
                  {customer.updated_by_profile && (
                    <span className="text-slate-500 mt-0.5 block">
                      By: <span className="font-semibold text-slate-800">{customer.updated_by_profile.full_name}</span>
                    </span>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Customer Support Tickets ({customerQueries.length})</span>
            </h3>
            <button
              onClick={() => setIsCreateQueryModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Support Query
            </button>
          </div>

          {customerQueries.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Agent</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {customerQueries.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-sky-700">
                        <Link to={`/queries/${q.id}`} className="hover:underline">{q.query_number}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                        <Link to={`/queries/${q.id}`} className="hover:text-sky-600">{q.subject}</Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{q.category?.name || 'General'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          q.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          q.priority === 'medium' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {q.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                          q.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          q.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          q.status === 'waiting_customer' ? 'bg-amber-100 text-amber-800' :
                          q.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {q.assigned_to_profile?.full_name || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/queries/${q.id}`} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg inline-block">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50/50">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 mb-1">No Support Tickets Registered</p>
              <p className="text-xs text-slate-500 mb-4">No customer query records exist for {customer.company_name}.</p>
              <button
                onClick={() => setIsCreateQueryModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 bg-sky-600 text-white font-medium text-xs rounded-lg hover:bg-sky-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Query
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab - Real Linked Customer Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <span>Customer Orders & Fulfillment ({customerOrders.length})</span>
            </h3>
            <button
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create New Order
            </button>
          </div>

          {customerOrders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Sales Agent</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3 font-mono">Grand Total</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customerOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">
                        <Link to={`/orders/${o.id}`} className="hover:underline">{o.order_number}</Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(o.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {o.sales_agent_profile?.full_name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                          {o.current_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ${o.grand_total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/orders/${o.id}`} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg inline-block">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50/50">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 mb-1">No Orders Registered</p>
              <p className="text-xs text-slate-500 mb-4">No order records exist for {customer.company_name}.</p>
              <button
                onClick={() => setIsCreateOrderModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline Architecture */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Customer Record Audit Timeline</span>
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            
            {/* Event: Account Creation */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50"></div>
              <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(customer.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">Customer Profile Created</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Initial customer record was registered by <span className="font-semibold text-slate-800">{customer.created_by_profile?.full_name || 'System Admin'}</span> with code <span className="font-mono font-bold text-sky-600">{customer.customer_code}</span>.
              </p>
            </div>

            {/* Event: Last Update */}
            {customer.updated_at !== customer.created_at && (
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white ring-4 ring-sky-50"></div>
                <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(customer.updated_at).toLocaleString()}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">Customer Profile Updated</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Record information was updated by <span className="font-semibold text-slate-800">{customer.updated_by_profile?.full_name || 'System User'}</span>.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Edit Customer Form Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateCustomer}
        customerToEdit={customer}
      />

      {/* Create Query Modal for Customer */}
      <QueryFormModal
        isOpen={isCreateQueryModalOpen}
        onClose={() => setIsCreateQueryModalOpen(false)}
        onSubmit={(data) => {
          if (!user) return;
          localDb.createQuery(data, user.id);
          setIsCreateQueryModalOpen(false);
        }}
        preselectedCustomerId={customer.id}
      />

      {/* Create Order Modal for Customer */}
      <OrderFormModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onSubmit={(data) => {
          if (!user) return;
          localDb.createOrder(data, user.id);
          setIsCreateOrderModalOpen(false);
        }}
        preselectedCustomerId={customer.id}
      />

    </div>
  );
};
