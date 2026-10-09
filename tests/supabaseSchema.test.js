import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Supabase Schema Definition', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261009000001_arca_saas_schema.sql');
  const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');

  it('verifica que los archivos de esquema SQL existan', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it('contiene las 5 tablas requeridas y politicas RLS', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.business_profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.monotributo_scales');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.sales_receipts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.daily_batches');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
  });

  it('incluye las semillas de categorias de Monotributo A a K', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    const categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    categories.forEach(cat => {
      expect(sql).toContain(`'${cat}'`);
    });
  });
});
