import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { SystemSettings } from '../../types';
import { Settings, ShieldCheck, CheckCircle2, Save, Globe, DollarSign, Calendar } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [crmTitle, setCrmTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [paginationLimit, setPaginationLimit] = useState(10);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const s = localDb.getSystemSettings();
    setSettings(s);
    setCompanyName(s.company_name);
    setCrmTitle(s.crm_title);
    setTimezone(s.timezone);
    setDateFormat(s.date_format);
    setCurrencySymbol(s.currency_symbol);
    setPaginationLimit(s.pagination_limit);
  }, []);

  if (!user || !settings) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = localDb.updateSystemSettings({
      company_name: companyName,
      crm_title: crmTitle,
      timezone,
      date_format: dateFormat,
      currency_symbol: currencySymbol,
      pagination_limit: Number(paginationLimit),
    }, user.id);

    setSettings(updated);
    setToast('System Configuration Settings updated successfully.');
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Configuration Settings</h2>
          <p className="text-xs text-slate-500">Configure global application defaults for company metadata, timezones, currency, and pagination</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Admin Controls Only</span>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Settings Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Company Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                required
              />
            </div>

            {/* CRM Title */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">CRM Application Title</label>
              <input
                type="text"
                value={crmTitle}
                onChange={(e) => setCrmTitle(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                required
              />
            </div>

            {/* Default Timezone */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Default Business Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
              >
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="America/Chicago">America/Chicago (CST / CDT)</option>
                <option value="America/Denver">America/Denver (MST / MDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Default Currency Symbol</span>
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
              >
                <option value="$">$ (USD — US Dollar)</option>
                <option value="€">€ (EUR — Euro)</option>
                <option value="£">£ (GBP — British Pound)</option>
                <option value="AED">AED (Emirati Dirham)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Display Date Format</span>
              </label>
              <input
                type="text"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                placeholder="MMM D, YYYY h:mm A"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                required
              />
            </div>

            {/* Pagination Limit */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Default Table Rows Limit</label>
              <select
                value={paginationLimit}
                onChange={(e) => setPaginationLimit(Number(e.target.value))}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
              >
                <option value={10}>10 items per page</option>
                <option value={25}>25 items per page</option>
                <option value={50}>50 items per page</option>
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-sky-400" />
              <span>Save System Settings</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
