-- ==============================================================================
-- Migración DDL: Plataforma SaaS ARCA Monotributo & Panel Contable
-- Fecha: 2026-10-09
-- ==============================================================================

-- 1. Tabla: profiles (Usuarios del Sistema con Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'accountant', 'superadmin')),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  accountant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial' 
    CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla: business_profiles (Datos Fiscales del Comercio)
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuit VARCHAR(11) NOT NULL,
  razon_social VARCHAR(150) NOT NULL,
  fantasy_name VARCHAR(150),
  monotributo_category VARCHAR(2) NOT NULL DEFAULT 'A',
  activity_type VARCHAR(20) NOT NULL DEFAULT 'products' CHECK (activity_type IN ('products', 'services', 'both')),
  pos_number INTEGER NOT NULL DEFAULT 1,
  address VARCHAR(200),
  city VARCHAR(100),
  province VARCHAR(100) DEFAULT 'Buenos Aires',
  daily_closing_mode VARCHAR(20) NOT NULL DEFAULT 'mixed' CHECK (daily_closing_mode IN ('manual', 'cron', 'mixed')),
  custom_closing_time TIME DEFAULT '23:59:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla: monotributo_scales (Escalas Oficiales Globales de Monotributo)
CREATE TABLE IF NOT EXISTS public.monotributo_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(2) NOT NULL UNIQUE,
  max_annual_billing NUMERIC(15, 2) NOT NULL,
  max_monthly_average NUMERIC(15, 2) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla: sales_receipts (Comprobantes Individuales de Venta)
CREATE TABLE IF NOT EXISTS public.sales_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  batch_id UUID,
  receipt_type VARCHAR(5) NOT NULL DEFAULT 'FC',
  pos_number INTEGER NOT NULL DEFAULT 1,
  receipt_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash' 
    CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer', 'mercadopago', 'other')),
  customer_doc_type VARCHAR(20) NOT NULL DEFAULT 'SIN_IDENTIFICAR' 
    CHECK (customer_doc_type IN ('SIN_IDENTIFICAR', 'DNI', 'CUIT')),
  customer_doc_number VARCHAR(11) DEFAULT '0',
  customer_name VARCHAR(150) DEFAULT 'Consumidor Final',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla: daily_batches (Lotes Diarios Formateados para ARCA)
CREATE TABLE IF NOT EXISTS public.daily_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  batch_date DATE NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by VARCHAR(20) NOT NULL CHECK (closed_by IN ('manual', 'cron')),
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  file_format VARCHAR(10) NOT NULL DEFAULT 'CSV',
  file_content_arca TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'generated' 
    CHECK (status IN ('generated', 'sent_email', 'downloaded', 'error_email')),
  sent_to_email VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_batch_date UNIQUE (business_id, batch_date)
);

-- Llave foránea diferida entre sales_receipts y daily_batches
ALTER TABLE public.sales_receipts 
  DROP CONSTRAINT IF EXISTS fk_sales_batch,
  ADD CONSTRAINT fk_sales_batch FOREIGN KEY (batch_id) REFERENCES public.daily_batches(id) ON DELETE SET NULL;

-- ==============================================================================
-- Seguridad y Políticas Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monotributo_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_batches ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR role = 'superadmin');

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');

-- Políticas para monotributo_scales (Lectura para todos los autenticados, Escritura solo superadmin)
CREATE POLICY "scales_read_all" ON public.monotributo_scales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "scales_write_superadmin" ON public.monotributo_scales
  FOR ALL TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Políticas para business_profiles
CREATE POLICY "business_owner_access" ON public.business_profiles
  FOR ALL TO authenticated USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM public.profiles WHERE accountant_id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Políticas para sales_receipts
CREATE POLICY "sales_owner_access" ON public.sales_receipts
  FOR ALL TO authenticated USING (
    business_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()) OR
    business_id IN (
      SELECT bp.id FROM public.business_profiles bp
      JOIN public.profiles p ON bp.user_id = p.id
      WHERE p.accountant_id = auth.uid()
    ) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Políticas para daily_batches
CREATE POLICY "batches_access" ON public.daily_batches
  FOR ALL TO authenticated USING (
    business_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()) OR
    business_id IN (
      SELECT bp.id FROM public.business_profiles bp
      JOIN public.profiles p ON bp.user_id = p.id
      WHERE p.accountant_id = auth.uid()
    ) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- ==============================================================================
-- Semillas de Escalas Oficiales de Monotributo (Categorías A a K)
-- ==============================================================================

INSERT INTO public.monotributo_scales (category, max_annual_billing, max_monthly_average, effective_from)
VALUES
  ('A', 6450000.00, 537500.00, CURRENT_DATE),
  ('B', 9450000.00, 787500.00, CURRENT_DATE),
  ('C', 13250000.00, 1104166.67, CURRENT_DATE),
  ('D', 16450000.00, 1370833.33, CURRENT_DATE),
  ('E', 19350000.00, 1612500.00, CURRENT_DATE),
  ('F', 24250000.00, 2020833.33, CURRENT_DATE),
  ('G', 29000000.00, 2416666.67, CURRENT_DATE),
  ('H', 44000000.00, 3666666.67, CURRENT_DATE),
  ('I', 49250000.00, 4104166.67, CURRENT_DATE),
  ('J', 56400000.00, 4700000.00, CURRENT_DATE),
  ('K', 68000000.00, 5666666.67, CURRENT_DATE)
ON CONFLICT (category) DO UPDATE
SET max_annual_billing = EXCLUDED.max_annual_billing,
    max_monthly_average = EXCLUDED.max_monthly_average,
    updated_at = NOW();
