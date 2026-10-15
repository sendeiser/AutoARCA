/**
 * accountantDocService.js — Servicio de Gestión Documental y Requerimientos de Clientes
 * Para Estudios Contables y Comercios (Gen 2 AutoARCA).
 * 
 * Resuelve el dolor principal del contador:
 * - Centraliza pedidos de extractos bancarios, facturas de compras y comprobantes.
 * - Elimina el caos de WhatsApp con enlaces de carga seguros por cliente.
 * - Genera recordatorios inteligentes por WhatsApp con lista de faltantes.
 * - Seguimiento de estados: Pendiente -> Entregado -> Auditado / Aprobado.
 */

const STORAGE_REQUESTS_KEY = 'autoarca_doc_requests';
const STORAGE_DOCS_KEY = 'autoarca_client_documents';

// Categorías oficiales de documentación contable
export const DOC_CATEGORIES = [
  { id: 'bank_statements', label: 'Extractos Bancarios y Billeteras', icon: 'bank' },
  { id: 'purchase_invoices', label: 'Facturas de Compras y Proveedores', icon: 'shopping' },
  { id: 'tax_services', label: 'Servicios, Alquileres e Impuestos', icon: 'tax' },
  { id: 'payroll_other', label: 'Laboral, Sueldos y Otros', icon: 'folder' }
];

// Requerimientos iniciales de demostración
export const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    cuit: '20301234567',
    business_name: 'Comercio San Martín',
    period: '2026-10',
    category: 'bank_statements',
    title: 'Extracto Banco Galicia (Octubre 2026)',
    description: 'Descargar el extracto en Excel o PDF con todos los movimientos y acreditaciones del mes.',
    status: 'submitted', // 'pending' | 'submitted' | 'approved' | 'rejected'
    due_date: '2026-10-20',
    created_at: '2026-10-01T10:00:00.000Z',
    upload_token: 'token-cuit-20301234567-2026-10'
  },
  {
    id: 'req-2',
    cuit: '20301234567',
    business_name: 'Comercio San Martín',
    period: '2026-10',
    category: 'bank_statements',
    title: 'Resumen Mercado Pago (Octubre 2026)',
    description: 'Reporte de cobros con QR y transferencias recibidas para conciliar con el límite de Monotributo.',
    status: 'pending',
    due_date: '2026-10-20',
    created_at: '2026-10-01T10:00:00.000Z',
    upload_token: 'token-cuit-20301234567-2026-10'
  },
  {
    id: 'req-3',
    cuit: '20301234567',
    business_name: 'Comercio San Martín',
    period: '2026-10',
    category: 'purchase_invoices',
    title: 'Facturas de Compra de Mercadería / Insumos',
    description: 'Tickets o Facturas A y B de proveedores para el balance de compras y deducciones.',
    status: 'pending',
    due_date: '2026-10-25',
    created_at: '2026-10-01T10:00:00.000Z',
    upload_token: 'token-cuit-20301234567-2026-10'
  },
  {
    id: 'req-4',
    cuit: '27289876543',
    business_name: 'Dra. Laura Gomez',
    period: '2026-10',
    category: 'bank_statements',
    title: 'Extracto Banco Santander & BBVA',
    description: 'Resumen consolidado de ingresos profesionales del período.',
    status: 'submitted',
    due_date: '2026-10-18',
    created_at: '2026-10-02T11:00:00.000Z',
    upload_token: 'token-cuit-27289876543-2026-10'
  },
  {
    id: 'req-5',
    cuit: '27289876543',
    business_name: 'Dra. Laura Gomez',
    period: '2026-10',
    category: 'tax_services',
    title: 'Comprobantes de Alquiler de Consultorio y Expensas',
    description: 'Comprobante formal para justificación del balance anual.',
    status: 'approved',
    due_date: '2026-10-15',
    created_at: '2026-10-02T11:00:00.000Z',
    upload_token: 'token-cuit-27289876543-2026-10'
  }
];

