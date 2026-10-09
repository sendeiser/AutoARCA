-- ==============================================================================
-- Esquema Consolidado DDL: Plataforma SaaS ARCA Monotributo & Panel Contable
-- Supabase Target: https://oqwzldvbvdigilcekhmo.supabase.co
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla: profiles (Usuarios del Sistema con Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 4. Tabla: daily_batches (Lotes Diarios Formateados para ARCA)
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

-- 5. Tabla: sales_receipts (Comprobantes Individuales de Venta)
CREATE TABLE IF NOT EXISTS public.sales_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.daily_batches(id) ON DELETE SET NULL,
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monotributo_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_batches ENABLE ROW LEVEL SECURITY;
