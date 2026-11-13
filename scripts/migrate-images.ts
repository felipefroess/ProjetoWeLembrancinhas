/**
 * WE LEMBRANCINHAS - SCRIPT DE MIGRAÇÃO DE IMAGENS
 * 
 * Este script automatiza a migração de fotos locais (public/uploads/) e imagens
 * hospedadas no Supabase Storage para o novo Object Storage externo (Cloudflare R2 ou AWS S3).
 * Ao final, atualiza as URLs de todos os produtos no banco PostgreSQL (Neon) e nos arquivos locais.
 * 
 * Execução:
 *   npm run migrate:images
 *   ou: node scripts/migrate-images.ts
 */

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';

// 1. Carrega variáveis de ambiente de .env.local ou .env se existirem
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

// 2. Validação da configuração do S3/R2
const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '').trim();
const bucketName = (process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'welembrancinhas-images').trim();
const publicUrl = (process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || '').trim();

let endpoint = (process.env.S3_ENDPOINT || '').trim();
if (!endpoint && accountId) {
  endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
}
const region = (process.env.S3_REGION || 'auto').trim();

const isStorageReady = Boolean(accessKeyId && secretAccessKey && (endpoint || accountId));

if (!isStorageReady) {
  console.error('\n❌ ERRO: Object Storage (R2/S3) não configurado!');
  console.error('Por favor, preencha as variáveis R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_ACCOUNT_ID (ou S3_*) no seu arquivo .env.local.\n');
  process.exit(1);
}

const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function computePublicUrl(fileName: string): string {
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${fileName}`;
  }
  if (endpoint.includes('r2.cloudflarestorage.com')) {
    return `https://${bucketName}.${endpoint.replace('https://', '')}/${fileName}`;
  }
  return `${endpoint.replace(/\/$/, '')}/${bucketName}/${fileName}`;
}

async function uploadToStorage(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return computePublicUrl(key);
}

