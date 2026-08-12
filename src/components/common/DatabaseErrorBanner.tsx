import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { checkSupabaseConnection, forceResyncFromSupabase, getSupabaseConnectionState, getLastConnectionError } from '../../services/supabaseSync';

interface DatabaseErrorBannerProps {
  className?: string;
  onRetrySuccess?: () => void;
}

export const DatabaseErrorBanner: React.FC<DatabaseErrorBannerProps> = ({
  className = '',
  onRetrySuccess,
}) => {
  const [retrying, setRetrying] = useState(false);
  const state = getSupabaseConnectionState();
  const errorMsg = getLastConnectionError();

  if (state === 'online') return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const nextState = await checkSupabaseConnection();
      if (nextState === 'online') {
        await forceResyncFromSupabase();
        if (onRetrySuccess) onRetrySuccess();
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
            {state === 'not_configured' ? <AlertTriangle className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-amber-950">
              Unable to connect to the CRM database
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              {state === 'not_configured'
                ? 'Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are missing.'
                : errorMsg || 'Please check your internet connection or database configuration.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="px-3.5 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Connecting…' : 'Retry Connection'}
        </button>
      </div>
    </div>
  );
};
