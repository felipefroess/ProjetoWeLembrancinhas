import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'store-status.json');

function readStatus(): { isOnline: boolean } {
  try {
    if (!fs.existsSync(STATUS_FILE_PATH)) {
      return { isOnline: true };
    }
    const content = fs.readFileSync(STATUS_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Erro ao ler status da loja:', err);
    return { isOnline: true };
  }
}

function writeStatus(data: { isOnline: boolean }): void {
  try {
    const dir = path.dirname(STATUS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar status da loja:', err);
  }
}

export async function GET() {
  const status = readStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isOnline = Boolean(body.isOnline);
    writeStatus({ isOnline });
    return NextResponse.json({ success: true, isOnline });
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
