// Supabase Edge Function: daily-closure-cron
// Se ejecuta diariamente a las 23:59:00 ART via pg_cron
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().slice(0, 10);

    // 1. Obtener comprobantes no asignados a un lote correspondientes al día de hoy
    const { data: openReceipts, error: receiptError } = await supabase
      .from("sales_receipts")
      .select("*, business_profiles(*, profiles(email, accountant_id))")
      .is("batch_id", null)
      .eq("date", today);

    if (receiptError) throw receiptError;

    // Agrupar por comercio y generar lotes
    return new Response(JSON.stringify({ success: true, processed: openReceipts?.length || 0 }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
