/**
 * Servicio Integral de Autenticación, Usuarios y Sesiones (AutoARCA)
 * Soporta persistencia en localStorage, registro de roles, perfil comercial y vinculación de contadores.
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
    password: '1234',
    phone: '+54 3826 401234',
    role: 'client',
    subscription_status: 'active',
    cuit: '20301234567',
    business_id: 'biz-1',
    accountant_id: 'accountant-1'
  },
  {
    id: 'accountant-1',
    full_name: 'Estudio Contable Méndez & Asoc.',
    email: 'mendez@estudiocontable.com',
    password: '1234',
    phone: '+54 11 4321 9876',
    role: 'accountant',
    subscription_status: 'active'
  },
  {
    id: 'admin-1',
    full_name: 'SuperAdmin General',
    email: 'admin@autoarca.com',
    password: '1234',
    phone: '+54 11 5000 0000',
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

const STORAGE_KEY_USERS = 'autoarca_users_v2';
const STORAGE_KEY_SESSION = 'autoarca_session_v2';
const STORAGE_KEY_BUSINESSES = 'autoarca_businesses_v2';
const STORAGE_KEY_SCALES = 'autoarca_scales_v2';

function getStorage(key, defaultValue) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export const authService = {
  // Obtener lista completa de usuarios
  getUsers() {
    return getStorage(STORAGE_KEY_USERS, INITIAL_USERS);
  },

  // Guardar usuarios
  saveUsers(users) {
    setStorage(STORAGE_KEY_USERS, users);
    return users;
  },

  // Obtener sesión activa
  getCurrentSession() {
    const session = getStorage(STORAGE_KEY_SESSION, null);
    if (session) return session;
    // Si no hay sesión, loguear por defecto a Martin Gonzalez para que siempre esté lista la app
    const users = this.getUsers();
    const defaultUser = users.find((u) => u.id === 'client-1') || users[0];
    this.setCurrentSession(defaultUser);
    return defaultUser;
  },

  setCurrentSession(user) {
    setStorage(STORAGE_KEY_SESSION, user);
    return user;
  },

  // Inicio de sesión con validación de credenciales
  login(email, password) {
    const users = this.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!found) {
      throw new Error('No existe ningún usuario registrado con ese correo electrónico.');
    }

    if (found.password && found.password !== password) {
      throw new Error('Contraseña incorrecta. (Tip demo: la clave es 1234)');
    }

    this.setCurrentSession(found);
    return found;
  },

  // Registro de nuevo usuario
  register({
    fullName,
    email,
    password,
    role = 'client',
    phone = '',
    cuit = '',
    razonSocial = '',
    fantasyName = '',
    monotributoCategory = 'A',
    activityType = 'products',
    posNumber = 1,
    accountantId = null
  }) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newBizId = `biz-${Date.now()}`;

    const newUser = {
      id: newUserId,
      full_name: fullName.trim(),
      email: cleanEmail,
      password: password || '1234',
      phone,
      role,
      subscription_status: 'trial',
      cuit: cuit.replace(/[^0-9]/g, ''),
      business_id: role === 'client' ? newBizId : null,
      accountant_id: accountantId || 'accountant-1',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    // Si es cliente, crear y persistir su perfil de negocio
    if (role === 'client') {
      const businesses = this.getBusinesses();
      const newBusiness = {
        id: newBizId,
        user_id: newUserId,
        cuit: cuit.replace(/[^0-9]/g, '') || '20000000001',
        razon_social: razonSocial.trim() || fullName.trim(),
        fantasy_name: fantasyName.trim() || fullName.trim(),
        monotributo_category: monotributoCategory,
        activity_type: activityType,
        pos_number: Number(posNumber) || 1,
        address: 'Dirección Comercial',
        city: 'Ciudad',
        province: 'Buenos Aires'
      };
      businesses.push(newBusiness);
      this.saveBusinesses(businesses);
    }

    this.setCurrentSession(newUser);
    return newUser;
  },

  // Cerrar sesión
  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_SESSION);
    }
    return null;
  },

  // Conmutador rápido de usuario para demostraciones
  switchUser(userId) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      this.setCurrentSession(user);
      return user;
    }
    return null;
  },

  // Actualizar datos de perfil de usuario
  updateUserProfile(userId, updates) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveUsers(users);

      const current = this.getCurrentSession();
      if (current && current.id === userId) {
        this.setCurrentSession(users[idx]);
      }
      return users[idx];
    }
    throw new Error('Usuario no encontrado');
  },

  // Perfiles de negocio
  getBusinesses() {
    return getStorage(STORAGE_KEY_BUSINESSES, [INITIAL_BUSINESS]);
  },

  saveBusinesses(businesses) {
    setStorage(STORAGE_KEY_BUSINESSES, businesses);
    return businesses;
  },

  getBusinessForUser(userId) {
    const businesses = this.getBusinesses();
    const found = businesses.find((b) => b.user_id === userId);
    if (found) return found;
    return INITIAL_BUSINESS;
  },

  updateBusinessProfile(businessId, updates) {
    const businesses = this.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === businessId);
    if (idx !== -1) {
      businesses[idx] = { ...businesses[idx], ...updates };
      this.saveBusinesses(businesses);
      return businesses[idx];
    }
    return null;
  },

  // Escalas de Monotributo
  getScales() {
    return getStorage(STORAGE_KEY_SCALES, INITIAL_SCALES);
  },

  saveScales(scales) {
    setStorage(STORAGE_KEY_SCALES, scales);
    return scales;
  }
};
