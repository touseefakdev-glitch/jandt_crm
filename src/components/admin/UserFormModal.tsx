import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, UserFormInput, Team, OperationalArea } from '../../types';
import { localDb } from '../../services/db';
import { UserPlus, ShieldCheck, Mail, Users, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

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
  const [operationalArea, setOperationalArea] = useState<OperationalArea>('BOTH');
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
      setOperationalArea(userToEdit.operational_area || 'BOTH');
      setIsActive(userToEdit.is_active);
    } else {
      setFullName('');
      setEmail('');
      setRole('support_agent');
      setTeamId(teams[0]?.id || '');
      setOperationalArea('BOTH');
      setIsActive(true);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      operational_area: operationalArea,
      is_active: isActive,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditMode ? `Edit User Account (${userToEdit.full_name})` : 'Create New CRM User Account'}
      subtitle="System user account with role-based access permissions"
      icon={
        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
          <UserPlus className="w-5 h-5" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditMode && (
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-xs leading-relaxed">
            <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Account Creation Security Policy
            </span>
            Plaintext passwords are never stored or displayed. Upon creation, an automated activation invitation will be dispatched to the user's email.
          </div>
        )}

        <Input
          label={
            <>
              Full Name <span className="text-red-500">*</span>
            </>
          }
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Ahmed Khan or Sarah Miller"
          error={errors.full_name || null}
          icon={<UserPlus className="w-4 h-4" />}
        />

        <Input
          label={
            <>
              Email Address <span className="text-red-500">*</span>
            </>
          }
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@jtsupplies.com"
          error={errors.email || null}
          icon={<Mail className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={
              <>
                System Role <span className="text-red-500">*</span>
              </>
            }
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="admin">System Admin</option>
            <option value="sales_agent">Sales Agent</option>
            <option value="support_agent">Support Agent</option>
          </Select>

          <Select
            label={
              <>
                Operational Team <span className="text-slate-400">(optional)</span>
              </>
            }
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">-- No Team Assigned --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shift_info})
              </option>
            ))}
          </Select>
        </div>

        <Select
          label={
            <>
              Operational Area <span className="text-slate-400">(orders access scope)</span>
            </>
          }
          value={operationalArea}
          onChange={(e) => setOperationalArea(e.target.value as OperationalArea)}
        >
          <option value="BOTH">All Areas (Admin / Supervisor)</option>
          <option value="KELOWNA">Kelowna Only</option>
          <option value="OUTSIDE_KELOWNA">Outside Kelowna Only</option>
        </Select>
        <p className="text-[10px] text-slate-400 -mt-2">
          Agents scoped to an area only see and process daily order operations for routes in their area. Admins see all areas.
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-800">
            Account Active (User can log in and access permitted modules)
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={isSubmitting} icon={<ShieldCheck className="w-4 h-4" />}>
            {isEditMode ? 'Save User Changes' : 'Create User Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
