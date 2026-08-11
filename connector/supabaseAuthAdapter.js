const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

/**
 * Hybrid In-Memory + Supabase DB Auth Adapter for Baileys.
 * Provides 0ms in-memory access for Baileys cryptographic key exchange,
 * while asynchronously syncing all session state to Supabase for cloud persistence.
 */
async function useSupabaseAuthState(supabase, category = 'baileys_auth') {
  // Fast in-memory cache map
  const memoryCache = new Map();

  // Load existing keys from Supabase DB into memory cache at startup
  try {
    const { data } = await supabase
      .from('whatsapp_baileys_auth')
      .select('id, value')
      .like('id', `${category}:%`);

    if (data && data.length > 0) {
      for (const row of data) {
        const key = row.id.replace(`${category}:`, '');
        try {
          const parsed = JSON.parse(JSON.stringify(row.value), BufferJSON.reviver);
          memoryCache.set(key, parsed);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('[SupabaseAuth] Initial DB auth load warning:', err.message);
  }

  const readData = (key) => {
    return memoryCache.get(key) || null;
  };

  const writeData = async (key, value) => {
    const dbKey = `${category}:${key}`;
    if (value === null || value === undefined) {
      memoryCache.delete(key);
      try {
        await supabase.from('whatsapp_baileys_auth').delete().eq('id', dbKey);
      } catch (e) {}
    } else {
      memoryCache.set(key, value);
      try {
        const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
        await supabase.from('whatsapp_baileys_auth').upsert({
          id: dbKey,
          value: serialized,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[SupabaseAuth] DB write error for ${key}:`, err.message);
      }
    }
  };

  const creds = readData('creds') || initAuthCreds();
  if (!memoryCache.has('creds')) {
    memoryCache.set('creds', creds);
  }

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const data = {};
          for (const id of ids) {
            let value = readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: (data) => {
          const tasks = [];
          for (const categoryKey in data) {
            for (const id in data[categoryKey]) {
              const value = data[categoryKey][id];
              const storeKey = `${categoryKey}-${id}`;
              tasks.push(writeData(storeKey, value));
            }
          }
          Promise.all(tasks).catch((e) => console.error('[SupabaseAuth] Key sync error:', e.message));
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
    clearAuthState: async () => {
      memoryCache.clear();
      try {
        await supabase.from('whatsapp_baileys_auth').delete().neq('id', 'keep_table');
        console.log('[SupabaseAuth] Cleared all auth state.');
      } catch (e) {
        console.error('[SupabaseAuth] Failed to clear auth state:', e.message);
      }
    },
  };
}

module.exports = { useSupabaseAuthState };
