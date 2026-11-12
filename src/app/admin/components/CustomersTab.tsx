'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Crown,
  DollarSign,
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  ShoppingBag,
  MessageCircle,
  X,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { CustomerRecord, CustomerPurchase } from '@/lib/customersStore';
import styles from './CustomersTab.module.css';

interface CustomersTabProps {
  onCustomersCountChange?: (count: number) => void;
}

type LoyaltyFilter = 'all' | 'loyal' | 'vip';
type SortOption = 'most_orders' | 'highest_spent' | 'recent_purchase' | 'name_asc';

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'CL';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatWhatsappHref(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  const withDdi = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withDdi}`;
}

export default function CustomersTab({ onCustomersCountChange }: CustomersTabProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<LoyaltyFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('most_orders');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal Criar / Editar Ficha de Cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custInstagram, setCustInstagram] = useState('');
  const [custNotes, setCustNotes] = useState('');
  // Primeira compra opcional ao cadastrar cliente novo
  const [initItem, setInitItem] = useState('');
  const [initQty, setInitQty] = useState('');
  const [initAmount, setInitAmount] = useState('');
  const [initDate, setInitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [initNotes, setInitNotes] = useState('');
  const [customerFormError, setCustomerFormError] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Modal Adicionar / Editar Compra na Ficha
  const [purchaseTargetCustomer, setPurchaseTargetCustomer] = useState<CustomerRecord | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<CustomerPurchase | null>(null);
  const [purchItem, setPurchItem] = useState('');
  const [purchQty, setPurchQty] = useState('');
  const [purchAmount, setPurchAmount] = useState('');
  const [purchDate, setPurchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purchNotes, setPurchNotes] = useState('');
  const [purchaseFormError, setPurchaseFormError] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Confirmação de Exclusão
  const [deleteTarget, setDeleteTarget] = useState<
    | null
    | { kind: 'customer'; customer: CustomerRecord }
    | { kind: 'purchase'; customer: CustomerRecord; purchase: CustomerPurchase }
  >(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        onCustomersCountChange?.(data.customers.length);
      }
    } catch (err) {
      console.error('Erro ao carregar fichas de clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      onCustomersCountChange?.(customers.length);
    }
  }, [customers.length, loading, onCustomersCountChange]);

  const handleSyncOrders = async () => {
    setSyncingOrders(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_orders' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSyncFeedback({
          text: data.error || 'Erro ao sincronizar pedidos existentes.',
          isError: true,
        });
        return;
      }

      if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
        onCustomersCountChange?.(data.customers.length);
      }

      const created = Number(data.createdCustomers) || 0;
      const added = Number(data.addedPurchases) || 0;

      if (created === 0 && added === 0) {
        setSyncFeedback({
          text: 'Tudo atualizado! Todos os pedidos já constam nas fichas dos clientes.',
        });
      } else {
        setSyncFeedback({
          text: `Sincronização concluída: ${created} ficha(s) criada(s) e ${added} compra(s) vinculada(s) a clientes existentes.`,
        });
      }
    } catch {
      setSyncFeedback({
        text: 'Falha de conexão ao sincronizar pedidos.',
        isError: true,
      });
    } finally {
      setSyncingOrders(false);
    }
  };

  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const totalOrders = c.purchases.length;
      const totalSpent = c.purchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const lastPurchaseDate = c.purchases[0]?.date || '';
      const isLoyal = totalOrders >= 2;
      const isVip = totalSpent >= 300 || totalOrders >= 3;
      return {
        ...c,
        totalOrders,
        totalSpent,
        lastPurchaseDate,
        isLoyal,
        isVip,
      };
    });
  }, [customers]);

  const kpis = useMemo(() => {
    const totalCustomers = enrichedCustomers.length;
    const loyalCount = enrichedCustomers.filter((c) => c.isLoyal).length;
    const totalRevenue = enrichedCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    return { totalCustomers, loyalCount, totalRevenue };
  }, [enrichedCustomers]);

  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = enrichedCustomers.filter((c) => {
      if (filter === 'loyal' && !c.isLoyal) return false;
      if (filter === 'vip' && !c.isVip) return false;

      if (!q) return true;
      const matchCustomer =
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.instagram || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q);
      const matchPurchase = c.purchases.some(
        (p) =>
          p.item.toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q)
      );
      return matchCustomer || matchPurchase;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'most_orders') {
        if (b.totalOrders !== a.totalOrders) return b.totalOrders - a.totalOrders;
        return b.totalSpent - a.totalSpent;
      }
      if (sortBy === 'highest_spent') {
        if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
        return b.totalOrders - a.totalOrders;
      }
      if (sortBy === 'recent_purchase') {
        const tA = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
        const tB = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
        return tB - tA;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [enrichedCustomers, searchTerm, filter, sortBy]);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustInstagram('');
    setCustNotes('');
    setInitItem('');
    setInitQty('');
    setInitAmount('');
    setInitDate(new Date().toISOString().slice(0, 10));
    setInitNotes('');
    setCustomerFormError('');
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setCustName(customer.name);
    setCustPhone(customer.phone || '');
    setCustInstagram(customer.instagram || '');
    setCustNotes(customer.notes || '');
    setCustomerFormError('');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      setCustomerFormError('Informe o nome do cliente.');
      return;
    }

    setSavingCustomer(true);
    setCustomerFormError('');

    try {
      if (editingCustomer) {
        const res = await fetch('/api/admin/customers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCustomer.id,
            name: custName,
            phone: custPhone,
            instagram: custInstagram,
            notes: custNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao atualizar ficha.');
        }
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? data.customer : c))
        );
      } else {
        const initialPurchase = initItem.trim()
          ? {
              item: initItem.trim(),
              quantity: initQty ? Number(initQty) : undefined,
              amount: Number(String(initAmount).replace(',', '.')) || 0,
              date: initDate || new Date().toISOString().slice(0, 10),
              notes: initNotes.trim(),
            }
          : undefined;

        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_customer',
            name: custName,
            phone: custPhone,
            instagram: custInstagram,
            notes: custNotes,
            initialPurchase,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao cadastrar ficha.');
        }
        setCustomers((prev) => [data.customer, ...prev]);
      }

      setIsCustomerModalOpen(false);
    } catch (err) {
      setCustomerFormError(
        err instanceof Error ? err.message : 'Erro ao salvar ficha do cliente.'
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const openAddPurchaseModal = (customer: CustomerRecord) => {
    setPurchaseTargetCustomer(customer);
    setEditingPurchase(null);
    setPurchItem('');
    setPurchQty('');
    setPurchAmount('');
    setPurchDate(new Date().toISOString().slice(0, 10));
    setPurchNotes('');
    setPurchaseFormError('');
  };

  const openEditPurchaseModal = (
    customer: CustomerRecord,
    purchase: CustomerPurchase
  ) => {
    setPurchaseTargetCustomer(customer);
    setEditingPurchase(purchase);
    setPurchItem(purchase.item);
    setPurchQty(purchase.quantity ? String(purchase.quantity) : '');
    setPurchAmount(String(purchase.amount));
    setPurchDate(purchase.date || new Date().toISOString().slice(0, 10));
    setPurchNotes(purchase.notes || '');
    setPurchaseFormError('');
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseTargetCustomer) return;
    if (!purchItem.trim()) {
      setPurchaseFormError('Descreva o que o cliente comprou.');
      return;
    }

    setSavingPurchase(true);
    setPurchaseFormError('');

    const parsedAmount = Number(String(purchAmount).replace(',', '.')) || 0;
    const parsedQty = purchQty ? Number(purchQty) : undefined;

    try {
      if (editingPurchase) {
        const res = await fetch('/api/admin/customers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_purchase',
            customerId: purchaseTargetCustomer.id,
            purchaseId: editingPurchase.id,
            item: purchItem.trim(),
            quantity: parsedQty,
            amount: parsedAmount,
            date: purchDate,
            notes: purchNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao atualizar compra.');
        }
        setCustomers((prev) =>
          prev.map((c) => (c.id === purchaseTargetCustomer.id ? data.customer : c))
        );
      } else {
        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_purchase',
            customerId: purchaseTargetCustomer.id,
            item: purchItem.trim(),
            quantity: parsedQty,
            amount: parsedAmount,
            date: purchDate,
            notes: purchNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao registrar compra.');
        }
        setCustomers((prev) =>
          prev.map((c) => (c.id === purchaseTargetCustomer.id ? data.customer : c))
        );
      }

      setPurchaseTargetCustomer(null);
      setEditingPurchase(null);
    } catch (err) {
      setPurchaseFormError(
        err instanceof Error ? err.message : 'Erro ao salvar compra.'
      );
    } finally {
      setSavingPurchase(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'customer') {
        const res = await fetch(
          `/api/admin/customers?id=${encodeURIComponent(deleteTarget.customer.id)}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.customer.id));
          setDeleteTarget(null);
        } else {
          alert(data.error || 'Não foi possível excluir a ficha do cliente.');
        }
      } else {
        const res = await fetch(
          `/api/admin/customers?id=${encodeURIComponent(
            deleteTarget.customer.id
          )}&purchaseId=${encodeURIComponent(deleteTarget.purchase.id)}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (res.ok && data.success && data.customer) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === deleteTarget.customer.id ? data.customer : c
            )
          );
          setDeleteTarget(null);
        } else {
          alert(data.error || 'Não foi possível excluir a compra.');
        }
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro de conexão ao tentar excluir.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.heading}>Fichas de Clientes & Fidelidade</h2>
          <p className={styles.subheading}>
            Cadastre seus clientes e o histórico de pedidos para lembrar exatamente o que cada um pediu nos anos anteriores.
          </p>
          <span className={styles.autoBadge}>
            <Check size={13} />
            Novos pedidos do site são registrados automaticamente aqui pelo mesmo telefone ou nome
          </span>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleSyncOrders}
            disabled={syncingOrders}
            className={styles.syncBtn}
            title="Importar pedidos antigos da aba Pedidos para as fichas sem duplicar"
          >
            <RefreshCw size={16} className={syncingOrders ? styles.spinning : ''} />
            <span>{syncingOrders ? 'Sincronizando...' : 'Sincronizar Pedidos'}</span>
          </button>

          <button type="button" onClick={openNewCustomerModal} className={styles.newBtn}>
            <Plus size={18} />
            <span>Nova Ficha de Cliente</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={styles.syncToast}
          style={
            syncFeedback.isError
              ? { backgroundColor: '#FDF2F2', color: '#B42318', borderColor: '#F5C2C0' }
              : undefined
          }
        >
          <span>{syncFeedback.text}</span>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className={styles.syncToastClose}
            aria-label="Fechar aviso"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div>
            <span className={styles.kpiLabel}>Clientes Cadastrados</span>
            <span className={styles.kpiValue}>{kpis.totalCustomers}</span>
            <span className={styles.kpiSub}>Fichas salvas no histórico</span>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: '#EFE6DC', color: '#6D4C3D' }}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <span className={styles.kpiLabel}>Clientes Fiéis (2+ compras)</span>
            <span className={styles.kpiValue}>{kpis.loyalCount}</span>
            <span className={styles.kpiSub}>Voltaram para pedir novamente</span>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: '#FEF7E0', color: '#9A6700' }}>
            <Crown size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <span className={styles.kpiLabel}>Total Registrado nas Fichas</span>
            <span className={styles.kpiValue}>{formatCurrency(kpis.totalRevenue)}</span>
            <span className={styles.kpiSub}>Soma de todas as compras anotadas</span>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: '#E6F4EA', color: '#2F7A48' }}>
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Busca, Filtros e Ordenação */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone, Instagram ou produto comprado (ex: Lata Natalina)..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.controlsRight}>
          <div className={styles.filterPills}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`${styles.pillBtn} ${filter === 'all' ? styles.pillBtnActive : ''}`}
            >
              Todos ({enrichedCustomers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('loyal')}
              className={`${styles.pillBtn} ${filter === 'loyal' ? styles.pillBtnActive : ''}`}
            >
              <Crown size={12} /> Fiéis ({kpis.loyalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('vip')}
              className={`${styles.pillBtn} ${filter === 'vip' ? styles.pillBtnActive : ''}`}
            >
              <Sparkles size={12} /> VIP
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={styles.sortSelect}
            aria-label="Ordenar clientes"
          >
            <option value="most_orders">Mais Fiéis (Nº de Compras)</option>
            <option value="highest_spent">Maior Valor Gasto</option>
            <option value="recent_purchase">Compra Mais Recente</option>
            <option value="name_asc">Ordem Alfabética (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Listagem */}
      {loading ? (
        <div className={styles.emptyBox}>Carregando fichas de clientes...</div>
      ) : filteredAndSorted.length === 0 ? (
        <div className={styles.emptyBox}>
          <Users size={36} color="#C8B6A2" />
          <p style={{ margin: 0, fontWeight: 700, color: '#4A3B32' }}>
            {customers.length === 0
              ? 'Nenhuma ficha de cliente cadastrada ainda'
              : 'Nenhum cliente encontrado para essa busca ou filtro'}
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>
            {customers.length === 0
              ? 'Clique em "Nova Ficha de Cliente" para começar a guardar os pedidos de quem compra com você.'
              : 'Tente limpar a busca ou mudar o filtro selecionado.'}
          </p>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {filteredAndSorted.map((c) => {
            const isExpanded = Boolean(expandedCards[c.id]);
            const visiblePurchases = isExpanded
              ? c.purchases
              : c.purchases.slice(0, 3);
            const whatsappHref = formatWhatsappHref(c.phone);

            return (
              <div
                key={c.id}
                className={`${styles.customerCard} ${
                  c.isLoyal ? styles.customerCardLoyal : ''
                }`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.identityGroup}>
                    <div
                      className={`${styles.avatar} ${
                        c.isLoyal ? styles.avatarLoyal : ''
                      }`}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.nameLine}>
                        <h3 className={styles.customerName}>{c.name}</h3>
                        {c.isLoyal && (
                          <span className={styles.loyalBadge}>
                            <Crown size={11} /> Fiel • {c.totalOrders} compras
                          </span>
                        )}
                        {c.isVip && (
                          <span className={styles.vipBadge}>
                            <Sparkles size={11} /> VIP
                          </span>
                        )}
                      </div>

                      <div className={styles.contactMeta}>
                        {c.phone && whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.contactLink}
                            title="Abrir conversa no WhatsApp"
                          >
                            <MessageCircle size={12} /> {c.phone}
                          </a>
                        )}
                        {c.instagram && <span>@{c.instagram}</span>}
                        {!c.phone && !c.instagram && (
                          <span>Sem contato informado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => openAddPurchaseModal(c)}
                      className={styles.addPurchaseMiniBtn}
                      title="Registrar uma nova compra para este cliente"
                    >
                      <Plus size={13} /> Compra
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCustomerModal(c)}
                      className={styles.iconBtn}
                      title="Editar dados do cliente"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ kind: 'customer', customer: c })
                      }
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      title="Excluir ficha do cliente"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {c.notes && (
                  <div className={styles.customerNotesBox}>
                    <strong>Preferências / Notas:</strong> {c.notes}
                  </div>
                )}

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Compras</span>
                    <span className={styles.statVal}>{c.totalOrders}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Gasto</span>
                    <span className={styles.statVal} style={{ color: '#2F7A48' }}>
                      {formatCurrency(c.totalSpent)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Última Compra</span>
                    <span className={styles.statVal}>
                      {formatDateBR(c.lastPurchaseDate)}
                    </span>
                  </div>
                </div>

                <div className={styles.historySection}>
                  <div className={styles.historyHeader}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShoppingBag size={13} /> Histórico do que comprou
                    </span>
                    <span>{c.totalOrders} registro(s)</span>
                  </div>

                  {c.purchases.length === 0 ? (
                    <div className={styles.emptyPurchases}>
                      Nenhuma compra anotada ainda. Clique em &quot;+ Compra&quot; para registrar.
                    </div>
                  ) : (
                    <>
                      <div className={styles.purchaseList}>
                        {visiblePurchases.map((p) => (
                          <div key={p.id} className={styles.purchaseRow}>
                            <div className={styles.purchaseMain}>
                              <div className={styles.purchaseTitleLine}>
                                <span className={styles.purchaseDateBadge}>
                                  <Calendar size={11} /> {formatDateBR(p.date)}
                                </span>
                                {p.quantity && p.quantity > 0 && (
                                  <span className={styles.purchaseQtyBadge}>
                                    {p.quantity} un.
                                  </span>
                                )}
                              </div>
                              <p className={styles.purchaseItemText}>{p.item}</p>
                              {p.notes && (
                                <p className={styles.purchaseNotesText}>{p.notes}</p>
                              )}
                            </div>

                            <div className={styles.purchaseRight}>
                              <span className={styles.purchasePrice}>
                                {formatCurrency(p.amount)}
                              </span>
                              <div className={styles.purchaseMiniActions}>
                                <button
                                  type="button"
                                  onClick={() => openEditPurchaseModal(c, p)}
                                  className={styles.tinyActionBtn}
                                  title="Editar esta compra"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      kind: 'purchase',
                                      customer: c,
                                      purchase: p,
                                    })
                                  }
                                  className={`${styles.tinyActionBtn} ${styles.tinyActionBtnDanger}`}
                                  title="Excluir esta compra"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {c.purchases.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              [c.id]: !isExpanded,
                            }))
                          }
                          className={styles.expandBtn}
                        >
                          {isExpanded
                            ? 'Mostrar menos'
                            : `Ver todas as ${c.purchases.length} compras`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Ficha do Cliente */}
      {isCustomerModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCustomer ? 'Editar Ficha do Cliente' : 'Nova Ficha de Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Nome do Cliente *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ex: Maria Clara Oliveira"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="Ex: (35) 99999-9999"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Instagram (opcional)</label>
                    <input
                      type="text"
                      value={custInstagram}
                      onChange={(e) => setCustInstagram(e.target.value)}
                      placeholder="Ex: mariaclara"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Observações / Preferências do Cliente</label>
                  <textarea
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="Ex: Retira em Pouso Alegre, gosta de tons pastéis e laço de cetim..."
                    className={styles.textarea}
                  />
                </div>

                {!editingCustomer && (
                  <div className={styles.sectionDivider}>
                    <span className={styles.sectionMiniTitle}>
                      1ª Compra (Opcional — já registre o que ele pediu)
                    </span>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>O que o cliente comprou</label>
                      <input
                        type="text"
                        value={initItem}
                        onChange={(e) => setInitItem(e.target.value)}
                        placeholder="Ex: Mini Lata Natalina Laço Verde (Tema Papai Noel - Nome: Luís)"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGrid2}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Quantidade</label>
                        <input
                          type="number"
                          min={1}
                          value={initQty}
                          onChange={(e) => setInitQty(e.target.value)}
                          placeholder="Ex: 30"
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Valor Total (R$)</label>
                        <input
                          type="text"
                          value={initAmount}
                          onChange={(e) => setInitAmount(e.target.value)}
                          placeholder="Ex: 450,00"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formGrid2}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Data da Compra</label>
                        <input
                          type="date"
                          value={initDate}
                          onChange={(e) => setInitDate(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Detalhes dessa compra</label>
                        <input
                          type="text"
                          value={initNotes}
                          onChange={(e) => setInitNotes(e.target.value)}
                          placeholder="Ex: Laço verde, tag Boas Festas"
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {customerFormError && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={15} />
                    <span>{customerFormError}</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className={styles.saveBtn}
                >
                  <Check size={16} />
                  <span>
                    {savingCustomer
                      ? 'Salvando...'
                      : editingCustomer
                      ? 'Salvar Alterações'
                      : 'Salvar Ficha'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar / Editar Compra na Ficha */}
      {purchaseTargetCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingPurchase
                  ? `Editar Compra — ${purchaseTargetCustomer.name}`
                  : `Nova Compra — ${purchaseTargetCustomer.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPurchaseTargetCustomer(null);
                  setEditingPurchase(null);
                }}
                className={styles.closeBtn}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase}>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>O que o cliente comprou *</label>
                  <input
                    type="text"
                    value={purchItem}
                    onChange={(e) => setPurchItem(e.target.value)}
                    placeholder="Ex: Caderno Personalizado Luxo Azul + Porta-Chocolate"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Quantidade (opcional)</label>
                    <input
                      type="number"
                      min={1}
                      value={purchQty}
                      onChange={(e) => setPurchQty(e.target.value)}
                      placeholder="Ex: 25"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Valor Total (R$) *</label>
                    <input
                      type="text"
                      value={purchAmount}
                      onChange={(e) => setPurchAmount(e.target.value)}
                      placeholder="Ex: 280,00"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Data da Compra *</label>
                  <input
                    type="date"
                    value={purchDate}
                    onChange={(e) => setPurchDate(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Detalhes do pedido (tema, cor do laço, nome na arte...)</label>
                  <textarea
                    value={purchNotes}
                    onChange={(e) => setPurchNotes(e.target.value)}
                    placeholder="Ex: Mesma arte do ano passado, nome atualizado para Ana..."
                    className={styles.textarea}
                  />
                </div>

                {purchaseFormError && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={15} />
                    <span>{purchaseFormError}</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseTargetCustomer(null);
                    setEditingPurchase(null);
                  }}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPurchase}
                  className={styles.saveBtn}
                >
                  <Check size={16} />
                  <span>
                    {savingPurchase ? 'Salvando...' : 'Salvar Compra'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '26rem' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {deleteTarget.kind === 'customer'
                  ? 'Excluir Ficha do Cliente?'
                  : 'Excluir Registro de Compra?'}
              </h3>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={styles.closeBtn}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#5C4E45', lineHeight: 1.5 }}>
                {deleteTarget.kind === 'customer'
                  ? `Tem certeza que deseja excluir a ficha de "${deleteTarget.customer.name}" e todo o histórico de compras dele?`
                  : `Tem certeza que deseja remover "${deleteTarget.purchase.item}" da ficha de ${deleteTarget.customer.name}?`}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={styles.cancelBtn}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={styles.dangerBtn}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
