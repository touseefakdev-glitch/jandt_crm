import React, { useState, useEffect } from 'react';
import { Team, TeamFormInput } from '../../types';
import { X, UsersRound, CheckCircle2 } from 'lucide-react';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamFormInput) => void;
  teamToEdit?: Team | null;
  isSubmitting?: boolean;
}

export const TeamFormModal: React.FC<TeamFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamToEdit,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [shiftInfo, setShiftInfo] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!teamToEdit;

  useEffect(() => {
    if (teamToEdit) {
      setName(teamToEdit.name);
      setShiftInfo(teamToEdit.shift_info);
      setDescription(teamToEdit.description || '');
      setIsActive(teamToEdit.is_active);
    } else {
      setName('');
      setShiftInfo('');
      setDescription('');
      setIsActive(true);
    }
    setErrors({});
  }, [teamToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Team Name is required.';
    }
    if (!shiftInfo.trim()) {
      errs.shift_info = 'Shift schedule info is required (e.g. 3 PM – 11 AM).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      shift_info: shiftInfo.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-base">
            <UsersRound className="w-5 h-5 text-purple-400" />
            <span>{isEditMode ? `Edit Team (${teamToEdit.name})` : 'Create Operational Team'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team 1 or Daytime Operations"
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="text-red-600 font-semibold mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Configured Shift Schedule Info <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shiftInfo}
              onChange={(e) => setShiftInfo(e.target.value)}
              placeholder="e.g. 3 PM – 11 AM or 12 PM – 8 AM"
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.shift_info ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.shift_info && <p className="text-red-600 font-semibold mt-1">{errors.shift_info}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Primary Function
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Daytime to morning operational coverage and order processing..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="teamActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300"
            />
            <label htmlFor="teamActive" className="font-semibold text-slate-800">
              Operational Team Active
            </label>
          </div>

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
              <span>{isEditMode ? 'Save Team Changes' : 'Create Team'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
