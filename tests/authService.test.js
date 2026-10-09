import { describe, it, expect, beforeEach } from 'vitest';
import { authService, INITIAL_USERS } from '../src/services/authService.js';

describe('authService - Sistema de Usuarios y Autenticación', () => {
  beforeEach(() => {
    authService.saveUsers([...INITIAL_USERS]);
  });

  it('inicia sesión con credenciales válidas', () => {
    const user = authService.login('martin@comercio.com', '1234');
    expect(user.full_name).toBe('Martín González');
    expect(user.role).toBe('client');
  });

  it('rechaza contraseñas incorrectas', () => {
    expect(() => {
      authService.login('martin@comercio.com', 'incorrecta');
    }).toThrow(/contraseña incorrecta/i);
  });

  it('registra un nuevo cliente con perfil de negocio asociado', () => {
    const newUser = authService.register({
      fullName: 'Ana Martínez',
      email: 'ana@bazar.com',
      password: 'mypassword',
      role: 'client',
      cuit: '27339998881',
      razonSocial: 'Bazar Ana',
      fantasyName: 'Bazar Central',
      monotributoCategory: 'B'
    });

    expect(newUser.full_name).toBe('Ana Martínez');
    expect(newUser.role).toBe('client');
    expect(newUser.subscription_status).toBe('trial');

    const business = authService.getBusinessForUser(newUser.id);
    expect(business.cuit).toBe('27339998881');
    expect(business.monotributo_category).toBe('B');
  });

  it('permite cambiar de usuario activo', () => {
    const accountant = authService.switchUser('accountant-1');
    expect(accountant.role).toBe('accountant');
    expect(authService.getCurrentSession().id).toBe('accountant-1');
  });

  it('actualiza el perfil del usuario', () => {
    const updated = authService.updateUserProfile('client-1', {
      phone: '+54 9 11 9999 8888'
    });
    expect(updated.phone).toBe('+54 9 11 9999 8888');
  });
});
