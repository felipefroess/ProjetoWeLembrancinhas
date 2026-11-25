import { NextResponse } from 'next/server';
import { setSessionCookie, safeTimingCompare } from '@/lib/auth';

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
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

    const { username, password } = await request.json();

    const expectedUser = (process.env.ADMIN_USER || 'admin').trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD || 'welembrancinhas2026').trim();

    const cleanUser = (username || '').trim();
    const cleanPassword = (password || '').trim();

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
