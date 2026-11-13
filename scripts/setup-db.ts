import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

function loadEnvFile(fileName: string) {
  const envPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const dbUrl = (process.env.DATABASE_URL || '').trim();

if (!dbUrl) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env.local.');
  process.exit(1);
}

const sql = neon(dbUrl);
const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

async function main() {
  console.log('🔄 Conectando ao Neon e aplicando schema...');
  
  // Remove comentários SQL de linha e divide por ponto e vírgula
  const cleanedSql = schemaSql
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    console.log(`Executing: ${stmt.slice(0, 50).replace(/\n/g, ' ')}...`);
    await sql.query(stmt);
  }

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;

  console.log('✅ Tabelas criadas/verificadas com sucesso no Neon:');
  tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
}

main().catch((err) => {
  console.error('❌ Erro ao aplicar schema no Neon:', err?.message || err);
  process.exit(1);
});
