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

  it('no expone selectores ni conmutadores de roles en el Header, manteniendo la sesión protegida', () => {
    render(<App />);

    // El Header no expone selectores, ni pills, ni dropdowns ni badges de conmutación
    expect(screen.queryByTestId('role-pill-client')).not.toBeInTheDocument();
    expect(screen.queryByTestId('role-pill-accountant')).not.toBeInTheDocument();
    expect(screen.queryByTestId('role-pill-superadmin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('role-switcher-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-role-badge')).not.toBeInTheDocument();
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

  it('no muestra el boton de Supabase DB en el Header', () => {
    render(<App />);
    expect(screen.queryByText(/Supabase DB/i)).not.toBeInTheDocument();
  });
});
