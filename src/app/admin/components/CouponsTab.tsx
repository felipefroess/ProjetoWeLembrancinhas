'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket,
  Plus,
  Search,
  Copy,
  Check,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Gift,
  ShieldCheck,
  Zap
} from 'lucide-react';
import styles from './CouponsTab.module.css';

export interface CouponItem {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minOrderValue?: number;
  expiresAt?: string | null;
  isActive: boolean;
  firstPurchaseOnly?: boolean;
  createdAt?: string;
}

interface CouponsTabProps {
  onCouponsCountChange?: (count: number) => void;
}

export default function CouponsTab({ onCouponsCountChange }: CouponsTabProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  
  // Controle de Cópia
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Campos do Formulário
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number | ''>(10);
  const [formHasExpiry, setFormHasExpiry] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMinOrder, setFormMinOrder] = useState<number | ''>('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formFirstPurchaseOnly, setFormFirstPurchaseOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de Confirmação de Exclusão
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar cupons do backend
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Notifica o pai sobre a contagem de cupons ativos
  useEffect(() => {
    const activeCount = coupons.filter((c) => {
      if (!c.isActive) return false;
      if (c.expiresAt) {
        const exp = new Date(c.expiresAt);
        if (c.expiresAt.length === 10) exp.setHours(23, 59, 59, 999);
        return Date.now() <= exp.getTime();
      }
      return true;
    }).length;
    onCouponsCountChange?.(activeCount);
  }, [coupons, onCouponsCountChange]);

  // Função auxiliar para verificar expiração
  const isCouponExpired = (coupon: CouponItem): boolean => {
    if (!coupon.expiresAt) return false;
    const exp = new Date(coupon.expiresAt);
    if (coupon.expiresAt.length === 10) exp.setHours(23, 59, 59, 999);
    return Date.now() > exp.getTime();
  };

  // Dias restantes até expirar
  const getDaysUntilExpiry = (coupon: CouponItem): number | null => {
    if (!coupon.expiresAt) return null;
    const exp = new Date(coupon.expiresAt);
    if (coupon.expiresAt.length === 10) exp.setHours(23, 59, 59, 999);
    const diff = exp.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Filtragem dos cupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const expired = isCouponExpired(coupon);

      // Filtro de status
      if (statusFilter === 'active' && (!coupon.isActive || expired)) return false;
      if (statusFilter === 'inactive' && coupon.isActive) return false;
      if (statusFilter === 'expired' && !expired) return false;

      // Busca por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const codeMatch = coupon.code.toLowerCase().includes(term);
        const descMatch = coupon.description?.toLowerCase().includes(term);
        if (!codeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [coupons, statusFilter, searchTerm]);

  // Métricas
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive && !isCouponExpired(c)).length;
    
    // Maior porcentagem
    const percentages = coupons
      .filter((c) => c.type === 'percentage')
      .map((c) => c.value);
    const maxPercent = percentages.length > 0 ? Math.max(...percentages) : 0;

    // Cupons expirando em breve (nos próximos 7 dias)
    const expiringSoon = coupons.filter((c) => {
      if (!c.isActive || !c.expiresAt) return false;
      const days = getDaysUntilExpiry(c);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    return { total, active, maxPercent, expiringSoon };
  }, [coupons]);

  // Copiar código com feedback
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Alternar status ativo/inativo
  const handleToggleActive = async (coupon: CouponItem) => {
    const nextStatus = !coupon.isActive;
    
    // Atualização otimista
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextStatus } : c))
    );

    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Reverte se falhou
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !nextStatus } : c))
        );
        alert(data.error || 'Erro ao alterar status do cupom.');
      }
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !nextStatus } : c))
      );
      alert('Erro de conexão com o servidor.');
    }
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(10);
    setFormHasExpiry(false);
    setFormExpiresAt('');
    setFormMinOrder('');
    setFormDescription('');
    setFormIsActive(true);
    setFormFirstPurchaseOnly(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormHasExpiry(Boolean(coupon.expiresAt));
    setFormExpiresAt(coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : '');
    setFormMinOrder(coupon.minOrderValue || '');
    setFormDescription(coupon.description || '');
    setFormIsActive(coupon.isActive);
    setFormFirstPurchaseOnly(coupon.firstPurchaseOnly === true || coupon.code === 'PRIMEIRACOMPRA');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Atalhos de data de validade
  const setExpiryDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormExpiresAt(date.toISOString().substring(0, 10));
    setFormHasExpiry(true);
  };

  const setExpiryEndOfMonth = () => {
    const date = new Date();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    setFormExpiresAt(endOfMonth.toISOString().substring(0, 10));
    setFormHasExpiry(true);
  };

  // Gerar código promocional sugerido
  const generateSuggestedCode = () => {
    const prefixes = ['WE', 'MIMO', 'PROMO', 'FESTA', 'ESPECIAL'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = formValue ? String(formValue) : '10';
    setFormCode(`${randomPrefix}${val}`);
  };

  // Salvar cupom (Criar ou Atualizar)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Informe o código do cupom.');
      return;
    }

    if (!formValue || Number(formValue) <= 0) {
      setFormError('Informe um valor de desconto válido maior que zero.');
      return;
    }

    if (formType === 'percentage' && Number(formValue) > 100) {
      setFormError('A porcentagem não pode ser maior que 100%.');
      return;
    }

    if (formHasExpiry && !formExpiresAt) {
      setFormError('Selecione a data de expiração ou desmarque a opção de tempo limite.');
      return;
    }

    setSaving(true);

    try {
      if (editingCoupon) {
        // Atualização
        const res = await fetch('/api/coupons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCoupon.id,
            code: cleanCode,
            type: formType,
            value: Number(formValue),
            description: formDescription.trim() || undefined,
            minOrderValue: formMinOrder ? Number(formMinOrder) : 0,
            expiresAt: formHasExpiry ? formExpiresAt : null,
            isActive: formIsActive,
            firstPurchaseOnly: formFirstPurchaseOnly,
          }),
        });

        const data = await res.json();
        if (data.success && data.coupon) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === editingCoupon.id ? data.coupon : c))
          );
          setIsModalOpen(false);
        } else {
          setFormError(data.error || 'Erro ao atualizar cupom.');
        }
      } else {
        // Criação
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            code: cleanCode,
            type: formType,
            value: Number(formValue),
            description: formDescription.trim() || undefined,
            minOrderValue: formMinOrder ? Number(formMinOrder) : 0,
            expiresAt: formHasExpiry ? formExpiresAt : null,
            isActive: formIsActive,
            firstPurchaseOnly: formFirstPurchaseOnly,
          }),
        });

        const data = await res.json();
        if (data.success && data.coupon) {
          setCoupons((prev) => [data.coupon, ...prev]);
          setIsModalOpen(false);
        } else {
          setFormError(data.error || 'Erro ao criar cupom.');
        }
      }
    } catch {
      setFormError('Erro ao comunicar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Excluir cupom
  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/coupons?id=${deletingCoupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
        setDeletingCoupon(null);
      } else {
        alert(data.error || 'Erro ao excluir cupom.');
      }
    } catch {
      alert('Erro de conexão ao excluir cupom.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.couponsContainer}>
      {/* Cabeçalho */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleWrapper}>
          <h2 className={styles.heading}>
            <span className={styles.headingIcon}>
              <Ticket size={20} />
            </span>
            Gerenciamento de Cupons de Desconto
          </h2>
          <p className={styles.subheading}>
            Crie cupons promocionais para seus clientes, defina porcentagens ou descontos fixos e controle o prazo de validade.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={styles.newCouponButton}
        >
          <Plus size={18} />
          <span>Criar Novo Cupom</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconBox} style={{ backgroundColor: '#F5EDE4', color: '#6D4C3D' }}>
            <Ticket size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricLabel}>Total de Cupons</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconBox} style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>
            <Zap size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metrics.active}</span>
            <span className={styles.metricLabel}>Cupons Ativos</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconBox} style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
            <Percent size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metrics.maxPercent > 0 ? `${metrics.maxPercent}%` : 'N/A'}</span>
            <span className={styles.metricLabel}>Maior Desconto (%)</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconBox} style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
            <Clock size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metrics.expiringSoon}</span>
            <span className={styles.metricLabel}>Expiram em Breve</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.statusFilterGroup}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterBtnActive : ''}`}
          >
            Todos
            <span className={styles.filterCount}>{coupons.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`${styles.filterBtn} ${statusFilter === 'active' ? styles.filterBtnActive : ''}`}
          >
            Ativos
            <span className={styles.filterCount}>{metrics.active}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`${styles.filterBtn} ${statusFilter === 'expired' ? styles.filterBtnActive : ''}`}
          >
            Expirados
            <span className={styles.filterCount}>
              {coupons.filter(isCouponExpired).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`${styles.filterBtn} ${statusFilter === 'inactive' ? styles.filterBtnActive : ''}`}
          >
            Desativados
            <span className={styles.filterCount}>
              {coupons.filter((c) => !c.isActive).length}
            </span>
          </button>
        </div>
      </div>

      {/* Grade de Cupons */}
      {loading ? (
        <div className={styles.emptyState}>
          <RefreshCw size={28} className="animate-spin text-[#8C7A6B]" />
          <p className={styles.emptyText}>Carregando cupons cadastrados...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className={styles.emptyState}>
          <Ticket size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Nenhum cupom encontrado</h3>
          <p className={styles.emptyText}>
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhum cupom corresponde aos filtros aplicados.'
              : 'Você ainda não cadastrou nenhum cupom de desconto. Clique no botão acima para criar o seu primeiro!'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className={styles.btnCancel}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className={styles.couponsGrid}>
          {filteredCoupons.map((coupon) => {
            const expired = isCouponExpired(coupon);
            const daysLeft = getDaysUntilExpiry(coupon);
            const isCopying = copiedCode === coupon.code;

            return (
              <div
                key={coupon.id}
                className={`${styles.couponCard} ${(!coupon.isActive || expired) ? styles.couponCardDisabled : ''}`}
              >
                {/* Topo do Voucher */}
                <div className={styles.couponCardTop}>
                  <div className={styles.couponCodeBox}>
                    <div className={styles.couponCode}>
                      <span>{coupon.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className={styles.copyCodeBtn}
                        title="Copiar código"
                      >
                        {isCopying ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <span
                      className={`${styles.couponDiscountBadge} ${coupon.type === 'fixed' ? styles.couponDiscountFixed : ''}`}
                    >
                      {coupon.type === 'percentage' ? (
                        <>
                          <Percent size={12} />
                          {coupon.value}% de desconto
                        </>
                      ) : (
                        <>
                          <DollarSign size={12} />
                          R$ {coupon.value.toFixed(2).replace('.', ',')} OFF
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Picote Decorativo */}
                <div className={styles.couponDivider}>
                  <div className={styles.couponPunchHoleLeft} />
                  <div className={styles.couponDashedLine} />
                  <div className={styles.couponPunchHoleRight} />
                </div>

                {/* Conteúdo do Voucher */}
                <div className={styles.couponCardBody}>
                  <p className={styles.couponDescription}>
                    {coupon.description || 'Desconto aplicável em produtos do carrinho.'}
                  </p>

                  <div className={styles.couponDetailsList}>
                    {/* Validade / Tempo */}
                    <div className={styles.couponDetailItem}>
                      <Clock size={13} />
                      {expired ? (
                        <span className={styles.badgeExpired}>
                          <AlertTriangle size={12} /> Expirou em {new Date(coupon.expiresAt!).toLocaleDateString('pt-BR')}
                        </span>
                      ) : coupon.expiresAt ? (
                        daysLeft !== null && daysLeft <= 3 ? (
                          <span className={styles.badgeExpiringSoon}>
                            Válido até {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')} ({daysLeft === 0 ? 'Último dia!' : `restam ${daysLeft}d`})
                          </span>
                        ) : (
                          <span>
                            Válido até {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        )
                      ) : (
                        <span className={styles.badgeNoExpiry}>
                          Sem prazo de validade (Vitalício)
                        </span>
                      )}
                    </div>

                    {/* Regra de Pedido Mínimo */}
                    <div className={styles.couponDetailItem}>
                      <Gift size={13} />
                      <span>
                        {coupon.minOrderValue && coupon.minOrderValue > 0
                          ? `Pedido mínimo de ${coupon.minOrderValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                          : 'Sem valor mínimo de pedido'}
                      </span>
                    </div>

                    {/* Regra de Primeira Compra */}
                    {(coupon.firstPurchaseOnly || coupon.code === 'PRIMEIRACOMPRA') && (
                      <div className={styles.couponDetailItem}>
                        <ShieldCheck size={13} style={{ color: '#B45309' }} />
                        <span className={styles.badgeFirstPurchase}>
                          Exclusivo 1ª compra por cliente
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé com Ações */}
                <div className={styles.couponCardFooter}>
                  {/* Interruptor Ativar/Desativar */}
                  <label className={styles.toggleSwitch} title={coupon.isActive ? 'Cupom ativo no site' : 'Cupom pausado'}>
                    <input
                      type="checkbox"
                      checked={coupon.isActive}
                      onChange={() => handleToggleActive(coupon)}
                    />
                    <span className={styles.toggleSlider} />
                    <span>{coupon.isActive ? 'Ativo' : 'Pausado'}</span>
                  </label>

                  {/* Botões de Ação */}
                  <div className={styles.cardActionButtons}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(coupon)}
                      className={styles.btnEdit}
                      title="Editar cupom"
                    >
                      <Pencil size={13} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingCoupon(coupon)}
                      className={styles.btnDelete}
                      title="Excluir cupom"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Ticket size={20} color="#6D4C3D" />
                {editingCoupon ? `Editar Cupom (${editingCoupon.code})` : 'Criar Novo Cupom de Desconto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className={styles.modalForm}>
              {formError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                  {formError}
                </div>
              )}

              {/* Código do Cupom */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Código do Cupom <span style={{ color: '#DC2626' }}>*</span>
                  <span className={styles.formLabelHint}>(Texto que o cliente digita)</span>
                </label>
                <div className={styles.inputWithAction}>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PROMO10, NATAL2026, MIMO"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className={`${styles.formInput} ${styles.formInputCode}`}
                    maxLength={25}
                  />
                  <button
                    type="button"
                    onClick={generateSuggestedCode}
                    className={styles.btnGenerateCode}
                    title="Gerar código aleatório"
                  >
                    <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Sugerir
                  </button>
                </div>
              </div>

              {/* Tipo de Desconto */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo de Desconto</label>
                <div className={styles.typeSelector}>
                  <button
                    type="button"
                    onClick={() => setFormType('percentage')}
                    className={`${styles.typeOption} ${formType === 'percentage' ? styles.typeOptionSelected : ''}`}
                  >
                    <Percent size={16} />
                    <span>Porcentagem (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('fixed')}
                    className={`${styles.typeOption} ${formType === 'fixed' ? styles.typeOptionSelected : ''}`}
                  >
                    <DollarSign size={16} />
                    <span>Valor Fixo (R$)</span>
                  </button>
                </div>
              </div>

              {/* Valor do Desconto */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {formType === 'percentage' ? 'Porcentagem de Desconto (%)' : 'Valor do Desconto (R$)'} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  step={formType === 'percentage' ? '1' : '0.50'}
                  min="1"
                  max={formType === 'percentage' ? '100' : '9999'}
                  required
                  placeholder={formType === 'percentage' ? 'Ex: 10 para 10%' : 'Ex: 5.00 para R$ 5,00'}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value ? Number(e.target.value) : '')}
                  className={styles.formInput}
                />
              </div>

              {/* Tempo do Cupom (Validade) */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Tempo de Validade do Cupom
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="hasExpiry"
                    checked={formHasExpiry}
                    onChange={(e) => {
                      setFormHasExpiry(e.target.checked);
                      if (!e.target.checked) setFormExpiresAt('');
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="hasExpiry" style={{ fontSize: '0.8125rem', color: '#4A3B32', cursor: 'pointer', fontWeight: 500 }}>
                    Definir prazo de expiração (tempo limitado)
                  </label>
                </div>

                {formHasExpiry && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                    <input
                      type="date"
                      required={formHasExpiry}
                      min={new Date().toISOString().substring(0, 10)}
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className={styles.formInput}
                    />

                    <div className={styles.presetDatesRow}>
                      <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', alignSelf: 'center' }}>Atalhos:</span>
                      <button type="button" onClick={() => setExpiryDays(7)} className={styles.presetDateBtn}>
                        +7 dias
                      </button>
                      <button type="button" onClick={() => setExpiryDays(15)} className={styles.presetDateBtn}>
                        +15 dias
                      </button>
                      <button type="button" onClick={() => setExpiryDays(30)} className={styles.presetDateBtn}>
                        +30 dias
                      </button>
                      <button type="button" onClick={setExpiryEndOfMonth} className={styles.presetDateBtn}>
                        Fim do mês
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pedido Mínimo */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Valor Mínimo do Pedido (Opcional)
                  <span className={styles.formLabelHint}>(Deixe vazio para qualquer valor)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ex: 50 (válido para compras acima de R$ 50)"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(e.target.value ? Number(e.target.value) : '')}
                  className={styles.formInput}
                />
              </div>

              {/* Descrição */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Descrição ou Observação (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cupom de Black Friday, Primeira compra de cliente..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={styles.formInput}
                  maxLength={100}
                />
              </div>

              {/* Regra de 1ª Compra */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="firstPurchaseOnly"
                  checked={formFirstPurchaseOnly}
                  onChange={(e) => setFormFirstPurchaseOnly(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer' }}
                />
                <label htmlFor="firstPurchaseOnly" style={{ fontSize: '0.8125rem', color: '#4A3B32', cursor: 'pointer', fontWeight: 600 }}>
                  Válido apenas na 1ª compra do cliente
                  <span style={{ display: 'block', fontSize: '11px', color: '#8C7A6B', fontWeight: 400, marginTop: 2 }}>
                    Bloqueia automaticamente compras subsequentes com este mesmo número de WhatsApp ou no mesmo aparelho.
                  </span>
                </label>
              </div>

              {/* Status Inicial */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ fontSize: '0.8125rem', color: '#4A3B32', cursor: 'pointer', fontWeight: 600 }}>
                  Deixar cupom ativo imediatamente no site
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.btnSave}
                >
                  {saving ? 'Salvando...' : editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingCoupon && (
        <div className={styles.modalOverlay} onClick={() => setDeletingCoupon(null)}>
          <div className={styles.modalCard} style={{ maxWidth: '24rem', padding: '1.5rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Trash2 size={24} />
            </div>
            
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2D231E', marginBottom: '0.5rem' }}>
              Excluir Cupom?
            </h3>
            
            <p style={{ fontSize: '0.8125rem', color: '#6D5B50', marginBottom: '1.5rem' }}>
              Tem certeza que deseja apagar o cupom <strong>{deletingCoupon.code}</strong>? Os clientes não poderão mais utilizá-lo.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                className={styles.btnCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{ backgroundColor: '#DC2626', color: '#ffffff', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
