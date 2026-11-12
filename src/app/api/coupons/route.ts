import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  validateCoupon 
} from '@/lib/couponsStore';

// GET: Retornar lista de todos os cupons cadastrados
export async function GET() {
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

// POST: Criar novo cupom (admin) OU Validar cupom (carrinho/checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Se a requisição veio do painel Admin para criar cupom
    if (body.action === 'create') {
      const result = await createCoupon({
        code: body.code,
        type: body.type,
        value: body.value,
        description: body.description,
        minOrderValue: body.minOrderValue,
        expiresAt: body.expiresAt,
        isActive: body.isActive,
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

    // Caso padrão: Validação do cupom feita no carrinho
    const rawCode = (body.code || '').trim();
    const subtotal = Number(body.subtotal) || 0;

    const validation = await validateCoupon(rawCode, subtotal);
    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        message: validation.message,
      });
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Erro na API de cupons (POST):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar cupom.' },
      { status: 500 }
    );
  }
}

// PATCH: Atualizar cupom existente (ex: ativar/desativar, alterar valor ou data)
export async function PATCH(request: NextRequest) {
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

// DELETE: Excluir um cupom
export async function DELETE(request: NextRequest) {
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
