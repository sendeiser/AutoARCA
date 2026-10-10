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
  CopyIcon
} from './Icons.jsx';
import '../styles/accountantTaxCalendar.css';

export default function AccountantTaxCalendar({
  clients = []
}) {
  const [checklist, setChecklist] = useState({});

  // Asigna cada cliente a un grupo según la terminación de su CUIT (último dígito antes del guión o último carácter)
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

  // Cálculo de progreso general
  const totalTasks = clients.length * 3;
  const completedTasks = Object.values(checklist).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

          <div className="calendar-progress-pill">
            <span className="cal-progress-lbl">Cumplimiento del Mes:</span>
            <span className="cal-progress-val font-mono">{progressPercent}% ({completedTasks}/{totalTasks})</span>
          </div>
        </div>
      </CardHeader>

      <div className="tax-calendar-body">
        {/* Banner Vencimiento Fijo Monotributo */}
        <div className="calendar-fixed-banner">
          <div className="fixed-banner-icon">
            <ReceiptTaxIcon size={20} className="text-primary" />
          </div>
          <div className="fixed-banner-info">
            <strong>Vencimiento General Cuota Monotributo ARCA: Día 20 de cada mes</strong>
            <p>Aplica a todas las terminaciones de CUIT de Pequeños Contribuyentes (Régimen Simplificado Nacional).</p>
          </div>
        </div>

        {/* Grupos de Vencimientos por CUIT */}
        <div className="calendar-groups-grid">
          {Object.entries(groupedClients).map(([cuitGroup, groupClients]) => (
            <div key={cuitGroup} className="calendar-group-col">
              <div className="calendar-group-header">
                <div>
                  <span className="cuit-group-title">CUIT Terminados en {cuitGroup}</span>
                  <span className="cuit-group-vto">Vto. IIBB / CM03: Días 15 - 19</span>
                </div>
                <Badge variant={groupClients.length > 0 ? 'primary' : 'gray'}>
                  {groupClients.length} Clientes
                </Badge>
              </div>

              <div className="calendar-clients-list">
                {groupClients.length === 0 ? (
                  <div className="calendar-empty-sub">Sin clientes con esta terminación.</div>
                ) : (
                  groupClients.map((client) => {
                    const id = client.id;
                    const isDdjj = checklist[`${id}-ddjj`];
                    const isVep = checklist[`${id}-vep`];
                    const isCobro = checklist[`${id}-cobro`];

                    return (
                      <div key={id} className="calendar-client-item">
                        <div className="cal-client-head">
                          <strong className="cal-client-name">{client.fantasy_name || client.razon_social}</strong>
                          <span className="cal-client-cuit font-mono">{client.cuit}</span>
                        </div>

                        <div className="cal-tasks-checks">
                          <label className="cal-check-item">
                            <input
                              type="checkbox"
                              checked={!!isDdjj}
                              onChange={() => toggleCheck(id, 'ddjj')}
                            />
                            <span className={isDdjj ? 'check-done' : ''}>Lote / DDJJ</span>
                          </label>

                          <label className="cal-check-item">
                            <input
                              type="checkbox"
                              checked={!!isVep}
                              onChange={() => toggleCheck(id, 'vep')}
                            />
                            <span className={isVep ? 'check-done' : ''}>VEP Enviado</span>
                          </label>

                          <label className="cal-check-item">
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
          ))}
        </div>
      </div>
    </Card>
  );
}
