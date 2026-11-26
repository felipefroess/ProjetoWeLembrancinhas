import { NextResponse } from 'next/server';
import { setSessionCookie, safeTimingCompare } from '@/lib/auth';

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(request: Request): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim().slice(0, 64);
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim().slice(0, 64);
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map((p) => p.trim()).filter(Boolean);
    return (parts[parts.length - 1] || '127.0.0.1').slice(0, 64);
  }
  return '127.0.0.1';
}

function checkRateLimit(ip: string): { blocked: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { blocked: false };

  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { blocked: true, remainingMinutes };
  }

  if (record.lockedUntil <= now && record.lockedUntil > 0) {
    loginAttempts.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000;
  }

  loginAttempts.set(ip, record);
}

function recordSuccessfulAttempt(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (rateLimit.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Muitas tentativas incorretas. Acesso temporariamente bloqueado por ${rateLimit.remainingMinutes} minuto(s).`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body || {};

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Usuário e senha devem ser informados.' },
        { status: 400 }
      );
    }

    const expectedUser = (process.env.ADMIN_USER || 'admin').trim();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    const expectedPassword = envPassword || (process.env.NODE_ENV !== 'production' ? 'welembrancinhas2026' : '');

    if (!expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_PASSWORD não configurada no servidor.' },
        { status: 500 }
      );
    }

    const cleanUser = username.trim();
    const cleanPassword = password.trim();

    const isUserValid = safeTimingCompare(cleanUser.toLowerCase(), expectedUser.toLowerCase());
    const isPasswordValid = safeTimingCompare(cleanPassword, expectedPassword);

    if (isUserValid && isPasswordValid) {
      recordSuccessfulAttempt(ip);
      await setSessionCookie(cleanUser);
      return NextResponse.json({ success: true, message: 'Autenticado com sucesso' });
    }

    recordFailedAttempt(ip);
    return NextResponse.json({ success: false, error: 'Usuário ou senha incorretos' }, { status: 401 });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar login' }, { status: 500 });
  }
}
