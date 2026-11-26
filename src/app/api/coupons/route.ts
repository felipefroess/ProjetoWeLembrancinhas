import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} from '@/lib/couponsStore';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const coupons = await getAllCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('Erro na API de cupons (GET):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar cupons.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'create') {
      if (!(await isAuthenticated())) {
        return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
      }
      const result = await createCoupon({
        code: body.code,
        type: body.type,
        value: body.value,
        description: body.description,
        minOrderValue: body.minOrderValue,
        expiresAt: body.expiresAt,
        isActive: body.isActive,
        firstPurchaseOnly: Boolean(body.firstPurchaseOnly),
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Erro ao criar cupom.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        coupon: result.coupon,
        message: 'Cupom criado com sucesso!',
      });
    }

    const rawCode = (body.code || '').trim();
    const subtotal = Number(body.subtotal) || 0;
    const phone = body.phone ? String(body.phone).trim() : undefined;
    const eligibleSubtotal = typeof body.eligibleSubtotal === 'number' ? body.eligibleSubtotal : undefined;
    const hasOnlyWholesale = Boolean(body.hasOnlyWholesale);

    const validation = await validateCoupon(rawCode, subtotal, phone, {
      eligibleSubtotal,
      hasOnlyWholesale,
    });
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: validation.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...validation,
    });
  } catch (error) {
    console.error('Erro na API de cupons (POST):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar cupom.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'O ID do cupom é obrigatório.' },
        { status: 400 }
      );
    }

    const result = await updateCoupon(id, updates);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao atualizar cupom.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: result.coupon,
      message: 'Cupom atualizado com sucesso!',
    });
  } catch (error) {
    console.error('Erro na API de cupons (PATCH):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar cupom.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cupom não informado.' },
        { status: 400 }
      );
    }

    const result = await deleteCoupon(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao excluir cupom.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cupom excluído com sucesso!',
    });
  } catch (error) {
    console.error('Erro na API de cupons (DELETE):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir cupom.' },
      { status: 500 }
    );
  }
}
