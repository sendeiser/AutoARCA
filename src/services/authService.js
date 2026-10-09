/**
 * Servicio de Autenticación, Roles y Estado de Sesión
 */

export const INITIAL_SCALES = [
  { category: 'A', max_annual_billing: 6450000.00, max_monthly_average: 537500.00 },
  { category: 'B', max_annual_billing: 9450000.00, max_monthly_average: 787500.00 },
  { category: 'C', max_annual_billing: 13250000.00, max_monthly_average: 1104166.67 },
  { category: 'D', max_annual_billing: 16450000.00, max_monthly_average: 1370833.33 },
  { category: 'E', max_annual_billing: 19350000.00, max_monthly_average: 1612500.00 },
  { category: 'F', max_annual_billing: 24250000.00, max_monthly_average: 2020833.33 },
  { category: 'G', max_annual_billing: 29000000.00, max_monthly_average: 2416666.67 },
  { category: 'H', max_annual_billing: 44000000.00, max_monthly_average: 3666666.67 },
  { category: 'I', max_annual_billing: 49250000.00, max_monthly_average: 4104166.67 },
  { category: 'J', max_annual_billing: 56400000.00, max_monthly_average: 4700000.00 },
  { category: 'K', max_annual_billing: 68000000.00, max_monthly_average: 5666666.67 }
];

export const INITIAL_USERS = [
  {
    id: 'client-1',
    full_name: 'Martín González',
    email: 'martin@comercio.com',
    role: 'client',
    subscription_status: 'active',
    cuit: '20301234567',
    business_id: 'biz-1'
  },
  {
    id: 'accountant-1',
    full_name: 'Estudio Contable Méndez & Asoc.',
    email: 'mendez@estudiocontable.com',
    role: 'accountant',
    subscription_status: 'active'
  },
  {
    id: 'admin-1',
    full_name: 'Administrador General',
    email: 'admin@autoarca.com',
    role: 'superadmin',
    subscription_status: 'active'
  }
];

export const INITIAL_BUSINESS = {
  id: 'biz-1',
  user_id: 'client-1',
  cuit: '20301234567',
  razon_social: 'González Martín Comercial',
  fantasy_name: 'La Casa de Limpieza',
  monotributo_category: 'D',
  activity_type: 'products',
  pos_number: 1,
  address: 'Av. San Martín 1420',
  city: 'Chamical',
  province: 'La Rioja'
};
