import { describe, it, expect } from 'vitest';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../src/services/supabaseClient.js';
import { supabaseDataService } from '../src/services/supabaseDataService.js';
import fs from 'fs';
import path from 'path';

describe('Supabase Full Database Configuration', () => {
  it('está configurado con el endpoint y credenciales provistas por el usuario', () => {
    expect(SUPABASE_URL).toBe('https://oqwzldvbvdigilcekhmo.supabase.co');
    expect(SUPABASE_ANON_KEY).toBe('sb_publishable_6hQslIoy7wavKvcIgUwE-g_5kx_4uMm');
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('verifica la existencia y completitud de FULL_SETUP.sql', () => {
    const fullSetupPath = path.resolve(__dirname, '../supabase/FULL_SETUP.sql');
    expect(fs.existsSync(fullSetupPath)).toBe(true);
    const sql = fs.readFileSync(fullSetupPath, 'utf-8');

    // 5 tablas nucleares
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.business_profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.monotributo_scales');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.sales_receipts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.daily_batches');

    // RLS y políticas
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY "allow_anon_read_scales"');

    // Semillas oficiales A a K
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(cat => {
      expect(sql).toContain(`'${cat}'`);
    });
  });

  it('el servicio de datos expone verificación de salud y formato estándar', async () => {
    expect(typeof supabaseDataService.checkDatabaseHealth).toBe('function');
    expect(typeof supabaseDataService.syncReceipt).toBe('function');
    expect(typeof supabaseDataService.syncBatch).toBe('function');

    const health = await supabaseDataService.checkDatabaseHealth();
    expect(health).toHaveProperty('isOnline');
    expect(health).toHaveProperty('url');
    expect(health).toHaveProperty('projectId', 'oqwzldvbvdigilcekhmo');
    expect(health).toHaveProperty('tables');
    expect(health.tables).toHaveProperty('profiles');
    expect(health.tables).toHaveProperty('business_profiles');
    expect(health.tables).toHaveProperty('monotributo_scales');
    expect(health.tables).toHaveProperty('sales_receipts');
    expect(health.tables).toHaveProperty('daily_batches');
  });
});
