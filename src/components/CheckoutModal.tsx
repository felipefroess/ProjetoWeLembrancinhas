'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Send, MapPin, Calendar, User, Phone, CheckCircle2 } from 'lucide-react';
import { DeliveryMethod } from '@/types';
import confetti from 'canvas-confetti';
import styles from './CheckoutModal.module.css';
import { trackOrderToDatabase } from '@/lib/tracking';

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

    // Registra o pedido no banco de dados Supabase de forma assíncrona
    const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
    trackOrderToDatabase({
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress: deliveryAddress.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
      totalUnits,
      totalAmount: subtotalAmount,
      items,
    });
  };

  const handleFinish = () => {
    clearCart();
    setIsSent(false);
    closeCheckout();
  };

  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Finalizar Pedido via WhatsApp
          </h3>
          <button
            onClick={closeCheckout}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {isSent ? (
          /* Tela de Sucesso */
          <div className={styles.successScreen}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={36} />
            </div>
            <h4 className={styles.successTitle}>
              Pedido Pronto para Envio!
            </h4>
            <p className={styles.successText}>
              Abrimos a conversa com a Wenilze no WhatsApp com todos os detalhes do seu pedido formatados. Basta clicar em <strong>Enviar</strong> no chat para combinarem a data e o pagamento!
            </p>
            <button
              onClick={handleFinish}
              className={styles.finishButton}
            >
              Concluir & Voltar à Loja
            </button>
          </div>
        ) : (
          /* Formulário de Dados */
          <form onSubmit={handleSubmit} className={styles.formBody}>
            
            {/* Resumo do Pedido */}
            <div className={styles.orderBrief}>
              <div>
                <span className={styles.briefLabel}>Itens selecionados</span>
                <span className={styles.briefCount}>{items.length} produtos no carrinho</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={styles.briefLabel}>Total estimado</span>
                <span className={styles.briefTotal}>
                  {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Nome Completo */}
            <div>
              <label className={styles.fieldLabel}>
                <User size={13} className={styles.labelIcon} /> Seu Nome Completo <span className={styles.reqStar}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={styles.formInput}
              />
            </div>

            {/* Telefone e Data do Evento */}
            <div className={styles.twoColsGrid}>
              <div>
                <label className={styles.fieldLabel}>
                  <Phone size={13} className={styles.labelIcon} /> WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  placeholder="(35) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  <Calendar size={13} className={styles.labelIcon} /> Data do Evento <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            {/* Opções de Entrega / Retirada */}
            <div>
              <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem' }}>
                <MapPin size={13} className={styles.labelIcon} /> Como deseja receber? <span className={styles.reqStar}>*</span>
              </label>
              
              <div className={styles.deliveryList}>
                <label className={deliveryMethod === 'retirada-pouso-alegre' ? styles.deliveryOptionSelected : styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'retirada-pouso-alegre'}
                    onChange={() => setDeliveryMethod('retirada-pouso-alegre')}
                    className={styles.radioInput}
                  />
                  <div className={styles.deliveryTextWrap}>
                    <span className={styles.deliveryOptionTitle}>Retirada em Pouso Alegre - MG</span>
                    <span className={styles.deliveryOptionDesc}>Ponto de encontro / retirada a combinar sem taxa de frete</span>
                  </div>
                </label>

                <label className={deliveryMethod === 'retirada-paraisopolis' ? styles.deliveryOptionSelected : styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'retirada-paraisopolis'}
                    onChange={() => setDeliveryMethod('retirada-paraisopolis')}
                    className={styles.radioInput}
                  />
                  <div className={styles.deliveryTextWrap}>
                    <span className={styles.deliveryOptionTitle}>Retirada em Paraisópolis - MG</span>
                    <span className={styles.deliveryOptionDesc}>Ponto de encontro / retirada a combinar sem taxa de frete</span>
                  </div>
                </label>

                <label className={deliveryMethod === 'entrega-correios' ? styles.deliveryOptionSelected : styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === 'entrega-correios'}
                    onChange={() => setDeliveryMethod('entrega-correios')}
                    className={styles.radioInput}
                  />
                  <div className={styles.deliveryTextWrap}>
                    <span className={styles.deliveryOptionTitle}>Envio por Correios / Transportadora</span>
                    <span className={styles.deliveryOptionDesc}>Valor de frete calculado pela Wenilze de acordo com seu CEP</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Endereço caso tenha escolhido frete */}
            {deliveryMethod === 'entrega-correios' && (
              <div>
                <label className={styles.fieldLabel}>
                  Endereço e CEP para cálculo de frete
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua, Número, Bairro, Cidade/UF e CEP"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            )}

            {/* Observações adicionais */}
            <div>
              <label className={styles.fieldLabel}>
                Mensagem adicional para a Wenilze (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Preciso que fique pronto até tal dia, gostaria de ver fotos da arte antes de imprimir..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            {/* Botão de Envio */}
            <div className={styles.submitSection}>
              <button
                type="submit"
                className={styles.whatsappSubmitBtn}
              >
                <Send size={18} />
                <span>Enviar Pedido pelo WhatsApp</span>
              </button>
              <p className={styles.paymentSecurityNote}>
                Nenhum dado de pagamento é cobrado agora. Você e a Wenilze combinam a arte e a forma de pagamento no chat.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
