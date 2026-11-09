import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllProducts, saveProduct, deleteProduct, saveCategory } from '@/lib/productsStore';
import { Product } from '@/types';

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const products = getAllProducts();
  return NextResponse.json({ success: true, products });
}

export async function POST(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const product: Product = body.product;

    if (!product.id || !product.name || !product.price || !product.category) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Se o usuário digitou uma categoria nova, garante que ela é registrada
    if (body.newCategoryName) {
      saveCategory({
        id: product.category,
        name: body.newCategoryName,
        description: `Produtos da categoria ${body.newCategoryName}`,
      });
    }

    const saved = saveProduct(product);
    return NextResponse.json({ success: true, product: saved });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar dados do produto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do produto não informado' }, { status: 400 });
    }

    const deleted = deleteProduct(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