async function fetchBufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem remota (${res.status} ${res.statusText}): ${url}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// 3. Execução Principal
async function runMigration() {
  console.log('========================================================================');
  console.log('🚀 INICIANDO MIGRAÇÃO DE IMAGENS PARA OBJECT STORAGE (R2 / S3)');
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  console.log('========================================================================\n');

  const customProductsPath = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
  let products: any[] = [];
  if (fs.existsSync(customProductsPath)) {
    products = JSON.parse(fs.readFileSync(customProductsPath, 'utf-8'));
  }

  // Mapeamento de URL antiga -> nova URL na CDN
  const urlMap = new Map<string, string>();

  // Coleta todas as URLs ou caminhos de imagens referenciados
  function collectImageUrls(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (typeof obj.image === 'string' && obj.image.trim()) {
      urlMap.set(obj.image.trim(), '');
    }
    if (Array.isArray(obj.images)) {
      obj.images.forEach((img: any) => {
        if (typeof img === 'string' && img.trim()) {
          urlMap.set(img.trim(), '');
        }
      });
    }
    if (Array.isArray(obj.variations)) {
      obj.variations.forEach((v: any) => {
        if (v && typeof v.image === 'string' && v.image.trim()) {
          urlMap.set(v.image.trim(), '');
        }
        if (v && typeof v.image2 === 'string' && v.image2.trim()) {
          urlMap.set(v.image2.trim(), '');
        }
        if (v && Array.isArray(v.images)) {
          v.images.forEach((img: any) => {
            if (typeof img === 'string' && img.trim()) urlMap.set(img.trim(), '');
          });
        }
      });
    }
  }

  products.forEach(collectImageUrls);

  // Também inclui todos os arquivos presentes na pasta public/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const localFiles = fs.readdirSync(uploadsDir);
    for (const f of localFiles) {
      if (!urlMap.has(`/uploads/${f}`)) {
        urlMap.set(`/uploads/${f}`, '');
      }
    }
  }

  console.log(`🔍 Total de referências únicas de imagem encontradas: ${urlMap.size}`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [oldUrl] of urlMap.entries()) {
    // Se já estiver no novo bucket/CDN, ignora
    if (publicUrl && oldUrl.startsWith(publicUrl)) {
      urlMap.set(oldUrl, oldUrl);
      skippedCount++;
      continue;
    }

    try {
      let buffer: Buffer | null = null;
      let targetFileName = '';
      let mimeType = 'image/jpeg';

      if (oldUrl.startsWith('/uploads/') || oldUrl.startsWith('uploads/')) {
        // Imagem local em public/uploads/
        const cleanName = oldUrl.replace(/^\/?uploads\//, '');
        const diskPath = path.join(process.cwd(), 'public', 'uploads', cleanName);
        if (!fs.existsSync(diskPath)) {
          console.warn(`⚠️ Arquivo local não encontrado em disco: ${diskPath}`);
          errorCount++;
          continue;
        }
        buffer = fs.readFileSync(diskPath);
        targetFileName = cleanName;
        mimeType = getMimeType(cleanName);
      } else if (oldUrl.startsWith('/images/')) {
        // Imagem estática do catálogo padrão
        const cleanPath = oldUrl.replace(/^\//, '');
        const diskPath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(diskPath)) {
          buffer = fs.readFileSync(diskPath);
          targetFileName = path.basename(cleanPath);
          mimeType = getMimeType(diskPath);
        } else {
          skippedCount++;
          continue;
        }
      } else if (oldUrl.startsWith('http://') || oldUrl.startsWith('https://')) {
        // Imagem remota (ex: Supabase Storage)
        console.log(`⬇️ Baixando imagem remota: ${oldUrl}`);
        buffer = await fetchBufferFromUrl(oldUrl);
        const urlObj = new URL(oldUrl);
        targetFileName = path.basename(urlObj.pathname) || `img-${Date.now()}.jpg`;
        mimeType = getMimeType(targetFileName);
      } else {
        skippedCount++;
        continue;
      }

      if (!buffer) continue;

      console.log(`⬆️ Enviando para Storage: ${targetFileName}...`);
      const newUrl = await uploadToStorage(buffer, targetFileName, mimeType);
      urlMap.set(oldUrl, newUrl);
      migratedCount++;
      console.log(`   ✅ Sucesso -> ${newUrl}`);
    } catch (err: any) {
      console.error(`   ❌ Falha ao migrar '${oldUrl}':`, err?.message || err);
      errorCount++;
    }
  }

  console.log('\n------------------------------------------------------------------------');
  console.log(`📊 Migração concluída: ${migratedCount} enviadas | ${skippedCount} ignoradas | ${errorCount} erros`);
  console.log('------------------------------------------------------------------------\n');

  // 4. Atualiza as referências nos produtos
  function replaceUrls(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (typeof obj.image === 'string' && urlMap.has(obj.image.trim()) && urlMap.get(obj.image.trim())) {
      obj.image = urlMap.get(obj.image.trim());
    }
    if (Array.isArray(obj.images)) {
      obj.images = obj.images.map((img: any) => {
        if (typeof img === 'string' && urlMap.has(img.trim()) && urlMap.get(img.trim())) {
          return urlMap.get(img.trim());
        }
        return img;
      });
    }
    if (Array.isArray(obj.variations)) {
      obj.variations.forEach((v: any) => {
        if (v && typeof v.image === 'string' && urlMap.has(v.image.trim()) && urlMap.get(v.image.trim())) {
          v.image = urlMap.get(v.image.trim());
        }
        if (v && typeof v.image2 === 'string' && urlMap.has(v.image2.trim()) && urlMap.get(v.image2.trim())) {
          v.image2 = urlMap.get(v.image2.trim());
        }
        if (v && Array.isArray(v.images)) {
          v.images = v.images.map((img: any) => {
            if (typeof img === 'string' && urlMap.has(img.trim()) && urlMap.get(img.trim())) {
              return urlMap.get(img.trim());
            }
            return img;
          });
        }
      });
    }
  }

  products.forEach(replaceUrls);

  // Grava de volta em custom-products.json
  fs.writeFileSync(customProductsPath, JSON.stringify(products, null, 2), 'utf-8');
  console.log('💾 Arquivo local src/data/custom-products.json atualizado com as novas URLs.');

  // 5. Se DATABASE_URL estiver configurada, atualiza no banco Neon também
  const rawDbUrl = (process.env.DATABASE_URL || '').trim();
  if (rawDbUrl && rawDbUrl.startsWith('postgres') && !rawDbUrl.includes('placeholder')) {
    try {
      console.log('🔄 Sincronizando novas URLs com o banco PostgreSQL (Neon)...');
      const db = neon(rawDbUrl);
      const nowIso = new Date().toISOString();
      for (const p of products) {
        await db`
          INSERT INTO public.products (id, data, created_at, updated_at)
          VALUES (${p.id}, ${JSON.stringify(p)}::jsonb, ${nowIso}, ${nowIso})
          ON CONFLICT (id) DO UPDATE
          SET data = ${JSON.stringify(p)}::jsonb, updated_at = ${nowIso}
        `;
      }
      console.log('✨ Banco PostgreSQL (Neon) sincronizado com sucesso!');
    } catch (dbErr: any) {
      console.error('⚠️ Falha ao atualizar banco Neon (verifique sua conexão):', dbErr?.message);
    }
  }

  console.log('\n🎉 Processo de migração de imagens finalizado com êxito!\n');
}

runMigration().catch((err) => {
  console.error('Erro fatal durante a migração:', err);
  process.exit(1);
});

