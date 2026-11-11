import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CouponItem {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minOrderValue?: number;
  isActive?: boolean;
}

function loadCoupons(): CouponItem[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'coupons.json');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler cupons:', error);
    return [];
  }
}

// GET: Retornar lista de cupons (para o admin ou consulta)
export async function GET() {
  const coupons = loadCoupons();
  return NextResponse.json({ success: true, coupons });
}

// POST: Validar cupom enviado pelo carrinho
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCode = (body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, message: 'Digite o código do cupom.' },
        { status: 400 }
      );
    }

    const coupons = loadCoupons();
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === rawCode && c.isActive !== false
    );

    if (!matched) {
      return NextResponse.json({
        valid: false,
        message: 'Cupom inválido ou não encontrado.',
      });
    }

    if (matched.minOrderValue && subtotal < matched.minOrderValue) {
      const minFormatted = matched.minOrderValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      return NextResponse.json({
        valid: false,
        message: `Este cupom é válido para pedidos a partir de ${minFormatted}.`,
      });
    }

    let discountAmount = 0;
    if (matched.type === 'percentage') {
      discountAmount = Number(((subtotal * matched.value) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(matched.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      message: 'Cupom aplicado com sucesso!',
      coupon: {
        code: matched.code,
        type: matched.type,
        value: matched.value,
        description: matched.description || '',
      },
      discountAmount,
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao validar cupom.' },
      { status: 500 }
    );
  }
}
