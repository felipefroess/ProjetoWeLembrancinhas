import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'we_admin_session';

function getSecretKey(): string {
  return (
    process.env.ADMIN_SECRET_KEY ||
    process.env.ADMIN_PASSWORD ||
    'we-lembrancinhas-default-secret-salt-2026'
  );
}

export function createSessionToken(username: string): string {
  const secret = getSecretKey();

  const payload = JSON.stringify({
    user: username,
    timestamp: Date.now(),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecretKey();
  if (!secret || !token || !token.includes('.')) return false;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    // Sessão válida por 7 dias
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  return verifySessionToken(sessionCookie?.value);
}

export async function setSessionCookie(username: string) {
  const cookieStore = await cookies();
  const token = createSessionToken(username);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
