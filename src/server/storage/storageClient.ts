import 'server-only';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

/**
 * WE LEMBRANCINHAS - OBJECT STORAGE (CLOUDFLARE R2 / S3 COMPATÍVEL)
 * 
 * Camada de upload de imagens que envia arquivos diretamente para um Object Storage
 * externo (como Cloudflare R2 ou AWS S3) e retorna apenas a URL pública HTTPS para ser
 * salva no banco de dados.
 */

interface UploadResult {
  success: boolean;
  url: string;
  provider: 'r2' | 's3' | 'local';
  error?: string;
}

function getS3Config() {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (
    process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || ''
  ).trim();
  const bucketName = (
    process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'welembrancinhas-images'
  ).trim();
  const publicUrl = (process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || '').trim();

  let endpoint = (process.env.S3_ENDPOINT || '').trim();
  if (!endpoint && accountId) {
    endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  }

  const region = (process.env.S3_REGION || 'auto').trim();

  const isConfigured = Boolean(accessKeyId && secretAccessKey && (endpoint || accountId));

  return {
    isConfigured,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    region,
    publicUrl,
    isR2: Boolean(accountId || endpoint.includes('r2.cloudflarestorage.com')),
  };
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  const config = getS3Config();
  if (!config.isConfigured) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Faz o upload de um buffer de imagem para o Object Storage externo (R2/S3)
 * ou realiza fallback local caso o storage ainda não tenha sido configurado no ambiente.
 */
export async function uploadImageToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  const config = getS3Config();

  // 1. Envio para Cloudflare R2 ou AWS S3 (Produção / Recomendado)
  if (config.isConfigured) {
    try {
      const client = getS3Client();
      if (!client) {
        throw new Error('Falha ao inicializar cliente S3/R2.');
      }

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
        })
      );

      let finalPublicUrl = '';
      if (config.publicUrl) {
        finalPublicUrl = `${config.publicUrl.replace(/\/$/, '')}/${fileName}`;
      } else if (config.endpoint.includes('r2.cloudflarestorage.com')) {
        finalPublicUrl = `https://${config.bucketName}.${config.endpoint.replace('https://', '')}/${fileName}`;
      } else {
        finalPublicUrl = `${config.endpoint.replace(/\/$/, '')}/${config.bucketName}/${fileName}`;
      }

      return {
        success: true,
        url: finalPublicUrl,
        provider: config.isR2 ? 'r2' : 's3',
      };
    } catch (err: any) {
      console.error('Erro ao enviar imagem para o Object Storage (R2/S3):', err);
      // Se falhar a conexão com o bucket em desenvolvimento, registra e prossegue
      return {
        success: false,
        url: '',
        provider: 'r2',
        error: `Erro no upload para Object Storage: ${err?.message || 'Falha de comunicação'}`,
      };
    }
  }

  // 2. Fallback de Desenvolvimento: Armazena em public/uploads localmente
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const localFilePath = path.join(uploadsDir, fileName);
    await fs.writeFile(localFilePath, buffer);

    console.warn(
      `[Storage] R2/S3 não configurado em .env.local. Salvando '${fileName}' em public/uploads/ como fallback local.`
    );

    return {
      success: true,
      url: `/uploads/${fileName}`,
      provider: 'local',
    };
  } catch (localErr: any) {
    console.error('Erro ao salvar imagem localmente:', localErr);
    return {
      success: false,
      url: '',
      provider: 'local',
      error: 'Falha ao salvar imagem no armazenamento.',
    };
  }
}

