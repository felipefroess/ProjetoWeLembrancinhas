import { NextRequest, NextResponse } from 'next/server';

export interface ShippingQuoteOption {
  id: number;
  name: string;
  companyName: string;
  companyPicture?: string;
  price: number;
  deliveryTime: number;
  deliveryRange?: {
    min: number;
    max: number;
  };
}

function cleanCep(cep?: string): string {
  return String(cep || '').replace(/\D/g, '').slice(0, 8);
}

async function lookupViaCep(cep: string): Promise<{
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
} | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const toCep = cleanCep(body?.cep);
    const totalUnits = Math.max(1, Number(body?.totalUnits) || 1);
    const insuranceValue = Math.max(0, Number(body?.insuranceValue) || 0);

    if (toCep.length !== 8) {
      return NextResponse.json(
        { success: false, error: 'Informe um CEP válido com 8 dígitos.' },
        { status: 400 }
      );
    }

    const addressInfo = await lookupViaCep(toCep);

    const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
    const fromCep = cleanCep(process.env.MELHOR_ENVIO_FROM_CEP) || '37550000';
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
    const userAgent =
      process.env.MELHOR_ENVIO_USER_AGENT?.trim() ||
      'WeLembrancinhas (contato@welembrancinhas.com.br)';

    if (!token) {
      return NextResponse.json({
        success: true,
        configured: false,
        addressInfo,
        options: [],
        message:
          'Token do Melhor Envio ainda não configurado no servidor. O frete será calculado pelo CEP no WhatsApp.',
      });
    }

    // Estimativa segura de caixa/peso para lembrancinhas artesanais
    const estimatedWeight = Number(
      Math.min(25, Math.max(0.3, totalUnits * 0.045)).toFixed(2)
    );
    const height = Math.min(45, Math.max(8, 8 + Math.floor(totalUnits / 25) * 4));
    const width = Math.min(45, Math.max(16, 16 + Math.floor(totalUnits / 30) * 4));
    const length = Math.min(50, Math.max(20, 20 + Math.floor(totalUnits / 30) * 4));

    const apiBase = isSandbox
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://www.melhorenvio.com.br';

    const meRes = await fetch(`${apiBase}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
      },
      body: JSON.stringify({
        from: { postal_code: fromCep },
        to: { postal_code: toCep },
        volumes: [
          {
            height,
            width,
            length,
            weight: estimatedWeight,
            insurance_value: Number(insuranceValue.toFixed(2)),
          },
        ],
        options: {
          receipt: false,
          own_hand: false,
        },
        services: '2',
      }),
    });

    if (!meRes.ok) {
      const errorBody = await meRes.text().catch(() => '');
      console.error('Erro na API do Melhor Envio:', meRes.status, errorBody);
      return NextResponse.json({
        success: true,
        configured: true,
        addressInfo,
        options: [],
        error:
          'Não foi possível consultar as transportadoras agora. Você pode enviar o pedido para calcularmos no WhatsApp.',
      });
    }

    const rawData = await meRes.json();
    const list = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

    const options: ShippingQuoteOption[] = list
      .filter((item: any) => {
        if (item?.error || !(Number(item?.custom_price || item?.price) > 0)) {
          return false;
        }
        const isSedexId = Number(item.id) === 2;
        const isCorreiosSedexName =
          String(item.company?.name || '').toLowerCase().includes('correios') &&
          String(item.name || '').toLowerCase().includes('sedex');
        return isSedexId || isCorreiosSedexName;
      })
      .map((item: any) => ({
        id: Number(item.id),
        name: String(item.name || 'Envio'),
        companyName: String(item.company?.name || 'Transportadora'),
        companyPicture: item.company?.picture ? String(item.company.picture) : undefined,
        price: Number(item.custom_price || item.price),
        deliveryTime: Number(item.custom_delivery_time || item.delivery_time || 0),
        deliveryRange: item.custom_delivery_range || item.delivery_range || undefined,
      }))
      .sort((a, b) => a.price - b.price);

    return NextResponse.json({
      success: true,
      configured: true,
      addressInfo,
      options,
    });
  } catch (err) {
    console.error('Erro ao calcular frete:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao calcular frete.' },
      { status: 500 }
    );
  }
}
