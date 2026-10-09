import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App.jsx';
import AuthScreen from '../src/components/untitled-ui/AuthScreen.jsx';

describe('Impeccable UI: Modo Claro y Selector Directo de Rol (Sin Acordeón)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  });

  it('permite alternar entre Modo Oscuro y Modo Claro mediante el botón de tema en el Header', () => {
    render(<App />);
    
    // Por defecto inicia en dark o detecta esquema
    const themeBtn = screen.getByTestId('theme-toggle-btn');
    expect(themeBtn).toBeInTheDocument();

    // Click para alternar a Modo Claro
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('autoarca_theme')).toBe('light');

    // Click nuevamente para volver a Modo Oscuro
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('autoarca_theme')).toBe('dark');
  });

  it('permite pasar de Cliente a Contador con un solo clic directo en los botones segmentados sin acordeón ni desplegable', () => {
    render(<App />);

    // El botón directo de Cliente está activo inicialmente
    const clientPill = screen.getByTestId('role-pill-client');
    const accountantPill = screen.getByTestId('role-pill-accountant');
    const adminPill = screen.getByTestId('role-pill-superadmin');

    expect(clientPill).toHaveClass('active');
    expect(accountantPill).not.toHaveClass('active');
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();

    // Clic directo en Contador (sin abrir ningún acordeón o dropdown)
    fireEvent.click(accountantPill);

    // Debe activarse inmediatamente la vista de Estudio Contable
    expect(accountantPill).toHaveClass('active');
    expect(clientPill).not.toHaveClass('active');
    expect(screen.getByText(/Panel de Control del Contador/i)).toBeInTheDocument();

    // Clic directo en Admin
    fireEvent.click(adminPill);
    expect(adminPill).toHaveClass('active');
    expect(screen.getByText(/Escalas Oficiales de Monotributo/i)).toBeInTheDocument();

    // Clic directo de regreso a Cliente
    fireEvent.click(clientPill);
    expect(clientPill).toHaveClass('active');
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();
  });

  it('permite alternar el modo claro y oscuro desde la pantalla de bienvenida y login (AuthScreen)', () => {
    let currentTheme = 'dark';
    const toggleThemeMock = () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    };

    const { rerender } = render(
      <AuthScreen
        onAuthSuccess={() => {}}
        theme={currentTheme}
        onToggleTheme={toggleThemeMock}
      />
    );

    const authThemeBtn = screen.getByTestId('theme-toggle-btn');
    expect(authThemeBtn).toBeInTheDocument();

    fireEvent.click(authThemeBtn);
    expect(currentTheme).toBe('light');

    rerender(
      <AuthScreen
        onAuthSuccess={() => {}}
        theme={currentTheme}
        onToggleTheme={toggleThemeMock}
      />
    );
    expect(screen.getByTestId('theme-toggle-btn')).toHaveTextContent(/Oscuro/i);
  });
});
