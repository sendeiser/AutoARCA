/**
 * Cliente Oficial de Supabase para AutoARCA
 * Configuración conectada a: https://oqwzldvbvdigilcekhmo.supabase.co
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  'https://oqwzldvbvdigilcekhmo.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_6hQslIoy7wavKvcIgUwE-g_5kx_4uMm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
