'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Send, MapPin, Calendar, User, Phone, CheckCircle2, Sparkles } from 'lucide-react';
import { DeliveryMethod } from '@/types';
import confetti from 'canvas-confetti';

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    subtotalAmount,
    generateWhatsAppOrderUrl,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('retirada-pouso-alegre');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isCheckoutOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const url = generateWhatsAppOrderUrl({
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress: deliveryAddress.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
    });

    // Efeito de celebração com confetes
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C89B6D', '#D4AF37', '#D97762', '#8C5835'],
      });
    } catch {
      // Ignora erro se canvas não estiver disponível
    }

    setIsSent(true);

    // Abre o WhatsApp na nova aba
    window.open(url, '_blank');
  };

  const handleFinish = () => {
    clearCart();
    setIsSent(false);
    closeCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#DACFBF] relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#D4AF37]" size={20} />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2D231E]">
              Finalizar Pedido via WhatsApp
            </h3>
          </div>
          <button
            onClick={closeCheckout}
            className="w-8 h-8 rounded-full bg-white border border-[#DACFBF] text-[#7C6E64] hover:text-[#2D231E] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {isSent ? (
          /* Tela de Sucesso */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EAF7EE] text-[#22C55E] flex items-center justify-center mx-auto border-2 border-[#22C55E]/30">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-serif font-bold text-xl text-[#2D231E]">
              Pedido Pronto para Envio!
            </h4>
            <p className="text-sm text-[#6B5E55] max-w-md mx-auto leading-relaxed">
              Abrimos a conversa com a Wenilze no WhatsApp com todos os detalhes do seu pedido formatados. Basta clicar em <strong>Enviar</strong> no chat para combinarem a data e o pagamento!
            </p>
            <button
              onClick={handleFinish}
              className="mt-4 px-6 py-3 rounded-full bg-[#6D4C3D] hover:bg-[#5A3E31] text-white text-sm font-bold shadow-md transition"
            >
              Concluir & Voltar à Loja
            </button>
          </div>
        ) : (
          /* Formulário de Dados */
          <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Resumo do Pedido */}
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8C7A6B] block">Itens selecionados</span>
                <span className="font-bold text-sm text-[#2D231E]">{items.length} produtos no carrinho</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#8C7A6B] block">Total estimado</span>
                <span className="font-serif font-bold text-lg text-[#6D4C3D]">
                  {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-[#C89B6D]" /> Seu Nome Completo <span className="text-[#C89B6D]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
              />
            </div>

            {/* Telefone e Data do Evento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#C89B6D]" /> WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  placeholder="(35) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#C89B6D]" /> Data do Evento <span className="text-[#C89B6D]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>
            </div>

            {/* Opções de Entrega / Retirada */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-2 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#C89B6D]" /> Como deseja receber? <span className="text-[#C89B6D]">*</span>
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  deliveryMethod === 'retirada-pouso-alegre'
                    ? 'border-[#6D4C3D] bg-[#FAF7F2] text-[#2D231E]'
                    : 'border-[#DACFBF] bg-white text-[#52443C] hover:bg-[#FAF7F2]'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'retirada-pouso-alegre'}
                    onChange={() => setDeliveryMethod('retirada-pouso-alegre')}
                    className="accent-[#6D4C3D]"
                  />
                  <div>
                    <span className="font-bold text-xs block">Retirada em Pouso Alegre - MG</span>
                    <span className="text-[11px] text-[#8C7A6B]">Ponto de encontro / retirada a combinar sem taxa de frete</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  deliveryMethod === 'retirada-paraisopolis'
                    ? 'border-[#6D4C3D] bg-[#FAF7F2] text-[#2D231E]'
                    : 'border-[#DACFBF] bg-white text-[#52443C] hover:bg-[#FAF7F2]'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'retirada-paraisopolis'}
                    onChange={() => setDeliveryMethod('retirada-paraisopolis')}
                    className="accent-[#6D4C3D]"
                  />
                  <div>
                    <span className="font-bold text-xs block">Retirada em Paraisópolis - MG</span>
                    <span className="text-[11px] text-[#8C7A6B]">Ponto de encontro / retirada a combinar sem taxa de frete</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  deliveryMethod === 'entrega-correios'
                    ? 'border-[#6D4C3D] bg-[#FAF7F2] text-[#2D231E]'
                    : 'border-[#DACFBF] bg-white text-[#52443C] hover:bg-[#FAF7F2]'
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'entrega-correios'}
                    onChange={() => setDeliveryMethod('entrega-correios')}
                    className="accent-[#6D4C3D]"
                  />
                  <div>
                    <span className="font-bold text-xs block">Envio por Correios / Transportadora</span>
                    <span className="text-[11px] text-[#8C7A6B]">Valor de frete calculado pela Wenilze de acordo com seu CEP</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Endereço caso tenha escolhido frete */}
            {deliveryMethod === 'entrega-correios' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                  Endereço e CEP para cálculo de frete
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua, Número, Bairro, Cidade/UF e CEP"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>
            )}

            {/* Observações adicionais */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                Mensagem adicional para a Wenilze (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Preciso que fique pronto até tal dia, gostaria de ver fotos da arte antes de imprimir..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl p-3 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
              />
            </div>

            {/* Botão de Envio */}
            <div className="pt-3 border-t border-[#E8DFD5]">
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Send size={18} />
                <span>Enviar Pedido pelo WhatsApp</span>
              </button>
              <p className="text-center text-[11px] text-[#8C7A6B] mt-2">
                Nenhum dado de pagamento é cobrado agora. Você e a Wenilze combinam a arte e a forma de pagamento no chat.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
