'use client';

import React, { useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Send, MapPin, Calendar, User, Phone, CheckCircle2, Truck, Loader2, AlertTriangle, Tag, Info } from 'lucide-react';
import { DeliveryMethod } from '@/types';
import confetti from 'canvas-confetti';
import styles from './CheckoutModal.module.css';
import { trackOrderToDatabase } from '@/lib/tracking';

interface ShippingOption {
  id: number;
  name: string;
  companyName: string;
  companyPicture?: string;
  price: number;
  deliveryTime: number;
  deliveryRange?: { min: number; max: number };
}

function formatCepInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    subtotalAmount,
    finalTotal,
    discountAmount,
    hasWholesaleInCart,
    eligibleSubtotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    generateWhatsAppOrderUrl,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponWarning, setCouponWarning] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('retirada-pouso-alegre');
  const [shippingCep, setShippingCep] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isStoreOnline, setIsStoreOnline] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepInvalid, setIsCepInvalid] = useState(false);
  const cepInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [phoneError, setPhoneError] = useState('');

  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const [shippingNotice, setShippingNotice] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [lastCalculatedCep, setLastCalculatedCep] = useState('');

  React.useEffect(() => {
    if (isCheckoutOpen) {
      fetch('/api/store-status')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.isOnline === 'boolean') {
            setIsStoreOnline(data.isOnline);
          }
        })
        .catch(() => {});
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const selectedShippingOption =
    deliveryMethod === 'entrega-correios'
      ? shippingOptions.find((opt) => opt.id === selectedShippingId) || null
      : null;

  const shippingPrice = selectedShippingOption ? selectedShippingOption.price : 0;
  const orderTotalWithShipping = finalTotal + shippingPrice;

  const calculateShipping = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setIsCepInvalid(true);
      setShippingError('Digite um CEP completo com 8 números.');
      return;
    }

    setShippingLoading(true);
    setShippingError('');
    setIsCepInvalid(false);
    setShippingNotice('');
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: digits,
          totalUnits,
          insuranceValue: finalTotal,
        }),
      });
      const data = await res.json();
      setLastCalculatedCep(digits);

      if (data.addressInfo) {
        const parts = [
          data.addressInfo.street,
          data.addressInfo.neighborhood,
          data.addressInfo.city && data.addressInfo.state
            ? `${data.addressInfo.city}/${data.addressInfo.state}`
            : data.addressInfo.city,
        ].filter(Boolean);

        if (parts.length > 0) {
          setDeliveryAddress(parts.join(' - '));
        }
      }

      if (!res.ok || data.success === false) {
        setShippingOptions([]);
        setSelectedShippingId(null);
        setIsCepInvalid(Boolean(data.invalidCep));
        setShippingError(data.error || 'Não foi possível calcular o frete agora.');
        return;
      }

      setIsCepInvalid(false);
      const opts: ShippingOption[] = Array.isArray(data.options) ? data.options : [];
      setShippingOptions(opts);

      if (opts.length > 0) {
        setSelectedShippingId(opts[0].id);
        setShippingNotice('');
      } else {
        setSelectedShippingId(null);
        setShippingNotice(
          data.message ||
            data.error ||
            'Nenhuma opção automática disponível para este CEP. Envie o pedido que calculamos pelo WhatsApp.'
        );
      }
    } catch {
      setShippingError('Falha de conexão ao calcular frete. Você ainda pode enviar o pedido.');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCepInput(value);
    setShippingCep(formatted);
    setIsCepInvalid(false);
    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 8) {
      setShippingOptions([]);
      setSelectedShippingId(null);
      setShippingNotice('');
      setShippingError('');
      setLastCalculatedCep('');
    } else if (digits.length === 8 && digits !== lastCalculatedCep) {
      calculateShipping(digits);
    }
  };

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponInput.trim();
    if (!clean) return;

    setIsApplyingCoupon(true);
    setCouponFeedback(null);

    try {
      const result = await applyCoupon(clean);
      if (!result.success) {
        setCouponFeedback({ message: result.message, isError: true });
      } else {
        setCouponFeedback({ message: result.message || 'Cupom aplicado!', isError: false });
        setCouponInput('');
        if (customerPhone) {
          checkCouponForPhone(customerPhone);
        }
      }
    } catch {
      setCouponFeedback({ message: 'Erro ao validar cupom. Tente novamente.', isError: true });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback(null);
    setCouponWarning(null);
  };

  const checkCouponForPhone = async (phoneToTest: string) => {
    if (!appliedCoupon) return;
    const digits = phoneToTest.replace(/\D/g, '');
    if (digits.length < 10) return;

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: appliedCoupon.code,
          subtotal: subtotalAmount,
          phone: digits,
          eligibleSubtotal,
          hasOnlyWholesale: items.length > 0 && items.every((i) => i.product.quantityDiscounts && i.product.quantityDiscounts.length > 0),
        }),
      });
      const data = await res.json();
      if (data.valid === false || data.success === false) {
        const removedCode = appliedCoupon.code;
        removeCoupon();
        setCouponWarning(
          data.message ||
            `O cupom ${removedCode} foi removido pois este número de telefone já possui pedidos anteriores (válido apenas na 1ª compra).`
        );
      } else {
        setCouponWarning(null);
      }
    } catch {
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      setPhoneError('Por favor, informe seu número de WhatsApp completo com DDD.');
      const phoneInput = document.getElementById('customerPhoneInput');
      phoneInput?.focus();
      return;
    }

    if (appliedCoupon) {
      const digits = customerPhone.replace(/\D/g, '');
      if (digits.length >= 10) {
        setIsSubmitting(true);
        try {
          const res = await fetch('/api/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: appliedCoupon.code,
              subtotal: subtotalAmount,
              phone: digits,
            }),
          });
          const data = await res.json();
          if (data.valid === false || data.success === false) {
            const removedCode = appliedCoupon.code;
            removeCoupon();
            setCouponWarning(
              data.message ||
                `O cupom ${removedCode} foi removido pois este número de telefone já possui pedidos anteriores (válido apenas na 1ª compra).`
            );
            setIsSubmitting(false);
            return;
          }
        } catch {
        } finally {
          setIsSubmitting(false);
        }
      }
    }

    if (appliedCoupon) {
      try {
        const used = JSON.parse(localStorage.getItem('we_used_coupons') || '[]');
        if (Array.isArray(used) && !used.includes(appliedCoupon.code)) {
          used.push(appliedCoupon.code);
          localStorage.setItem('we_used_coupons', JSON.stringify(used));
        }
      } catch {}
    }

    const url = generateWhatsAppOrderUrl({
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress: deliveryAddress.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
      shippingCep:
        deliveryMethod === 'entrega-correios' && shippingCep.trim()
          ? shippingCep.trim()
          : undefined,
      shippingServiceName: selectedShippingOption?.name,
      shippingCompany: selectedShippingOption?.companyName,
      shippingPrice: selectedShippingOption?.price,
      shippingDeliveryDays: selectedShippingOption?.deliveryTime,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C89B6D', '#D4AF37', '#D97762', '#8C5835'],
      });
    } catch {
    }

    setIsSent(true);

    window.open(url, '_blank');

    clearCart();

    const shippingSummary = selectedShippingOption
      ? `Frete: ${selectedShippingOption.companyName} ${selectedShippingOption.name} (R$ ${selectedShippingOption.price.toFixed(2).replace('.', ',')}) - CEP ${shippingCep}`
      : deliveryMethod === 'entrega-correios' && shippingCep
      ? `CEP: ${shippingCep}`
      : '';

    const combinedNotes = [shippingSummary, generalNotes.trim()].filter(Boolean).join(' • ');

    trackOrderToDatabase({
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress: deliveryAddress.trim() || undefined,
      generalNotes: combinedNotes || undefined,
      totalUnits,
      totalAmount: orderTotalWithShipping,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      subtotalAmount: subtotalAmount,
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
          <div className={styles.successScreen}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={36} />
            </div>
            <h4 className={styles.successTitle}>
              Pedido Pronto para Envio!
            </h4>
            <p className={styles.successText}>
              Abrimos a conversa com a Wê no WhatsApp com todos os detalhes do seu pedido formatados. Basta clicar em <strong>Enviar</strong> no chat para combinarem a data e o pagamento!
            </p>
            <button
              onClick={handleFinish}
              className={styles.finishButton}
            >
              Concluir & Voltar à Loja
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.formBody}>

            <div className={styles.orderBrief}>
              <div>
                <span className={styles.briefLabel}>Itens selecionados</span>
                <span className={styles.briefCount}>{items.length} produto(s) • {totalUnits} un.</span>
                {deliveryMethod === 'entrega-correios' && (
                  <span className={styles.briefShippingLine}>
                    Frete:{' '}
                    {selectedShippingOption
                      ? `${selectedShippingOption.companyName} ${selectedShippingOption.name} (${selectedShippingOption.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
                      : 'Informe o CEP abaixo'}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={styles.briefLabel}>
                  {shippingPrice > 0 ? 'Total com frete' : discountAmount > 0 ? 'Total com desconto' : 'Total estimado'}
                </span>
                <span className={styles.briefTotal}>
                  {orderTotalWithShipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

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

            <div className={styles.twoColsGrid}>
              <div>
                <label className={styles.fieldLabel} htmlFor="customerPhoneInput">
                  <Phone size={13} className={styles.labelIcon} /> WhatsApp / Celular <span className={styles.reqStar}>*</span>
                </label>
                <input
                  id="customerPhoneInput"
                  type="tel"
                  required
                  placeholder="(35) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(formatPhoneInput(e.target.value));
                    if (couponWarning) setCouponWarning(null);
                    if (phoneError) setPhoneError('');
                  }}
                  onBlur={() => {
                    const digits = customerPhone.replace(/\D/g, '');
                    if (digits.length > 0 && digits.length < 10) {
                      setPhoneError('Informe o DDD + número completo (mínimo 10 dígitos).');
                    } else {
                      setPhoneError('');
                    }
                    if (appliedCoupon) {
                      checkCouponForPhone(customerPhone);
                    }
                  }}
                  className={`${styles.formInput} ${phoneError ? styles.inputError : ''}`}
                />
                {phoneError && (
                  <span className={styles.fieldErrorText}>{phoneError}</span>
                )}
              </div>

              <div>
                <label
                  className={styles.fieldLabel}
                  htmlFor="eventDateInput"
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker?.();
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Calendar size={13} className={styles.labelIcon} /> Data do Evento <span className={styles.reqStar}>*</span>
                </label>
                <div
                  className={styles.dateBlockWrapper}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker?.();
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                >
                  <input
                    ref={dateInputRef}
                    id="eventDateInput"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    className={`${styles.formInput} ${styles.dateInputBlock}`}
                  />
                </div>
              </div>
            </div>

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
                    <div className={styles.deliveryTitleRow}>
                      <span className={styles.deliveryOptionTitle}>Retirada em Pouso Alegre - MG</span>
                      <span className={styles.freeBadge}>Retirada Gratuita</span>
                    </div>
                    <span className={styles.deliveryOptionDesc}>
                      Sem taxa de frete — combinamos o ponto de retirada ou entrega na cidade.
                    </span>
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
                    <div className={styles.deliveryTitleRow}>
                      <span className={styles.deliveryOptionTitle}>Retirada em Paraisópolis - MG</span>
                      <span className={styles.freeBadge}>Retirada Gratuita</span>
                    </div>
                    <span className={styles.deliveryOptionDesc}>
                      Sem taxa de frete — combinamos o ponto de retirada na cidade.
                    </span>
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
                    <div className={styles.deliveryTitleRow}>
                      <span className={styles.deliveryOptionTitle}>Correios (Sedex)</span>
                      <span className={styles.shippingBadge}>Cálculo pelo CEP</span>
                    </div>
                    <span className={styles.deliveryOptionDesc}>
                      Enviamos para todo o Brasil! O valor do frete é calculado pelo seu CEP.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {deliveryMethod === 'entrega-correios' && (
              <div className={styles.shippingBox}>
                <label className={styles.fieldLabel}>
                  <Truck size={13} className={styles.labelIcon} /> CEP para calcular o frete <span className={styles.reqStar}>*</span>
                </label>

                {isCepInvalid && (
                  <div className={styles.requiredPingBadge} role="alert">
                    <span className={styles.pingDotWrap}>
                      <span className={styles.pingDotRing} />
                      <span className={styles.pingDotCore} />
                    </span>
                    <span>CEP inválido</span>
                  </div>
                )}

                <div className={styles.cepRow}>
                  <input
                    ref={cepInputRef}
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={9}
                    placeholder="00000-000"
                    value={shippingCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className={`${styles.formInput} ${isCepInvalid ? styles.inputError : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => calculateShipping(shippingCep)}
                    disabled={shippingLoading || shippingCep.replace(/\D/g, '').length !== 8}
                    className={styles.calcCepBtn}
                  >
                    {shippingLoading ? <Loader2 size={14} className={styles.spinner} /> : 'Calcular'}
                  </button>
                </div>

                {shippingError && (
                  <p className={styles.shippingError}>{shippingError}</p>
                )}

                {shippingNotice && (
                  <p className={styles.shippingHint}>{shippingNotice}</p>
                )}

                {shippingOptions.length > 0 && (
                  <div className={styles.shippingOptionsList}>
                    <span className={styles.shippingOptionsTitle}>
                      Escolha a modalidade de envio (já soma no total):
                    </span>
                    {shippingOptions.map((opt) => {
                      const isSelected = selectedShippingId === opt.id;
                      const rangeText =
                        opt.deliveryRange && opt.deliveryRange.min && opt.deliveryRange.max
                          ? `${opt.deliveryRange.min} a ${opt.deliveryRange.max} dias úteis`
                          : opt.deliveryTime > 0
                          ? `${opt.deliveryTime} dias úteis`
                          : 'Prazo a confirmar';
                      return (
                        <label
                          key={opt.id}
                          className={
                            isSelected ? styles.shippingQuoteSelected : styles.shippingQuoteItem
                          }
                        >
                          <div className={styles.shippingQuoteLeft}>
                            <input
                              type="radio"
                              name="shippingQuote"
                              checked={isSelected}
                              onChange={() => setSelectedShippingId(opt.id)}
                              className={styles.radioInput}
                            />
                            <div>
                              <span className={styles.shippingQuoteName}>
                                {opt.companyName} • {opt.name}
                              </span>
                              <span className={styles.shippingQuoteDays}>{rangeText}</span>
                            </div>
                          </div>
                          <span className={styles.shippingQuotePrice}>
                            {opt.price.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: '0.75rem' }}>
                  <label className={styles.fieldLabel}>
                    Endereço completo (Rua, Número, Bairro, Cidade/UF) <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, Número, Complemento, Bairro, Cidade/UF"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={styles.fieldLabel}>
                Mensagem adicional para a Wê (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Preciso que fique pronto até tal dia, gostaria de ver fotos da arte antes de imprimir..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.submitSection}>
              <div className={styles.finalTotalBox}>
                <div className={styles.finalTotalBreakdown}>
                  <div className={styles.finalTotalRow}>
                    <span>Produtos ({totalUnits} un.)</span>
                    <span>
                      {subtotalAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className={styles.finalTotalRow}>
                    <span>
                      {deliveryMethod === 'entrega-correios'
                        ? selectedShippingOption
                          ? `Frete (${selectedShippingOption.companyName} ${selectedShippingOption.name})`
                          : 'Frete (Correios)'
                        : 'Retirada'}
                    </span>
                    <span
                      className={
                        deliveryMethod !== 'entrega-correios'
                          ? styles.finalFreeText
                          : undefined
                      }
                    >
                      {deliveryMethod !== 'entrega-correios'
                        ? 'Grátis'
                        : selectedShippingOption
                        ? selectedShippingOption.price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : 'Informe o CEP'}
                    </span>
                  </div>

                  <div className={styles.checkoutCouponContainer}>
                    {couponWarning && (
                      <div className={styles.couponWarningBox} style={{ marginBottom: '0.625rem' }}>
                        <AlertTriangle size={15} className={styles.couponWarningIcon} />
                        <span>{couponWarning}</span>
                      </div>
                    )}

                    <span className={styles.checkoutCouponLabel}>Cupom de desconto</span>
                    {appliedCoupon ? (
                      <>
                        <div className={styles.checkoutAppliedCouponRow}>
                          <div className={styles.checkoutAppliedLeft}>
                          <Tag size={13} className={styles.checkoutAppliedTagIcon} />
                          <span className={styles.checkoutAppliedCode}>{appliedCoupon.code}</span>
                          <span className={styles.checkoutAppliedDesc}>
                            {appliedCoupon.type === 'percentage'
                              ? `(-${appliedCoupon.value}%)`
                              : `(-R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')})`}
                          </span>
                        </div>
                        <div className={styles.checkoutAppliedRight}>
                          <span className={styles.checkoutDiscountAmount}>
                            -{discountAmount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className={styles.checkoutRemoveCouponBtn}
                            title="Remover cupom"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                      {hasWholesaleInCart && discountAmount > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#8C7A6B', marginTop: '0.35rem', display: 'block' }}>
                          * Desconto aplicado sobre os produtos regulares (itens de atacado como as bolinhas já possuem desconto progressivo).
                        </span>
                      )}
                      {hasWholesaleInCart && discountAmount === 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.35rem', display: 'block' }}>
                          * Este cupom não se aplica a produtos com preço de atacado/desconto progressivo.
                        </span>
                      )}
                    </>
                    ) : (
                      <div className={styles.checkoutCouponRow}>
                        <div className={styles.checkoutCouponInputWrapper}>
                          <Tag size={14} className={styles.checkoutCouponInputIcon} />
                          <input
                            type="text"
                            placeholder="Ex: PRIMEIRACOMPRA"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              if (couponFeedback) setCouponFeedback(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            className={styles.checkoutCouponInput}
                            maxLength={25}
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck={false}
                            disabled={isApplyingCoupon}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={!couponInput.trim() || isApplyingCoupon}
                          className={styles.checkoutCouponApplyBtn}
                        >
                          {isApplyingCoupon ? '...' : 'Aplicar'}
                        </button>
                      </div>
                    )}

                    {couponFeedback && (
                      <div
                        className={
                          couponFeedback.isError
                            ? styles.checkoutCouponError
                            : styles.checkoutCouponSuccess
                        }
                      >
                        {couponFeedback.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.finalTotalMainRow}>
                  <span className={styles.finalTotalLabel}>
                    {shippingPrice > 0 ? 'Total com frete' : discountAmount > 0 ? 'Total com desconto' : 'Total do pedido'}
                  </span>
                  <span className={styles.finalTotalValue}>
                    {orderTotalWithShipping.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                <div className={styles.paymentTermsNotice}>
                  <div className={styles.paymentTermsHeader}>
                    <Info size={15} className={styles.paymentTermsIcon} />
                    <span className={styles.paymentTermsTitle}>Condição de pagamento</span>
                  </div>
                  <p className={styles.paymentTermsText}>
                    {deliveryMethod !== 'entrega-correios' ? (
                      <>
                        Para iniciar a produção, é necessário o pagamento de <strong>50% de entrada</strong> e o restante no dia da <strong>retirada</strong>.
                      </>
                    ) : (
                      <>
                        Para iniciar a produção, é necessário o pagamento de <strong>50% de entrada</strong> e o restante no dia da <strong>entrega</strong>.
                      </>
                    )}
                  </p>
                  <div className={styles.paymentTermsSplitRow}>
                    <span className={styles.paymentTermsSplitBadge}>
                      Entrada (50%): <strong>{(orderTotalWithShipping / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={styles.whatsappSubmitBtn}
              >
                <Send size={18} />
                <span>Enviar Pedido pelo WhatsApp</span>
              </button>
              <p className={styles.paymentSecurityNote}>
                Nenhum dado de pagamento é cobrado agora. Você e a Wê combinam a arte e a forma de pagamento no chat.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
