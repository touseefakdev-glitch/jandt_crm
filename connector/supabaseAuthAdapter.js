const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

/**
 * Custom Baileys authentication state adapter backed by Supabase PostgreSQL.
 * Ensures WhatsApp authentication survives container restarts, redeployments,
 * and server moves without depending on local disk storage.
 */
async function useSupabaseAuthState(supabase, category = 'baileys_auth') {
  const readData = async (key) => {
    try {
      const dbKey = `${category}:${key}`;
      const { data, error } = await supabase
        .from('whatsapp_baileys_auth')
        .select('value')
        .eq('id', dbKey)
        .maybeSingle();

      if (error || !data || !data.value) {
        return null;
      }
      return JSON.parse(JSON.stringify(data.value), BufferJSON.reviver);
    } catch (err) {
      console.warn(`[SupabaseAuth] Failed to read key "${key}":`, err.message);
      return null;
    }
  };

  const writeData = async (key, value) => {
    try {
      const dbKey = `${category}:${key}`;
      if (value === null || value === undefined) {
        await supabase.from('whatsapp_baileys_auth').delete().eq('id', dbKey);
      } else {
        const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
        await supabase.from('whatsapp_baileys_auth').upsert({
          id: dbKey,
          value: serialized,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[SupabaseAuth] Failed to write key "${key}":`, err.message);
    }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const categoryKey in data) {
            for (const id in data[categoryKey]) {
              const value = data[categoryKey][id];
              const storeKey = `${categoryKey}-${id}`;
              tasks.push(writeData(storeKey, value));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
    clearAuthState: async () => {
      try {
        await supabase.from('whatsapp_baileys_auth').delete().like('id', `${category}:%`);
        console.log('[SupabaseAuth] Cleared all auth state from database.');
      } catch (e) {
        console.error('[SupabaseAuth] Failed to clear auth state:', e.message);
      }
    },
  };
}

module.exports = { useSupabaseAuthState };
