/**
 * Script Automatizado para Aplicar el Esquema SQL Completo en Supabase
 * Puede conectarse mediante:
 * 1. String de Conexión PostgreSQL (Pooler o Directo)
 * 2. Password de Base de Datos Supabase (PostgreSQL Password)
 * 3. Personal Access Token de Supabase Management API (sbp_...)
 * 4. Service Role Key (vía API Query o RPC)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'oqwzldvbvdigilcekhmo';
const sqlFilePath = path.join(__dirname, 'FULL_SETUP.sql');

async function main() {
  console.log('=== AutoARCA — Despliegue de Esquema en Supabase ===');
  console.log(`Proyecto Destino: ${PROJECT_REF}`);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: No se encontró el archivo SQL en ${sqlFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Obtener credenciales de argumentos o entorno
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const connectionString = process.env.DATABASE_URL || getArg('--db-url');
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || getArg('--db-password');
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN || getArg('--access-token');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getArg('--service-role-key');

  // Método 1: Conexión directa / Pooler con PostgreSQL (pg Client)
  if (connectionString || dbPassword) {
    const candidateUrls = connectionString
      ? [connectionString]
      : [
          `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require`,
          `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(dbPassword)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
          `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
          `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(dbPassword)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require`
        ];

    let connected = false;
    for (const connStr of candidateUrls) {
      console.log(`Probando conexión PostgreSQL: ${connStr.replace(/:[^:@]+@/, ':****@')}...`);
      const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log('✓ Conexión establecida con PostgreSQL.');
        console.log('Ejecutando sentencias DDL (tablas, RLS, índices, semillas)...');
        await client.query(sqlContent);
        console.log('✓ ¡Esquema y datos semillas aplicados exitosamente!');
        await client.end();
        connected = true;
        process.exit(0);
      } catch (err) {
        console.warn(`Aviso con host probado: ${err.message}`);
        try { await client.end(); } catch {}
      }
    }

    if (!connected) {
      console.error('No se pudo conectar a los hosts de PostgreSQL probados.');
    }
  }

  // Método 2: Supabase Management API con Access Token (sbp_...)
  if (accessToken) {
    console.log('Intentando ejecutar vía Supabase Management API...');
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sqlContent })
      });

      if (response.ok) {
        console.log('✓ ¡Esquema ejecutado exitosamente a través de la API de Supabase!');
        process.exit(0);
      } else {
        const errorText = await response.text();
        console.error('Error en Supabase API:', response.status, errorText);
      }
    } catch (err) {
      console.error('Fallo de red en Supabase API:', err.message);
    }
  }

  // Método 3: Service Role Key
  if (serviceRoleKey) {
    console.log('Intentando conexión con Service Role Key...');
    try {
      const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      });
      console.log('Respuesta endpoint REST:', response.status);
    } catch (err) {
      console.error('Error con Service Role Key:', err.message);
    }
  }

  console.log('\n======================================================');
  console.log('Uso del script:');
  console.log('1. Con Contraseña de BD (Recomendado):');
  console.log('   node supabase/apply-schema.js --db-password "TU_CONTRASEÑA_DE_POSTGRES"');
  console.log('2. Con Connection String completa:');
  console.log('   node supabase/apply-schema.js --db-url "postgres://postgres:..."');
  console.log('3. Con Supabase Access Token (sbp_...):');
  console.log('   node supabase/apply-schema.js --access-token "sbp_..."');
  console.log('======================================================');
}

main().catch(console.error);
