import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DayOfWeek, RouteSchedule } from '../../types';
import { localDb } from '../../services/db';
import { permissions } from '../../services/permissions';
import { 
  MapPin, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Calendar as CalendarIcon,
  Layers
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Select, Table, TableToolbar, TBody, Td, Th, THead, Tr, useToast } from '../../components/ui';

export const AdminRouteSchedules: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = permissions.canManageRouteSchedules(user).allowed;

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedPortal, setSelectedPortal] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Adding Route Schedule
  const [newDay, setNewDay] = useState<DayOfWeek>('monday');
  const [newCityOrRoute, setNewCityOrRoute] = useState('');
  const [newPortal, setNewPortal] = useState<'kelowna' | 'outside_kelowna'>('outside_kelowna');
  const [formError, setFormError] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Route Schedules
  const schedules = useMemo(() => {
    let list = localDb.getRouteSchedules();
    if (selectedDay !== 'all') {
      list = list.filter(s => s.day_of_week === selectedDay);
    }
    if (selectedPortal !== 'all') {
      list = list.filter(s => s.portal === selectedPortal);
    }
    return list;
  }, [selectedDay, selectedPortal, isAddModalOpen, refreshTrigger]);

  if (!canManage) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto my-12">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
          Only System Administrators have permission to configure weekly route schedules.
        </p>
      </Card>
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleActive = async (schedule: RouteSchedule) => {
    try {
      const updated = await localDb.updateRouteSchedule(schedule.id, { active: !schedule.active }, user!.id);
      if (updated) {
        toast({
          type: 'success',
          title: 'Schedule Updated',
          message: `${schedule.city_or_route} (${schedule.day_of_week}) is now ${!schedule.active ? 'Active' : 'Inactive'}`,
        });
        setRefreshTrigger((t) => t + 1);
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Update Failed', message: err.message || 'Failed to update route schedule in database.' });
    }
  };

  const handleAddScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityOrRoute.trim()) {
      setFormError('City or Route name is required.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      await localDb.createRouteSchedule({
        day_of_week: newDay,
        city_or_route: newCityOrRoute.trim(),
        portal: newPortal,
        active: true,
      }, user!.id);

      toast({
        type: 'success',
        title: 'Route Schedule Created',
        message: `Added ${newCityOrRoute.trim()} to ${newDay.toUpperCase()} route schedule.`,
      });

      setNewCityOrRoute('');
      setIsAddModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create route schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDayTitle = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weekly Route Schedule Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the weekly route schedule for Kelowna and Outside Kelowna portals.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Route Schedule
        </Button>
      </div>

      {/* Filter Bar */}
      <TableToolbar>
        <div className="flex items-center gap-3">
          <Select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Days of Week</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </Select>

          <Select
            value={selectedPortal}
            onChange={(e) => setSelectedPortal(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Portals</option>
            <option value="kelowna">Kelowna Portal</option>
            <option value="outside_kelowna">Outside Kelowna Portal</option>
          </Select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{schedules.length}</span> route schedule entries
        </span>
      </TableToolbar>

      {/* Route Schedule Table */}
      <Card flush>
        {schedules.length > 0 ? (
          <Table minWidth={880}>
            <THead>
              <Tr hover={false}>
                <Th width={130}>Day of Week</Th>
                <Th width={240}>City / Route Name</Th>
                <Th width={160}>Portal Assignment</Th>
                <Th width={120}>Status</Th>
                <Th width={130} align="right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {schedules.map((s) => (
                <Tr key={s.id}>
                  <Td width={130} className="font-bold text-xs text-slate-900 capitalize font-mono">
                    {formatDayTitle(s.day_of_week)}
                  </Td>
                  <Td width={240} truncate maxWidth={240}>
                    <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span className="truncate">{s.city_or_route}</span>
                    </span>
                  </Td>
                  <Td width={160}>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      s.portal === 'kelowna' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {s.portal === 'kelowna' ? 'Kelowna Portal' : 'Outside Kelowna'}
                    </span>
                  </Td>
                  <Td width={120}>
                    <Badge badge={s.active ? {
                      subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                      solid: 'bg-emerald-600 text-white',
                      dot: 'bg-emerald-500',
                      label: 'Active',
                    } : {
                      subtle: 'bg-slate-100 text-slate-600 ring-slate-200',
                      solid: 'bg-slate-500 text-white',
                      dot: 'bg-slate-400',
                      label: 'Inactive',
                    }} />
                  </Td>
                  <Td width={130} align="right">
                    <Button
                      size="sm"
                      variant={s.active ? 'outline' : 'secondary'}
                      onClick={() => handleToggleActive(s)}
                    >
                      {s.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No route schedule records found.</p>
          </div>
        )}
      </Card>

      {/* Modal: Add Route Schedule */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setFormError('');
            setIsAddModalOpen(false);
          }}
          title="Add Route Schedule Entry"
        >
          <form onSubmit={handleAddScheduleSubmit} className="space-y-4">
            <Select
              label="Day of Week *"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value as DayOfWeek)}
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </Select>

            <Input
              label="City or Route Name *"
              type="text"
              value={newCityOrRoute}
              onChange={(e) => {
                setNewCityOrRoute(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="e.g. West Kelowna, Vernon, Penticton..."
              error={formError}
            />

            <Select
              label="Operational Portal Assignment *"
              value={newPortal}
              onChange={(e) => {
                const val = e.target.value as 'kelowna' | 'outside_kelowna';
                setNewPortal(val);
              }}
            >
              <option value="outside_kelowna">Outside Kelowna Portal</option>
              <option value="kelowna">Kelowna Portal</option>
            </Select>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />} disabled={isSubmitting} loading={isSubmitting}>
                Create Route Schedule
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminRouteSchedules;
