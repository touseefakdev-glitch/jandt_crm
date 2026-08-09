import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { SystemSettings } from '../../types';
import { Settings, ShieldCheck, Save, Globe, DollarSign, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [crmTitle, setCrmTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [paginationLimit, setPaginationLimit] = useState(10);

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
    toast({ type: 'success', message: 'System Configuration Settings updated successfully.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration Settings"
        description="Configure global application defaults for company metadata, timezones, currency, and pagination"
        icon={<Settings className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        badges={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-xl border border-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Admin Controls Only
          </span>
        }
      />

      <Card className="max-w-3xl">
        <CardHeader
          title="Global Application Defaults"
          subtitle={`Last updated by ${settings.updated_by_profile?.full_name || 'System'} — ${new Date(settings.updated_at).toLocaleString()}`}
          icon={<Settings className="w-4 h-4" />}
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="font-semibold"
              />

              <Input
                label="CRM Application Title"
                value={crmTitle}
                onChange={(e) => setCrmTitle(e.target.value)}
                required
                className="font-semibold"
              />

              <Select
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Default Business Timezone
                  </span>
                }
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="America/Chicago">America/Chicago (CST / CDT)</option>
                <option value="America/Denver">America/Denver (MST / MDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </Select>

              <Select
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Default Currency Symbol
                  </span>
                }
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
              >
                <option value="$">$ (USD — US Dollar)</option>
                <option value="€">€ (EUR — Euro)</option>
                <option value="£">£ (GBP — British Pound)</option>
                <option value="AED">AED (Emirati Dirham)</option>
              </Select>

              <Input
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Display Date Format
                  </span>
                }
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                placeholder="MMM D, YYYY h:mm A"
                required
                className="font-mono"
              />

              <Select
                label="Default Table Rows Limit"
                value={paginationLimit}
                onChange={(e) => setPaginationLimit(Number(e.target.value))}
              >
                <option value={10}>10 items per page</option>
                <option value={25}>25 items per page</option>
                <option value={50}>50 items per page</option>
              </Select>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button type="submit" variant="secondary" icon={<Save className="w-4 h-4 text-sky-400" />}>
                Save System Settings
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
