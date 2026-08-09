import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, UserFormInput, Team } from '../../types';
import { localDb } from '../../services/db';
import { X, UserPlus, ShieldCheck, Mail, Users, CheckCircle2 } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormInput) => void;
  userToEdit?: UserProfile | null;
  isSubmitting?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userToEdit,
  isSubmitting = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('support_agent');
  const [teamId, setTeamId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const teams: Team[] = localDb.getTeams();

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.full_name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setTeamId(userToEdit.team_id || '');
      setIsActive(userToEdit.is_active);
    } else {
      setFullName('');
      setEmail('');
      setRole('support_agent');
      setTeamId(teams[0]?.id || '');
      setIsActive(true);
    }
    setErrors({});
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.full_name = 'Full Name is required.';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      full_name: fullName.trim(),
      email: email.toLowerCase().trim(),
      role,
      team_id: teamId || null,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">
              {isEditMode ? `Edit User Account (${userToEdit.full_name})` : 'Create New CRM User Account'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Notice Banner regarding passwords */}
          {!isEditMode && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 leading-relaxed">
              <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">🔒 Account Creation Security Policy</span>
              Plaintext passwords are never stored or displayed. Upon creation, an automated activation invitation will be dispatched to the user's email.
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ahmed Khan or Sarah Miller"
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.full_name ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.full_name && <p className="text-red-600 font-semibold mt-1">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@jtsupplies.com"
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.email && <p className="text-red-600 font-semibold mt-1">{errors.email}</p>}
          </div>

          {/* Role & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                System Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
              >
                <option value="admin">System Admin</option>
                <option value="sales_agent">Sales Agent</option>
                <option value="support_agent">Support Agent</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Operational Team
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">-- No Team Assigned --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.shift_info})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300"
            />
            <label htmlFor="isActive" className="font-semibold text-slate-800">
              Account Active (User can log in and access permitted modules)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditMode ? 'Save User Changes' : 'Create User Account'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
