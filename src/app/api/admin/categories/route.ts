import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllCategories, saveCategory, deleteCategory } from '@/lib/productsStore';

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const categories = await getAllCategories();
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome da categoria é obrigatório' }, { status: 400 });
    }

    const trimmedName = name.trim();
    // Se não tiver id, gera um slug amigável a partir do nome
    const finalId = id && typeof id === 'string' && id.trim()
      ? id.trim()
      : trimmedName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

    const saved = await saveCategory({
      id: finalId,
      name: trimmedName,
      description: description ? String(description).trim() : `Produtos da categoria ${trimmedName}`,
    });

    const categories = await getAllCategories();

    return NextResponse.json({
      success: true,
      category: saved,
      categories,
    });
  } catch (error) {
    console.error('Erro ao salvar categoria:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    if (id === 'todos') {
      return NextResponse.json({ success: false, error: 'Não é possível excluir a categoria principal' }, { status: 400 });
    }

    await deleteCategory(id);
    const categories = await getAllCategories();

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
