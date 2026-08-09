import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Input } from '../components/ui';
import { getRoleBadge } from '../utils/badges';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { SEED_USERS } from '../services/db';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) navigate('/dashboard');
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    setIsSubmitting(true);
    const success = await login(userEmail, 'password123');
    setIsSubmitting(false);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-800 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/40 mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">J&T Supplies CRM</h2>
        <p className="mt-2 text-sm text-slate-400">Internal Customer Relationship Management Portal</p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-overlay rounded-2xl sm:px-10 border border-white/10">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                clearError();
                setEmail(e.target.value);
              }}
              placeholder="name@jt-supplies.com"
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
            />
            <Button type="submit" fullWidth disabled={isSubmitting} loading={isSubmitting} size="lg">
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">Quick Role Test Login (Demo)</p>
            <div className="space-y-2">
              {SEED_USERS.map((seedUser) => {
                const badge = getRoleBadge(seedUser.role);
                return (
                  <button
                    key={seedUser.id}
                    type="button"
                    onClick={() => handleQuickLogin(seedUser.email)}
                    disabled={isSubmitting}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-card transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{seedUser.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{seedUser.email}</div>
                      </div>
                    </div>
                    <Badge badge={badge} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">Account registration is restricted. Contact your Admin to request user access.</div>
        </div>
      </div>
    </div>
  );
};
