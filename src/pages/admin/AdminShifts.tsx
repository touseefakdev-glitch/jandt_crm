import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Shift, Team } from '../../types';
import { Clock, Building2, CheckCircle2, Moon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/format';

export const AdminShifts: React.FC = () => {
  const { user } = useAuth();

  const teams: Team[] = useMemo(() => localDb.getTeams(), []);
  const shifts: Shift[] = useMemo(() => localDb.getShifts(), []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Schedule Configuration"
        description="Configure team shift schedules with flexible overnight time boundary support across business timezones"
        icon={<Clock className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        badges={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-xl border border-sky-200">
            <Clock className="w-4 h-4 text-sky-600" />
            Overnight Schedule Support Active
          </span>
        }
      />

      <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 text-sky-950 text-xs leading-relaxed space-y-1">
        <div className="font-bold flex items-center gap-2 text-sky-900 uppercase tracking-wider">
          <Moon className="w-4 h-4 text-sky-600" />
          Overnight Shift Boundary Rule
        </div>
        <p>
          Configured shift schedules (e.g., Team 1: <span className="font-mono font-bold">3 PM – 11 AM</span>, Team 2:{' '}
          <span className="font-mono font-bold">12 PM – 8 AM</span>) span across midnight. The system evaluates shift sessions
          using operational status and explicit time strings without simple numerical{' '}
          <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">start &lt; end</code> limits or silent UTC conversion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map(team => {
          const teamShift = shifts.find(s => s.team_id === team.id);

          return (
            <Card key={team.id}>
              <CardHeader
                title={team.name}
                subtitle={<span className="font-mono">ID: {team.id.substring(0, 8)}...</span>}
                icon={
                  <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-sky-400" />
                  </div>
                }
                actions={
                  team.is_active ? (
                    <Badge
                      badge={{
                        subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                        solid: 'bg-emerald-600 text-white',
                        dot: 'bg-emerald-500',
                        label: 'Active',
                      }}
                    />
                  ) : (
                    <Badge
                      badge={{
                        subtle: 'bg-red-50 text-red-700 ring-red-200',
                        solid: 'bg-red-600 text-white',
                        dot: 'bg-red-500',
                        label: 'Inactive',
                      }}
                    />
                  )
                }
              />

              <CardBody>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-600">Configured Shift Info:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{team.shift_info}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-600">Current Operational Status:</span>
                    <span className="font-bold text-emerald-700 inline-flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Active Session
                    </span>
                  </div>
                  {teamShift && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-600">Opened At:</span>
                      <span className="font-mono text-slate-700">{formatDateTime(teamShift.opened_at)}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
