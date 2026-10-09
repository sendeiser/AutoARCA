/**
 * Servicio de Sincronización y Persistencia Remota con Supabase
 * Maneja operaciones en la base de datos PostgreSQL de Supabase con tolerancia a fallos offline-first.
 */

import { supabase, SUPABASE_URL } from './supabaseClient.js';

export const supabaseDataService = {
  // Comprobación de salud y estado de las 5 tablas en Supabase
  async checkDatabaseHealth() {
    const startTime = Date.now();
    const result = {
      isOnline: false,
      url: SUPABASE_URL,
      projectId: 'oqwzldvbvdigilcekhmo',
      latencyMs: 0,
      tables: {
        profiles: false,
        business_profiles: false,
        monotributo_scales: false,
        sales_receipts: false,
        daily_batches: false
      },
      error: null
    };

    try {
      // Probar auth o sesión básica
      const authTest = await supabase.auth.getSession();
      result.isOnline = !authTest.error;

      // Verificar existencia de cada tabla
      const tableNames = [
        'profiles',
        'business_profiles',
        'monotributo_scales',
        'sales_receipts',
        'daily_batches'
      ];

      for (const tName of tableNames) {
        try {
          const { error } = await supabase.from(tName).select('id').limit(1);
          // Si el código de error no es PGRST205 ni 42P01 (tabla inexistente), consideramos la tabla creada
          result.tables[tName] = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
        } catch {
          result.tables[tName] = false;
        }
      }

      result.latencyMs = Date.now() - startTime;
      return result;
    } catch (err) {
      result.error = err.message;
      result.latencyMs = Date.now() - startTime;
      return result;
    }
  },

  // Sincronizar comprobante de venta hacia Supabase
  async syncReceipt(receipt) {
    try {
      const payload = {
        id: receipt.id?.startsWith('rcpt-') ? undefined : receipt.id,
        business_id: receipt.business_id,
        receipt_type: receipt.receipt_type || 'FC',
        pos_number: receipt.pos_number || 1,
        receipt_number: receipt.receipt_number,
        date: receipt.date,
        time: receipt.time || '12:00:00',
        amount: receipt.amount,
        payment_method: receipt.payment_method || 'cash',
        customer_doc_type: receipt.customer_doc_type || 'SIN_IDENTIFICAR',
        customer_doc_number: receipt.customer_doc_number || '0',
        customer_name: receipt.customer_name || 'Consumidor Final',
        notes: receipt.notes || ''
      };

      const { data, error } = await supabase.from('sales_receipts').insert([payload]).select();
      if (error) {
        console.warn('[Supabase Sync] Almacenado localmente, pendiente sincronización en nube:', error.message);
        return { success: false, fallback: true, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, fallback: true, error: err.message };
    }
  },

  // Sincronizar lote diario hacia Supabase
  async syncBatch(batch) {
    try {
      const payload = {
        business_id: batch.business_id,
        batch_date: batch.batch_date,
        closed_by: batch.closed_by || 'manual',
        total_sales_count: batch.total_sales_count || 0,
        total_amount: batch.total_amount || 0,
        file_format: batch.file_format || 'CSV',
        file_content_arca: batch.file_content_arca || '',
        status: batch.status || 'generated',
        sent_to_email: batch.sent_to_email || null
      };

      const { data, error } = await supabase.from('daily_batches').insert([payload]).select();
      if (error) {
        return { success: false, fallback: true, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, fallback: true, error: err.message };
    }
  },

  // Obtener escalas de monotributo desde Supabase
  async fetchScales() {
    try {
      const { data, error } = await supabase
        .from('monotributo_scales')
        .select('*')
        .order('category', { ascending: true });

      if (error || !data || data.length === 0) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  // Sincronizar usuario o contador hacia Supabase profiles
  async syncUser(user) {
    try {
      const payload = {
        id: user.id && user.id.includes('-') && user.id.length >= 32 ? user.id : undefined,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || null,
        accountant_id: user.accountant_id || null,
        subscription_status: user.subscription_status || 'active'
      };

      const { data, error } = await supabase.from('profiles').upsert([payload], { onConflict: 'email' }).select();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Actualizar vinculación de contador en Supabase
  async updateClientAccountant(clientId, accountantId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ accountant_id: accountantId })
        .eq('id', clientId)
        .select();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Obtener clientes vinculados a un contador desde Supabase
  async fetchAccountantClients(accountantId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          subscription_status,
          business_profiles (
            id,
            cuit,
            razon_social,
            fantasy_name,
            monotributo_category
          )
        `)
        .eq('accountant_id', accountantId);

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }
};