// Documentos subidos de demostración
export const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    request_id: 'req-1',
    cuit: '20301234567',
    file_name: 'extracto_galicia_octubre_2026.pdf',
    file_size_formatted: '1.2 MB',
    file_type: 'application/pdf',
    category: 'bank_statements',
    period: '2026-10',
    uploaded_at: '2026-10-10T14:22:00.000Z',
    status: 'review_pending',
    notes: 'Subido por el cliente desde Portal Web'
  },
  {
    id: 'doc-2',
    request_id: 'req-4',
    cuit: '27289876543',
    file_name: 'santander_resumen_profesional_oct.xlsx',
    file_size_formatted: '480 KB',
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'bank_statements',
    period: '2026-10',
    uploaded_at: '2026-10-11T09:40:00.000Z',
    status: 'review_pending',
    notes: 'Extracto exportado de Online Banking'
  },
  {
    id: 'doc-3',
    request_id: 'req-5',
    cuit: '27289876543',
    file_name: 'factura_alquiler_consultorio_10_2026.pdf',
    file_size_formatted: '820 KB',
    file_type: 'application/pdf',
    category: 'tax_services',
    period: '2026-10',
    uploaded_at: '2026-10-08T16:15:00.000Z',
    status: 'approved',
    notes: 'Validado por el contador el 09/10/2026'
  }
];

class AccountantDocService {
  constructor() {
    this._requests = null;
    this._documents = null;
  }

