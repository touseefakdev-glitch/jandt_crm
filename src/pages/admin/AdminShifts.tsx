import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Shift, Team } from '../../types';
import { Clock, Building2, CheckCircle2, AlertCircle, Edit, Moon, Sun } from 'lucide-react';

export const AdminShifts: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const teams: Team[] = useMemo(() => localDb.getTeams(), [refreshKey]);
  const shifts: Shift[] = useMemo(() => localDb.getShifts(), [refreshKey]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Shift Schedule Configuration</h2>
          <p className="text-xs text-slate-500">Configure team shift schedules with flexible overnight time boundary support across business timezones</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Overnight Schedule Support Active</span>
        </div>
      </div>

      {/* Notice Callout Banner */}
      <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 text-sky-950 text-xs leading-relaxed space-y-1">
        <div className="font-bold flex items-center space-x-2 text-sky-900 uppercase">
          <Moon className="w-4 h-4 text-sky-600" />
          <span>Overnight Shift Boundary Rule</span>
        </div>
        <p>
          Configured shift schedules (e.g., Team 1: <span className="font-mono font-bold">3 PM – 11 AM</span>, Team 2: <span className="font-mono font-bold">12 PM – 8 AM</span>) span across midnight. The system evaluates shift sessions using operational status and explicit time strings without simple numerical <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">start &lt; end</code> limits or silent UTC conversion.
        </p>
      </div>

      {/* Team Shift Configurations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map(team => {
          const teamShift = shifts.find(s => s.team_id === team.id);

          return (
            <div key={team.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">ID: {team.id.substring(0, 8)}...</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  team.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {team.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Configured Shift Info:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{team.shift_info}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Current Operational Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Active Session</span>
                  </span>
                </div>
                {teamShift && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-600">Opened At:</span>
                    <span className="font-mono text-slate-700">{new Date(teamShift.opened_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
