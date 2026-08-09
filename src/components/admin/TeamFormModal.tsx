import React, { useState, useEffect } from 'react';
import { Team, TeamFormInput } from '../../types';
import { UsersRound, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditMode ? `Edit Team (${teamToEdit.name})` : 'Create Operational Team'}
      subtitle="Configure shift coverage and team assignments"
      icon={
        <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
          <UsersRound className="w-5 h-5" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={
            <>
              Team Name <span className="text-red-500">*</span>
            </>
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Team 1 or Daytime Operations"
          error={errors.name || null}
          icon={<UsersRound className="w-4 h-4" />}
        />

        <Input
          label={
            <>
              Configured Shift Schedule Info <span className="text-red-500">*</span>
            </>
          }
          value={shiftInfo}
          onChange={(e) => setShiftInfo(e.target.value)}
          placeholder="e.g. 3 PM – 11 AM or 12 PM – 8 AM"
          error={errors.shift_info || null}
          icon={<Clock className="w-4 h-4" />}
        />

        <Textarea
          label="Description / Primary Function"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Daytime to morning operational coverage and order processing..."
          rows={2}
          className="resize-none min-h-[64px]"
        />

        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="teamActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
          />
          <label htmlFor="teamActive" className="text-sm font-medium text-slate-800">
            Operational Team Active
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={isSubmitting} icon={<CheckCircle2 className="w-4 h-4" />}>
            {isEditMode ? 'Save Team Changes' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