  _loadRequests() {
    if (this._requests) return this._requests;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_REQUESTS_KEY);
        if (stored) {
          this._requests = JSON.parse(stored);
          return this._requests;
        }
      }
    } catch {
      // fallback
    }
    this._requests = [...INITIAL_REQUESTS];
    this._saveRequests();
    return this._requests;
  }

  _saveRequests() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(this._requests));
      }
    } catch {
      // ignore
    }
  }

  _loadDocuments() {
    if (this._documents) return this._documents;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_DOCS_KEY);
        if (stored) {
          this._documents = JSON.parse(stored);
          return this._documents;
        }
      }
    } catch {
      // fallback
    }
    this._documents = [...INITIAL_DOCUMENTS];
    this._saveDocuments();
    return this._documents;
  }

  _saveDocuments() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(this._documents));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Obtiene todos los requerimientos creados
   */
  getAllRequests() {
    return [...this._loadRequests()];
  }

  /**
   * Obtiene requerimientos de un CUIT específico
   */
  getRequestsByCuit(cuit) {
    const list = this._loadRequests();
    const clean = String(cuit || '').replace(/[^0-9]/g, '');
    return list.filter((r) => r.cuit.replace(/[^0-9]/g, '') === clean);
  }

  /**
   * Crea un nuevo requerimiento de documentación
   */
  createRequest(data) {
    const list = this._loadRequests();
    const newReq = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cuit: String(data.cuit || '').trim(),
      business_name: String(data.business_name || '').trim(),
      period: data.period || new Date().toISOString().slice(0, 7),
      category: data.category || 'bank_statements',
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      status: 'pending',
      due_date: data.due_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      upload_token: `token-${data.cuit}-${data.period || Date.now()}`
    };

    list.unshift(newReq);
    this._requests = list;
    this._saveRequests();
    return newReq;
  }

  /**
   * Actualiza el estado de un requerimiento (pending, submitted, approved, rejected)
   */
  updateRequestStatus(requestId, status, feedback = '') {
    const list = this._loadRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        feedback: feedback || list[idx].feedback
      };
      this._requests = list;
      this._saveRequests();
      return list[idx];
    }
    return null;
  }

  /**
   * Obtiene todos los documentos subidos
   */
  getAllDocuments() {
    return [...this._loadDocuments()];
  }

  /**
   * Obtiene documentos de un CUIT
   */
  getDocumentsByCuit(cuit) {
    const list = this._loadDocuments();
    const clean = String(cuit || '').replace(/[^0-9]/g, '');
    return list.filter((d) => d.cuit.replace(/[^0-9]/g, '') === clean);
  }

  /**
   * Registra la subida de un archivo por el cliente
   */
  uploadDocument(docData) {
    const docs = this._loadDocuments();
    const newDoc = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_id: docData.request_id || null,
      cuit: String(docData.cuit || '').trim(),
      file_name: docData.file_name || 'documento_adjunto.pdf',
      file_size_formatted: docData.file_size_formatted || '500 KB',
      file_type: docData.file_type || 'application/pdf',
      category: docData.category || 'bank_statements',
      period: docData.period || new Date().toISOString().slice(0, 7),
      uploaded_at: new Date().toISOString(),
      status: 'review_pending',
      notes: docData.notes || 'Subido por el cliente'
    };

    docs.unshift(newDoc);
    this._documents = docs;
    this._saveDocuments();

    // Si estaba vinculado a un requerimiento, marcar el requerimiento como 'submitted'
    if (docData.request_id) {
      this.updateRequestStatus(docData.request_id, 'submitted');
    }

    return newDoc;
  }

  /**
   * Elimina un documento
   */
  deleteDocument(docId) {
    const docs = this._loadDocuments();
    this._documents = docs.filter((d) => d.id !== docId);
    this._saveDocuments();
    return true;
  }

  /**
   * Genera el enlace seguro de carga para el cliente
   */
  generateClientUploadLink(cuit, period = '') {
    const cleanCuit = String(cuit || '').replace(/[^0-9]/g, '');
    const cleanPeriod = period || new Date().toISOString().slice(0, 7);
    return `https://autoarca.com/portal-cliente/documentos?cuit=${cleanCuit}&periodo=${cleanPeriod}`;
  }

  /**
   * Genera texto pre-armado y URL para WhatsApp pidiéndole la documentación al cliente
   */
  generateWhatsAppDocRequestMessage(cuit, businessName, period = '', accountantProfile = {}) {
    const cleanCuit = String(cuit || '').replace(/[^0-9]/g, '');
    const requests = this.getRequestsByCuit(cleanCuit);
    const pending = requests.filter((r) => r.status === 'pending');
    const displayPeriod = period || new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const estudioName = accountantProfile.fantasy_name || accountantProfile.razon_social || 'Tu Estudio Contable';
    const uploadLink = this.generateClientUploadLink(cuit, period);

    let itemsList = '';
    if (pending.length > 0) {
      itemsList = pending.map((p) => `• ${p.title}`).join('\n');
    } else {
      itemsList = '• Extracto Bancario / Billeteras\n• Facturas de Compras / Gastos del mes';
    }

    const text = `Hola *${businessName || 'Comercio'}*! 👋 Te saludamos desde *${estudioName}*.\n\nPara poder cerrar tu liquidación y control fiscal del período *${displayPeriod}*, te solicitamos que nos compartas los siguientes comprobantes pendientes:\n\n${itemsList}\n\nPodés subirlos directamente en tu portal seguro sin comprimir:\n👉 ${uploadLink}\n\n¡Muchas gracias!`;

    const encoded = encodeURIComponent(text);
    return {
      text,
      url: `https://wa.me/?text=${encoded}`,
      uploadLink,
      pendingCount: pending.length
    };
  }

  /**
   * Métricas y estadísticas de cumplimiento documental para el estudio
   */
  getDocMetrics(clientList = []) {
    const allReqs = this.getAllRequests();
    const allDocs = this.getAllDocuments();

    const pendingReqs = allReqs.filter((r) => r.status === 'pending');
    const submittedReqs = allReqs.filter((r) => r.status === 'submitted');
    const approvedReqs = allReqs.filter((r) => r.status === 'approved');

    const totalClientsCount = clientList.length || 2;
    // Clientes que tienen al menos un requerimiento pendiente
    const cuitsWithPending = new Set(pendingReqs.map((r) => r.cuit.replace(/[^0-9]/g, '')));
    const compliantClientsCount = Math.max(0, totalClientsCount - cuitsWithPending.size);

    return {
      totalRequests: allReqs.length,
      pendingCount: pendingReqs.length,
      submittedCount: submittedReqs.length,
      approvedCount: approvedReqs.length,
      totalDocuments: allDocs.length,
      complianceRate: totalClientsCount > 0 ? (compliantClientsCount / totalClientsCount) * 100 : 100
    };
  }

  /**
   * Reinicia a valores semilla (para pruebas)
   */
  resetToDefaults() {
    this._requests = [...INITIAL_REQUESTS];
    this._documents = [...INITIAL_DOCUMENTS];
    this._saveRequests();
    this._saveDocuments();
    return true;
  }
}

export const accountantDocService = new AccountantDocService();
