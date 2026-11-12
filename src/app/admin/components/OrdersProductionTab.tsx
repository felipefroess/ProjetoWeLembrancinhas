'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  Package,
  CheckCheck,
  Eye,
  MessageCircle,
  Phone,
  Calendar,
  Printer,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Tag
} from 'lucide-react';
import { ProductionOrder, OrderStatus } from '@/types';
import { getSupabase } from '@/lib/supabase';
import styles from '../Admin.module.css';

interface OrdersProductionTabProps {
  onOrderCountChange?: (count: number) => void;
}

interface KanbanStageConfig {
  id: OrderStatus;
  label: string;
  subtitle: string;
  colClass: string;
  badgeBg: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const STAGES: KanbanStageConfig[] = [
  {
    id: 'em_analise',
    label: 'Em análise',
    subtitle: 'Conferir dados e detalhes do pedido',
    colClass: styles.colAnalise,
    badgeBg: '#EDE9FE',
    badgeColor: '#5B21B6',
    icon: <ClipboardList size={16} />,
  },
  {
    id: 'em_producao',
    label: 'Em Produção',
    subtitle: 'Impressão, corte e montagem',
    colClass: styles.colProducao,
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    icon: <Sparkles size={16} />,
  },
  {
    id: 'pronto',
    label: 'Pronto p/ Envio / Retirada',
    subtitle: 'Embalado com carinho',
    colClass: styles.colPronto,
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    icon: <Package size={16} />,
  },
  {
    id: 'entregue',
    label: 'Entregue',
    subtitle: 'Pedido concluído com sucesso',
    colClass: styles.colEntregue,
    badgeBg: '#E5E7EB',
    badgeColor: '#4B5563',
    icon: <CheckCheck size={16} />,
  },
];

const STAGE_ORDER: OrderStatus[] = [
  'em_analise',
  'em_producao',
  'pronto',
  'entregue',
];

function formatDeliveryLabel(method?: string): string {
  if (!method) return 'A combinar';
  if (method === 'retirada-pouso-alegre') return 'Retirada em Pouso Alegre';
  if (method === 'retirada-paraisopolis') return 'Retirada em Paraisópolis';
  if (method === 'entrega-correios') return 'Envio / Correios';
  return method;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return 'Não informada';
  try {
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatWhatsAppUrl(rawPhone: string | undefined, message: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function OrdersProductionTab({ onOrderCountChange }: OrdersProductionTabProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('supabase');

  // Notifica o componente pai sobre a contagem de pedidos de forma segura após o render
  useEffect(() => {
    onOrderCountChange?.(orders.length);
  }, [orders.length, onOrderCountChange]);

  // Busca inicial e atualização dos pedidos sem cache
  const loadOrders = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.source) setDataSource(data.source);
        if (selectedOrder) {
          const fresh = data.orders.find((o: ProductionOrder) => String(o.id) === String(selectedOrder.id));
          if (fresh) setSelectedOrder(fresh);
        }
      }

      // Verificação de contingência: restaura pedidos offline salvos em localStorage se existirem
      try {
        const backupKey = 'we_backup_orders';
        const stored = typeof window !== 'undefined' ? localStorage.getItem(backupKey) : null;
        if (stored) {
          const backupList = JSON.parse(stored);
          if (Array.isArray(backupList) && backupList.length > 0) {
            for (const backupOrder of backupList) {
              fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupOrder),
              }).catch(() => {});
            }
          }
        }
      } catch {
        // Ignora erro de contingência
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sincronização ao vivo: Supabase Realtime + Polling a cada 10s + Foco da aba
  useEffect(() => {
    loadOrders();

    const supabase = getSupabase();
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('admin-orders-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadOrders(true);
        })
        .subscribe();
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrders(true);
      }
    }, 10000);

    const handleFocus = () => loadOrders(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exclusão / Cancelamento de pedido
  const handleDeleteOrder = async (orderId: string, customerName?: string) => {
    const shortCode = orderId.slice(-6).toUpperCase();
    const confirmed = window.confirm(
      `Deseja realmente remover o pedido #${shortCode}${customerName ? ` de ${customerName}` : ''}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.error || 'Erro ao remover pedido.');
      }
    } catch (err) {
      console.error('Erro ao deletar pedido:', err);
      alert('Erro ao se conectar ao servidor.');
    }
  };

  // Atualização rápida de status (com atualização otimista)
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Erro ao atualizar etapa do pedido.');
        loadOrders(true);
      }
    } catch {
      alert('Falha ao comunicar com o servidor.');
      loadOrders(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNextStage = (order: ProductionOrder) => {
    const currentIndex = STAGE_ORDER.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
      handleUpdateStatus(order.id, STAGE_ORDER[currentIndex + 1]);
    }
  };

  const handlePrevStage = (order: ProductionOrder) => {
    const currentIndex = STAGE_ORDER.indexOf(order.status);
    if (currentIndex > 0) {
      handleUpdateStatus(order.id, STAGE_ORDER[currentIndex - 1]);
    }
  };

  // Disparo WhatsApp de pedido pronto
  const handleWhatsAppReady = (order: ProductionOrder) => {
    const msg = `Olá ${order.customer_name}! Sua encomenda da Wê Lembrancinhas está pronta para envio/retirada!`;
    const url = formatWhatsAppUrl(order.customer_phone, msg);
    if (!url) {
      alert('Este pedido não possui telefone cadastrado.');
      return;
    }
    window.open(url, '_blank');
  };

  const handleWhatsAppContact = (order: ProductionOrder) => {
    const orderCode = order.id.slice(-6).toUpperCase();
    const msg = `Olá ${order.customer_name}! Tudo bem? É da Wê Lembrancinhas referente ao seu pedido #${orderCode}.`;
    const url = formatWhatsAppUrl(order.customer_phone, msg);
    if (!url) {
      alert('Este pedido não possui telefone cadastrado.');
      return;
    }
    window.open(url, '_blank');
  };

  // Filtros aplicados
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro de status
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }
      // Filtro de busca textual
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = order.customer_name?.toLowerCase().includes(q);
      const matchPhone = order.customer_phone?.toLowerCase().includes(q);
      const matchId = order.id?.toLowerCase().includes(q);
      const matchItems = order.items?.some((it: any) => {
        const prodName = it.product?.name?.toLowerCase() || '';
        const childName = it.customization?.childName?.toLowerCase() || '';
        const variation = it.customization?.variation?.toLowerCase() || '';
        return prodName.includes(q) || childName.includes(q) || variation.includes(q);
      });
      return matchName || matchPhone || matchId || matchItems;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <section className={styles.ordersSection}>
      {/* Cabeçalho da Aba de Pedidos */}
      <div className={styles.ordersHeaderRow}>
        <div>
          <h2 className={styles.ordersHeading}>
            <ClipboardList size={26} color="#6D4C3D" />
            <span>Gestão de Pedidos & Fila de Produção</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: dataSource === 'supabase' ? '#DCFCE7' : '#FEF3C7',
                color: dataSource === 'supabase' ? '#166534' : '#92400E',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: '0.5rem',
                verticalAlign: 'middle',
              }}
              title={dataSource === 'supabase' ? 'Conectado e sincronizado com o banco Supabase em tempo real' : 'Usando armazenamento local com redundância'}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dataSource === 'supabase' ? '#16A34A' : '#D97706' }} />
              {dataSource === 'supabase' ? 'Sincronizado ao Vivo' : 'Armazenamento Local'}
            </span>
          </h2>
          <p className={styles.ordersSubheading}>
            Acompanhe cada etapa de fabricação, consulte a personalização em 1 clique e notifique clientes pelo WhatsApp.
          </p>
        </div>

        <div className={styles.ordersHeaderActions}>
          {/* Alternador de Modo de Visualização */}
          <div className={styles.viewModeToggle}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`${styles.viewModeBtn} ${viewMode === 'kanban' ? styles.viewModeBtnActive : ''}`}
              title="Quadro Kanban de Produção"
            >
              <LayoutGrid size={15} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`${styles.viewModeBtn} ${viewMode === 'tabela' ? styles.viewModeBtnActive : ''}`}
              title="Tabela de Pedidos"
            >
              <List size={15} />
              <span>Lista</span>
            </button>
          </div>

          {/* Botão de Atualizar */}
          <button
            type="button"
            onClick={() => loadOrders()}
            className={styles.refreshOrdersBtn}
            disabled={refreshing}
            title="Recarregar pedidos"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Controles de Busca e Filtros de Status */}
      <div className={styles.ordersControlsRow}>
        {/* Campo de Busca */}
        <div className={styles.ordersSearchBox}>
          <Search size={16} className={styles.ordersSearchIcon} />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone, modelo ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.ordersSearchInput}
          />
        </div>

        {/* Pílulas de Filtro de Status */}
        <div className={styles.ordersFilterPills}>
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={`${styles.filterPillBtn} ${statusFilter === 'todos' ? styles.filterPillBtnActive : ''}`}
          >
            <span>Todos</span>
            <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({orders.length})</span>
          </button>

          {STAGES.map((stg) => {
            const count = orders.filter((o) => o.status === stg.id).length;
            const isActive = statusFilter === stg.id;
            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => setStatusFilter(stg.id)}
                className={`${styles.filterPillBtn} ${isActive ? styles.filterPillBtnActive : ''}`}
              >
                {stg.icon}
                <span>{stg.label}</span>
                <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualização: QUADRO KANBAN */}
      {viewMode === 'kanban' && (
        <div className={styles.kanbanBoard}>
          {STAGES.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);

            return (
              <div key={col.id} className={`${styles.kanbanColumn} ${col.colClass}`}>
                {/* Cabeçalho da Coluna */}
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleRow}>
                    <div className={styles.columnTitleWithIcon}>
                      {col.icon}
                      <span>{col.label}</span>
                    </div>
                    <span className={styles.columnBadge}>{colOrders.length}</span>
                  </div>
                  <p className={styles.columnSubtitle}>{col.subtitle}</p>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className={styles.columnCardsList}>
                  {colOrders.length === 0 ? (
                    <div className={styles.emptyColumnNotice}>Nenhum pedido nesta etapa</div>
                  ) : (
                    colOrders.map((order) => {
                      const firstItem = order.items && order.items[0];
                      const totalItemsCount = order.items ? order.items.length : 0;
                      const orderShortId = order.id.slice(-6).toUpperCase();

                      return (
                        <div key={order.id} className={styles.kanbanCard}>
                          {/* Topo do Card: Código, Entrega & Botão Excluir */}
                          <div className={styles.cardTopRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span className={styles.orderIdBadge}>#{orderShortId}</span>
                              <span
                                className={`${styles.deliveryBadge} ${
                                  order.delivery_method === 'entrega-correios'
                                    ? styles.deliveryCorreios
                                    : styles.deliveryRetirada
                                }`}
                              >
                                {formatDeliveryLabel(order.delivery_method)}
                              </span>
                            </div>

                            {/* Botão de Remover Pedido */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id, order.customer_name)}
                              className={styles.deleteOrderBtn}
                              title="Remover / Cancelar Pedido"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Seção do Cliente & Contato */}
                          <div className={styles.cardCustomerSection}>
                            <span className={styles.cardCustomerName}>{order.customer_name}</span>
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className={styles.cardCustomerPhone}
                                title="Telefone do cliente"
                              >
                                <Phone size={12} />
                                <span>{order.customer_phone}</span>
                              </a>
                            )}
                          </div>

                          {/* Data do Evento / Aniversário */}
                          {order.event_date && (
                            <div className={styles.cardEventDateRow}>
                              <Calendar size={13} />
                              <span>Data: {formatDateDisplay(order.event_date)}</span>
                            </div>
                          )}

                          {/* Apenas o Produto (Sem observações no card, apenas em Ver Detalhes) */}
                          {firstItem && (
                            <div className={styles.cardCustomizationBox}>
                              <div className={styles.cardItemHeader}>
                                <img
                                  src={firstItem.product?.image || '/images/placeholder.jpg'}
                                  alt={firstItem.product?.name || 'Produto'}
                                  className={styles.cardItemThumb}
                                />
                                <span className={styles.cardItemName}>
                                  <strong>{firstItem.quantity || 1}x</strong> {firstItem.product?.name || 'Item'}
                                </span>
                              </div>

                              {totalItemsCount > 1 && (
                                <span className={styles.cardMoreItemsNote}>
                                  + {totalItemsCount - 1} outro(s) item(ns)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Rodapé com Valores e Ações Rápidas */}
                          <div className={styles.cardFooter}>
                            <div className={styles.cardTotalRow}>
                              <span className={styles.cardTotalValue}>
                                R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                              </span>
                              <span className={styles.cardUnitsCount}>
                                {order.total_units || 1} un.
                              </span>
                            </div>

                            {/* Botão de Notificação via WhatsApp */}
                            {col.id === 'pronto' ? (
                              <button
                                type="button"
                                onClick={() => handleWhatsAppReady(order)}
                                className={styles.whatsappReadyBtn}
                                title="Avisar no WhatsApp que a encomenda está pronta para retirada/envio"
                              >
                                <MessageCircle size={15} />
                                <span>Avisar que está pronto</span>
                              </button>
                            ) : (
                              <div className={styles.cardActionsRow}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className={styles.detailsBtn}
                                >
                                  <Eye size={13} />
                                  <span>Ver Detalhes</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppContact(order)}
                                  className={styles.whatsappContactBtn}
                                  title="Falar no WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                </button>
                              </div>
                            )}

                            {col.id === 'pronto' && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className={styles.detailsBtn}
                              >
                                <Eye size={13} />
                                <span>Ver Detalhes</span>
                              </button>
                            )}

                            {/* Controles de Transição de Etapa */}
                            <div className={styles.cardStageControls}>
                              <button
                                type="button"
                                onClick={() => handlePrevStage(order)}
                                disabled={order.status === STAGE_ORDER[0] || updatingId === order.id}
                                className={styles.stageMoveBtn}
                                title="Voltar para etapa anterior"
                              >
                                <ChevronLeft size={13} />
                                <span>Voltar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleNextStage(order)}
                                disabled={
                                  order.status === STAGE_ORDER[STAGE_ORDER.length - 1] ||
                                  updatingId === order.id
                                }
                                className={`${styles.stageMoveBtn} ${styles.stageMoveBtnNext}`}
                                title="Avançar para a próxima etapa"
                              >
                                <span>Avançar</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização: TABELA / LISTA */}
      {viewMode === 'tabela' && (
        <div className={styles.ordersTableView}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente & Contato</th>
                <th>Data do Evento</th>
                <th>Entrega</th>
                <th>Itens Principais</th>
                <th>Total</th>
                <th>Etapa Atual</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8C7A6B' }}>
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderShortId = order.id.slice(-6).toUpperCase();
                  const firstItem = order.items && order.items[0];

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className={styles.orderIdBadge}>#{orderShortId}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700 }}>{order.customer_name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#8C7A6B' }}>
                            {order.customer_phone || 'Sem telefone'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>
                          {formatDateDisplay(order.event_date)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.deliveryBadge} ${
                            order.delivery_method === 'entrega-correios'
                              ? styles.deliveryCorreios
                              : styles.deliveryRetirada
                          }`}
                        >
                          {formatDeliveryLabel(order.delivery_method)}
                        </span>
                      </td>
                      <td>
                        {firstItem ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                            <span>
                              <strong>{firstItem.quantity || 1}x</strong> {firstItem.product?.name}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#2E7D32' }}>
                          R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                        </strong>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={styles.statusSelect}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={styles.detailsBtn}
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Ver detalhes da personalização"
                          >
                            <Eye size={14} />
                            <span>Detalhes</span>
                          </button>
                          {order.status === 'pronto' ? (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppReady(order)}
                              className={styles.whatsappReadyBtn}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', width: 'auto' }}
                              title="Avisar que está pronto"
                            >
                              <MessageCircle size={14} />
                              <span>Avisar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppContact(order)}
                              className={styles.whatsappContactBtn}
                              style={{ width: '2rem', height: '2rem' }}
                              title="Falar no WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.customer_name)}
                            className={styles.deleteOrderBtn}
                            style={{ width: '2rem', height: '2rem' }}
                            title="Remover pedido"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================================================
          MODAL DE DETALHES DA PERSONALIZAÇÃO EM 1 CLIQUE
          ========================================================================== */}
      {selectedOrder && (
        <div className={styles.orderModalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.orderModalCard} onClick={(e) => e.stopPropagation()}>
            {/* Cabeçalho do Modal */}
            <div className={styles.orderModalHeader}>
              <div className={styles.orderModalTitleGroup}>
                <h3 className={styles.orderModalTitle}>
                  <span>Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</span>
                </h3>
                <div className={styles.orderModalMeta}>
                  <span>Cliente: <strong>{selectedOrder.customer_name}</strong></span>
                  <span>•</span>
                  <span>Data do Pedido: {formatDateDisplay(selectedOrder.created_at)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={styles.closeBtn}
                title="Fechar detalhes"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className={styles.orderModalBody}>
              {/* Barra de Status & Transição Rápida */}
              <div className={styles.orderStatusBanner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6D4C3D' }}>
                    Status de Produção:
                  </span>
                  <span
                    className={styles.columnBadge}
                    style={{
                      backgroundColor: STAGES.find((s) => s.id === selectedOrder.status)?.badgeBg,
                      color: STAGES.find((s) => s.id === selectedOrder.status)?.badgeColor,
                    }}
                  >
                    {STAGES.find((s) => s.id === selectedOrder.status)?.label}
                  </span>
                </div>

                <div className={styles.statusChangeGroup}>
                  <span style={{ fontSize: '0.8125rem', color: '#8C7A6B' }}>Mudar Etapa:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                    className={styles.statusSelect}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seção: Itens & Personalização Solicitada */}
              <div>
                <h4 className={styles.modalSectionHeading}>
                  <Tag size={16} color="#6D4C3D" />
                  <span>Itens e Personalização Escolhida pelo Cliente</span>
                </h4>

                <div className={styles.modalItemsList}>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((it: any, idx: number) => {
                      const cust = it.customization || {};

                      return (
                        <div key={idx} className={styles.modalItemCard}>
                          <div className={styles.modalItemTop}>
                            <img
                              src={it.product?.image || '/images/placeholder.jpg'}
                              alt={it.product?.name || 'Produto'}
                              className={styles.modalItemImage}
                            />
                            <div className={styles.modalItemInfo}>
                              <h5 className={styles.modalItemTitle}>{it.product?.name}</h5>
                              <div className={styles.modalItemPriceRow}>
                                <span>Quantidade: <strong>{it.quantity || 1} un.</strong></span>
                                <span>•</span>
                                <span>Preço unitário: R$ {Number(it.product?.price || 0).toFixed(2).replace('.', ',')}</span>
                                <span>•</span>
                                <span style={{ color: '#2E7D32', fontWeight: 700 }}>
                                  Subtotal: R$ {Number(it.subtotal || (it.quantity || 1) * (it.product?.price || 0)).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Grid com os Detalhes da Personalização */}
                          <div className={styles.modalSpecsGrid}>
                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>🏷️ Modelo / Variação</span>
                              <span className={`${styles.specValue} ${cust.variation ? styles.specValueHighlight : ''}`}>
                                {cust.variation || 'Modelo Padrão'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>👶 Nome na Lembrancinha</span>
                              <span className={`${styles.specValue} ${cust.childName ? styles.specValueHighlight : ''}`}>
                                {cust.childName || 'Não especificado'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>📅 Data do Evento / Aniversário</span>
                              <span className={styles.specValue}>
                                {cust.ageOrDate || formatDateDisplay(selectedOrder.event_date) || 'Não informada'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>🎀 Cor da Fita / Laço</span>
                              <span className={`${styles.specValue} ${cust.ribbonColor ? styles.specValueHighlight : ''}`}>
                                {cust.ribbonColor || 'Padrão da foto'}
                              </span>
                            </div>

                            {/* Campos Adicionais Customizados */}
                            {cust.customFieldValues &&
                              Object.entries(cust.customFieldValues).map(([k, val]) => (
                                <div key={k} className={styles.specBox}>
                                  <span className={styles.specLabel}>📋 {k}</span>
                                  <span className={styles.specValue}>{String(val)}</span>
                                </div>
                              ))}
                          </div>

                          {/* Observações específicas do item */}
                          {cust.notes && (
                            <div className={styles.itemNotesBox}>
                              <strong>Observações do Produto:</strong> {cust.notes}
                            </div>
                          )}

                          {/* Observações gerais do pedido em baixo da obs do produto */}
                          {selectedOrder.general_notes && (
                            <div className={styles.itemNotesBox} style={{ marginTop: cust.notes ? '0.5rem' : '0' }}>
                              <strong>Observações Gerais do Pedido:</strong> {selectedOrder.general_notes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: '#8C7A6B', fontStyle: 'italic' }}>
                      Nenhum detalhe de item encontrado para este pedido.
                    </p>
                  )}
                </div>
              </div>

              {/* Seção: Dados de Entrega & Cliente */}
              <div>
                <h4 className={styles.modalSectionHeading}>
                  <MapPin size={16} color="#6D4C3D" />
                  <span>Dados do Cliente & Entrega</span>
                </h4>

                <div className={styles.modalCustomerGrid}>
                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Cliente</span>
                    <span className={styles.customerBoxContent}>{selectedOrder.customer_name}</span>
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>WhatsApp / Contato</span>
                    {selectedOrder.customer_phone ? (
                      <a
                        href={formatWhatsAppUrl(selectedOrder.customer_phone, 'Olá!')}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.customerBoxContent}
                        style={{ color: '#128C7E', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <MessageCircle size={15} />
                        <span>{selectedOrder.customer_phone}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className={styles.customerBoxContent}>Não informado</span>
                    )}
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Forma de Entrega</span>
                    <span className={styles.customerBoxContent}>
                      {formatDeliveryLabel(selectedOrder.delivery_method)}
                    </span>
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Valor Total do Pedido</span>
                    <span className={styles.customerBoxContent} style={{ color: '#2E7D32', fontSize: '1.15rem' }}>
                      R$ {Number(selectedOrder.total_amount).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Endereço de Entrega Completo */}
                {selectedOrder.delivery_address && (
                  <div className={styles.customerDetailBox} style={{ marginTop: '0.75rem' }}>
                    <span className={styles.customerBoxLabel}>Endereço Completo de Envio</span>
                    <span className={styles.customerBoxContent}>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Modal com Botões de Ação Rápida */}
            <div className={styles.orderModalFooter}>
              <div className={styles.modalWhatsAppActions}>
                {/* Botão Principal: Avisar que está pronto */}
                <button
                  type="button"
                  onClick={() => handleWhatsAppReady(selectedOrder)}
                  className={styles.btnWhatsAppReady}
                  title="Abrir WhatsApp com mensagem pré-formatada de pedido pronto"
                >
                  <MessageCircle size={16} />
                  <span>Avisar que está pronto</span>
                </button>

                {/* Conversar no WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleWhatsAppContact(selectedOrder)}
                  className={styles.btnWhatsAppOutline}
                  title="Conversar com o cliente no WhatsApp"
                >
                  <MessageCircle size={15} />
                  <span>💬 Falar no WhatsApp</span>
                </button>

                {/* Botão Cancelar / Remover Pedido */}
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.customer_name)}
                  className={styles.btnDeleteModal}
                  title="Remover / Cancelar este pedido"
                >
                  <Trash2 size={14} />
                  <span>Remover Pedido</span>
                </button>
              </div>

              {/* Botão Imprimir Ficha de Produção */}
              <button
                type="button"
                onClick={() => window.print()}
                className={styles.btnPrintSheet}
                title="Imprimir ficha de produção deste pedido"
              >
                <Printer size={15} />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
