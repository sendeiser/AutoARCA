import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { soundService } from '../services/soundService.js';
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ReceiptTaxIcon,
  CalendarIcon,
  UsersIcon
} from './Icons.jsx';
import '../styles/accountantTaxCalendar.css';

const CUIT_GROUPS_META = {
  '0-1': { label: '0-1', vtoDate: 'Día 15', desc: 'Convenio Multilateral CM03 & Rentas Locales' },
  '2-3': { label: '2-3', vtoDate: 'Día 16', desc: 'Convenio Multilateral CM03 & Rentas Locales' },
  '4-5': { label: '4-5', vtoDate: 'Día 17', desc: 'Convenio Multilateral CM03 & Rentas Locales' },
  '6-7': { label: '6-7', vtoDate: 'Día 18', desc: 'Convenio Multilateral CM03 & Rentas Locales' },
  '8-9': { label: '8-9', vtoDate: 'Día 19', desc: 'Convenio Multilateral CM03 & Rentas Locales' }
};

export default function AccountantTaxCalendar({
  clients = []
}) {
  const [checklist, setChecklist] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [viewMode, setViewMode] = useState('cuit'); // 'cuit' | 'kanban'

  // Clasifica clientes por terminación de CUIT (último dígito numérico antes del guión verificador)
  const groupedClients = {
    '0-1': [],
    '2-3': [],
    '4-5': [],
    '6-7': [],
    '8-9': []
  };

  clients.forEach((c) => {
    const rawCuit = (c.cuit || '0').replace(/[^0-9]/g, '');
    const lastDigit = Number(rawCuit.slice(-2, -1) || rawCuit.slice(-1) || 0);

    if (lastDigit <= 1) groupedClients['0-1'].push(c);
    else if (lastDigit <= 3) groupedClients['2-3'].push(c);
    else if (lastDigit <= 5) groupedClients['4-5'].push(c);
    else if (lastDigit <= 7) groupedClients['6-7'].push(c);
    else groupedClients['8-9'].push(c);
  });

  const currentMonthName = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  const toggleCheck = (clientId, taskKey) => {
    soundService.playTap();
    setChecklist((prev) => ({
      ...prev,
      [`${clientId}-${taskKey}`]: !prev[`${clientId}-${taskKey}`]
    }));
  };

  // Cálculo de progreso general del mes
  const totalTasks = clients.length * 3;
  const completedTasks = Object.values(checklist).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtrado de grupos visibles
  const displayGroups = selectedGroup === 'all'
    ? Object.entries(groupedClients)
    : Object.entries(groupedClients).filter(([groupKey]) => groupKey === selectedGroup);

  // Clasificación para el Tablero Kanban por Urgencia
  const kanbanColumns = {
    urgent48h: {
      title: '🚨 Vencen en 48hs',
      desc: 'Días 15 y 16 (CUIT 0-1, 2-3)',
      clients: [...groupedClients['0-1'], ...groupedClients['2-3']].filter((c) => !checklist[`${c.id}-ddjj`] || !checklist[`${c.id}-vep`] || !checklist[`${c.id}-cobro`])
    },
    upcoming5d: {
      title: '⏳ Próximos 5 Días',
      desc: 'Días 17 al 19 (CUIT 4 al 9)',
      clients: [...groupedClients['4-5'], ...groupedClients['6-7'], ...groupedClients['8-9']].filter((c) => !checklist[`${c.id}-ddjj`] || !checklist[`${c.id}-vep`] || !checklist[`${c.id}-cobro`])
    },
    monotributoDay20: {
      title: '📅 Monotributo General',
      desc: 'Día 20 (Cuota Fija ARCA)',
      clients: clients.filter((c) => !checklist[`${c.id}-vep`])
    },
    completed: {
      title: '✅ Cumplimentados',
      desc: 'Obligaciones al día',
      clients: clients.filter((c) => checklist[`${c.id}-ddjj`] && checklist[`${c.id}-vep`] && checklist[`${c.id}-cobro`])
    }
  };

  return (
    <Card className="tax-calendar-card">
      <CardHeader>
        <div className="calendar-header-flex">
          <div>
            <div className="calendar-badge-row">
              <Badge variant="brand">CRONOGRAMA OFICIAL ARCA & COMARB</Badge>
              <span className="calendar-month-tag text-capitalize">{currentMonthName}</span>
            </div>
            <CardTitle>Calendario Impositivo Dinámico por Terminación de CUIT</CardTitle>
            <CardSubtitle>
              Control operativo de vencimientos de Monotributo (Día 20) y Liquidaciones de Ingresos Brutos (CM03 / Locales).
            </CardSubtitle>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Selector de Vista: CUIT vs Kanban */}
            <div className="cal-viewmode-toggle">
              <button
                type="button"
                className={`cal-view-btn ${viewMode === 'cuit' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setViewMode('cuit'); }}
              >
                📅 Terminación CUIT
              </button>
              <button
                type="button"
                className={`cal-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setViewMode('kanban'); }}
              >
                ⏱️ Kanban de Urgencia
              </button>
            </div>

            {/* Widget Circular de Progreso */}
            <div className="calendar-progress-widget">
              <div className="cal-donut-wrap">
                <svg width="42" height="42" viewBox="0 0 42 42" className="cal-donut-svg">
                  <circle cx="21" cy="21" r="16" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="21"
                    cy="21"
                    r="16"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 21 21)"
                  />
                </svg>
                <span className="cal-donut-text font-mono">{progressPercent}%</span>
              </div>
              <div>
                <span className="cal-progress-lbl">Cumplimiento Mensual</span>
                <span className="cal-progress-sub font-mono">
                  {completedTasks} de {totalTasks} tareas listas
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="tax-calendar-body">
        {/* Banner Vencimiento Fijo Monotributo General */}
        <div className="calendar-fixed-banner">
          <div className="fixed-banner-icon">
            <ReceiptTaxIcon size={22} className="text-primary" />
          </div>
          <div className="fixed-banner-info">
            <strong>Vencimiento General Cuota Monotributo ARCA: Día 20 de cada mes</strong>
            <p>Rige para todas las terminaciones de CUIT de Pequeños Contribuyentes en todo el país.</p>
          </div>
        </div>

        {viewMode === 'cuit' ? (
          <>
            {/* Barra de Filtros por Terminación de CUIT / Selector de Vencimiento */}
            <div className="cal-filter-toolbar">
              <span className="cal-filter-title">Filtrar por Grupo CUIT:</span>
              <div className="cal-filter-tabs">
                <button
                  type="button"
                  className={`cal-filter-tab ${selectedGroup === 'all' ? 'active' : ''}`}
                  onClick={() => { soundService.playKeyTap(); setSelectedGroup('all'); }}
                >
                  Todos ({clients.length})
                </button>
                {Object.keys(groupedClients).map((grp) => {
                  const count = groupedClients[grp].length;
                  const meta = CUIT_GROUPS_META[grp];
                  return (
                    <button
                      key={grp}
                      type="button"
                      className={`cal-filter-tab ${selectedGroup === grp ? 'active' : ''}`}
                      onClick={() => { soundService.playKeyTap(); setSelectedGroup(grp); }}
                    >
                      CUIT {grp} · {meta.vtoDate} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cronograma Estructurado en Secciones / Tarjetas */}
            <div className="calendar-timeline-container">
              {displayGroups.map(([cuitGroup, groupClients]) => {
                const meta = CUIT_GROUPS_META[cuitGroup];
                return (
                  <div key={cuitGroup} className="calendar-group-section">
                    <div className="calendar-group-header">
                      <div className="cal-group-title-row">
                        <span className="cuit-group-title">CUIT Terminados en {cuitGroup}</span>
                        <span className="cuit-group-vto-badge">Vto: {meta.vtoDate} (CM03 / IIBB)</span>
                      </div>
                      <Badge variant={groupClients.length > 0 ? 'primary' : 'gray'}>
                        {groupClients.length} {groupClients.length === 1 ? 'Cliente' : 'Clientes'}
                      </Badge>
                    </div>

                    <div className="calendar-clients-grid">
                      {groupClients.length === 0 ? (
                        <div className="calendar-empty-sub">
                          Sin clientes registrados con terminación {cuitGroup}.
                        </div>
                      ) : (
                        groupClients.map((client) => {
                          const id = client.id;
                          const isDdjj = checklist[`${id}-ddjj`];
                          const isVep = checklist[`${id}-vep`];
                          const isCobro = checklist[`${id}-cobro`];
                          const isAllDone = isDdjj && isVep && isCobro;

                          return (
                            <div key={id} className={`calendar-client-card ${isAllDone ? 'client-completed' : ''}`}>
                              <div className="cal-client-head">
                                <div className="cal-client-meta">
                                  <strong className="cal-client-name">
                                    {client.fantasy_name || client.razon_social}
                                  </strong>
                                  <span className="cal-client-cuit font-mono">{client.cuit}</span>
                                </div>
                                <div className="cal-client-status">
                                  <span className="cal-cat-badge">Cat. {client.monotributo_category || 'D'}</span>
                                  <Badge variant={isAllDone ? 'success' : 'warning'}>
                                    {isAllDone ? 'Al Día' : 'Pendiente'}
                                  </Badge>
                                </div>
                              </div>

                              <div className="cal-tasks-checks">
                                <label className={`cal-check-item ${isDdjj ? 'checked' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={!!isDdjj}
                                    onChange={() => toggleCheck(id, 'ddjj')}
                                  />
                                  <span className={isDdjj ? 'check-done' : ''}>Lote / DDJJ</span>
                                </label>

                                <label className={`cal-check-item ${isVep ? 'checked' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={!!isVep}
                                    onChange={() => toggleCheck(id, 'vep')}
                                  />
                                  <span className={isVep ? 'check-done' : ''}>VEP Enviado</span>
                                </label>

                                <label className={`cal-check-item ${isCobro ? 'checked' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={!!isCobro}
                                    onChange={() => toggleCheck(id, 'cobro')}
                                  />
                                  <span className={isCobro ? 'check-done' : ''}>Liquidado</span>
                                </label>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Tablero Kanban de Vencimientos por Urgencia */
          <div className="calendar-kanban-board">
            {Object.entries(kanbanColumns).map(([colKey, colData]) => (
              <div key={colKey} className={`kanban-col kanban-${colKey}`}>
                <div className="kanban-col-header">
                  <div>
                    <h4 className="kanban-col-title">{colData.title}</h4>
                    <span className="kanban-col-desc">{colData.desc}</span>
                  </div>
                  <Badge variant={colKey === 'urgent48h' ? 'error' : (colKey === 'upcoming5d' ? 'warning' : (colKey === 'completed' ? 'success' : 'brand'))}>
                    {colData.clients.length}
                  </Badge>
                </div>

                <div className="kanban-cards-stack">
                  {colData.clients.length === 0 ? (
                    <div className="kanban-empty-msg">
                      {colKey === 'completed' ? 'Aún sin clientes con todas las tareas listas' : 'Sin clientes pendientes en esta etapa'}
                    </div>
                  ) : (
                    colData.clients.map((client) => {
                      const id = client.id;
                      const isDdjj = checklist[`${id}-ddjj`];
                      const isVep = checklist[`${id}-vep`];
                      const isCobro = checklist[`${id}-cobro`];
                      const isAllDone = isDdjj && isVep && isCobro;

                      return (
                        <div key={`${colKey}-${id}`} className={`kanban-client-card ${isAllDone ? 'client-completed' : ''}`}>
                          <div className="kanban-card-top">
                            <div>
                              <strong className="kanban-client-name">{client.fantasy_name || client.razon_social}</strong>
                              <div className="kanban-client-cuit font-mono">{client.cuit}</div>
                            </div>
                            <span className="cal-cat-badge">Cat. {client.monotributo_category || 'D'}</span>
                          </div>

                          <div className="cal-tasks-checks kanban-checks">
                            <label className={`cal-check-item ${isDdjj ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!isDdjj}
                                onChange={() => toggleCheck(id, 'ddjj')}
                              />
                              <span className={isDdjj ? 'check-done' : ''}>DDJJ</span>
                            </label>

                            <label className={`cal-check-item ${isVep ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!isVep}
                                onChange={() => toggleCheck(id, 'vep')}
                              />
                              <span className={isVep ? 'check-done' : ''}>VEP</span>
                            </label>

                            <label className={`cal-check-item ${isCobro ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!isCobro}
                                onChange={() => toggleCheck(id, 'cobro')}
                              />
                              <span className={isCobro ? 'check-done' : ''}>Honorarios</span>
                            </label>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
