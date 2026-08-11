const fs = require('fs');
const path = require('path');
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { supabase } = require('./supabase');

const AUTH_DIR = path.resolve(process.env.AUTH_FOLDER || './auth');

/**
 * Native Baileys Auth State with Supabase Cloud Sync
 * Uses native Baileys useMultiFileAuthState on local folder and syncs .json session files to Supabase DB.
 */
async function getAuthManager() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Restore auth files from Supabase if local folder is empty
  try {
    const files = fs.readdirSync(AUTH_DIR);
    if (files.length === 0) {
      console.log('[AuthManager] Local auth folder empty. Restoring session files from Supabase DB...');
      const { data } = await supabase
        .from('whatsapp_baileys_auth')
        .select('id, value');

      if (data && data.length > 0) {
        for (const row of data) {
          const filename = row.id.replace('file:', '');
          if (!filename || filename === 'keep_table') continue;
          const filepath = path.join(AUTH_DIR, filename);
          const content = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
          fs.writeFileSync(filepath, content, 'utf-8');
        }
        console.log(`[AuthManager] Restored ${data.length} session files from Supabase database.`);
      }
    }
  } catch (err) {
    console.warn('[AuthManager] Restore from DB warning:', err.message);
  }

  // Load native Baileys multi-file auth state
  const { state, saveCreds: nativeSaveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // Wrapper for saveCreds that syncs session files to Supabase
  const saveCreds = async () => {
    await nativeSaveCreds();
    try {
      if (!fs.existsSync(AUTH_DIR)) return;
      const files = fs.readdirSync(AUTH_DIR);
      for (const filename of files) {
        if (!filename.endsWith('.json')) continue;
        const filepath = path.join(AUTH_DIR, filename);
        if (!fs.existsSync(filepath)) continue;
        try {
          const content = fs.readFileSync(filepath, 'utf-8');
          const jsonVal = JSON.parse(content);
          await supabase.from('whatsapp_baileys_auth').upsert({
            id: `file:${filename}`,
            value: jsonVal,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[AuthManager] DB sync warning:', err.message);
    }
  };

  const clearAuthState = async () => {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
      await supabase.from('whatsapp_baileys_auth').delete().neq('id', 'keep_table');
      console.log('[AuthManager] Cleared all session files from disk and database.');
    } catch (err) {
      console.error('[AuthManager] Failed to clear auth state:', err.message);
    }
  };

  return { state, saveCreds, clearAuthState };
}

module.exports = { getAuthManager };
