'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Megaphone, 
  Clock, 
  MessageCircle, 
Save, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  Store,
  Calendar,
  Gift
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { DEFAULT_SETTINGS } from '@/types/storeSettings';
import styles from './StoreSettingsTab.module.css';

const BANNER_TEMPLATES = [
  { label: '🎄 Agenda de Natal', text: '🎄 Agenda de encomendas para o Natal aberta até 15/12!' },
  { label: '✨ Frete Grátis', text: '✨ Frete grátis para entregas em Paraisópolis e Pouso Alegre!' },
  { label: '🏖️ Recesso Fim de Ano', text: 'Recesso de fim de ano: pedidos a partir de 05/01.' },
  { label: '🌸 Dia das Mães', text: '🌸 Encomendas para o Dia das Mães abertas! Garanta a sua com antecedência.' },
  { label: '📚 Dia dos Professores', text: '📚 Lembrancinhas de Dia dos Professores com estoque limitado!' },
  { label: '🎀 Artesanal & Afetivo', text: '🎀 Papelaria afetiva e lembrancinhas 100% artesanais feitas com amor.' },
];

const COLOR_PRESETS = [
  { name: 'Marrom Clássico Wê', bg: '#6D4C3D', text: '#FFFFFF' },
  { name: 'Verde Natalino', bg: '#166534', text: '#FFFFFF' },
  { name: 'Dourado Elegante', bg: '#854D0E', text: '#FFFFFF' },
  { name: 'Vermelho Festivo', bg: '#991B1B', text: '#FFFFFF' },
  { name: 'Café Escuro', bg: '#2D231E', text: '#FAF7F2' },
];

export default function StoreSettingsTab() {
  const { settings, loading, updateSettings } = useStoreSettings();

  // Estados locais do formulário
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState('');
  const [bannerLink, setBannerLink] = useState('#catalogo');
  const [bannerBgColor, setBannerBgColor] = useState('#6D4C3D');
  const [bannerTextColor, setBannerTextColor] = useState('#FFFFFF');

  const [defaultLeadTimeDays, setDefaultLeadTimeDays] = useState(5);
  const [applyLeadTimeToAllProducts, setApplyLeadTimeToAllProducts] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [storeName, setStoreName] = useState('');
  const [artisanName, setArtisanName] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sincroniza com as configurações recebidas
  useEffect(() => {
    if (settings) {
      setBannerEnabled(settings.topBanner?.enabled ?? true);
      setBannerText(settings.topBanner?.text || DEFAULT_SETTINGS.topBanner.text || '');
      setBannerLink(settings.topBanner?.link || '#catalogo');
      setBannerBgColor(settings.topBanner?.bgColor || '#6D4C3D');
      setBannerTextColor(settings.topBanner?.textColor || '#FFFFFF');

      setDefaultLeadTimeDays(settings.defaultLeadTimeDays || 5);
      setWhatsappNumber(settings.whatsappNumber || '5535984026382');
      setInstagram(settings.instagram || 'welembrancinhas');
      setStoreName(settings.storeName || 'Wê Lembrancinhas');
      setArtisanName(settings.artisanName || 'Wenilze Fróes');
    }
  }, [settings]);

  // Salvar alterações
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
    const cleanInstagram = instagram.replace(/^@/, '').trim();

    const res = await updateSettings(
      {
        storeName: storeName.trim() || 'Wê Lembrancinhas',
        artisanName: artisanName.trim() || 'Wenilze Fróes',
        whatsappNumber: cleanWhatsapp,
        instagram: cleanInstagram,
        defaultLeadTimeDays: Number(defaultLeadTimeDays) || 5,
        topBanner: {
          enabled: bannerEnabled,
          text: bannerText.trim(),
          link: bannerLink.trim() || undefined,
          bgColor: bannerBgColor,
          textColor: bannerTextColor,
        },
      },
      applyLeadTimeToAllProducts
    );

    setSaving(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: applyLeadTimeToAllProducts
          ? 'Configurações salvas e prazo propagado para todos os produtos com sucesso!'
          : 'Configurações da loja salvas com sucesso!',
      });
      setApplyLeadTimeToAllProducts(false); // Reseta após aplicar
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Erro ao salvar configurações.',
      });
    }
  };

  // Atalhos de Prazo
  const setLeadTime = (days: number) => {
    setDefaultLeadTimeDays(days);
  };

  // Testar WhatsApp
  const handleTestWhatsapp = () => {
    const cleanNum = whatsappNumber.replace(/\D/g, '');
    const numWithDDI = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`;
    window.open(`https://wa.me/${numWithDDI}?text=Ol%C3%A1%21+Teste+de+configura%C3%A7%C3%A3o+da+W%C3%AA+Lembrancinhas.`, '_blank');
  };

  // Testar Instagram
  const handleTestInstagram = () => {
    const handle = instagram.replace(/^@/, '').trim();
    window.open(`https://instagram.com/${handle}`, '_blank');
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Cabeçalho */}
      <div className={styles.headerRow}>
        <div className={styles.headingWrapper}>
          <h2 className={styles.heading}>
            <span className={styles.headingIcon}>
              <Sliders size={20} />
            </span>
            Ajustes & Configurações da Loja
          </h2>
          <p className={styles.subheading}>
            Altere a faixa de aviso do topo, ajuste prazos de produção de pico e atualize contatos em tempo real sem mexer em código.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving || loading}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* CARD 1: Faixa de Aviso no Topo do Site */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <Megaphone size={18} className={styles.cardHeaderIcon} />
            <span>Faixa de Aviso no Topo do Site</span>
          </div>

          <label className={styles.switch} title="Ligar ou desligar a faixa do topo">
            <input
              type="checkbox"
              checked={bannerEnabled}
              onChange={(e) => setBannerEnabled(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.toggleRow}>
            <div className={styles.toggleLabelBlock}>
              <span className={styles.toggleTitle}>Exibir Faixa no Topo da Loja</span>
              <span className={styles.toggleDesc}>
                {bannerEnabled ? 'A faixa está visível para todos os visitantes do site.' : 'A faixa está oculta no site.'}
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: bannerEnabled ? '#10B981' : '#9E9084' }}>
              {bannerEnabled ? 'Ligada' : 'Desligada'}
            </span>
          </div>

          {/* Campo da Mensagem */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span>Mensagem da Faixa</span>
              <span className={styles.formHint}>{bannerText.length}/120 caracteres</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 🎄 Agenda de encomendas para o Natal aberta até 15/12!"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className={styles.formInput}
              maxLength={120}
            />
          </div>

          {/* Modelos Prontos de Mensagem */}
          <div className={styles.templatesGrid}>
            <label className={styles.formLabel}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} color="#D97706" /> Modelos Rápidos (Clique para aplicar):
              </span>
            </label>
            <div className={styles.templateButtons}>
              {BANNER_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBannerText(tmpl.text);
                    setBannerEnabled(true);
                  }}
                  className={styles.templateBtn}
                  title="Clique para preencher o texto da faixa"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cor e Estilo da Faixa */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span>Cor de Fundo da Faixa</span>
            </label>
            <div className={styles.colorPresets}>
              {COLOR_PRESETS.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBannerBgColor(color.bg);
                    setBannerTextColor(color.text);
                  }}
                  className={`${styles.colorBtn} ${bannerBgColor === color.bg ? styles.colorBtnSelected : ''}`}
                  style={{ backgroundColor: color.bg }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Prévia da Faixa em Tempo Real */}
          <div className={styles.previewBox}>
            <span className={styles.previewLabel}>Prévia em tempo real no site:</span>
            {bannerEnabled && bannerText.trim() ? (
              <div
                className={styles.previewBanner}
                style={{ backgroundColor: bannerBgColor, color: bannerTextColor }}
              >
                <span>{bannerText}</span>
              </div>
            ) : (
              <div
                className={styles.previewBanner}
                style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF', fontStyle: 'italic' }}
              >
                (Faixa desligada ou sem mensagem — não será exibida no site)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: Prazo de Produção Geral (Picos de Demanda) */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <Clock size={18} className={styles.cardHeaderIcon} />
            <span>Prazo de Produção Geral (Controle de Demanda)</span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.leadTimeBox}>
            <div className={styles.formLabel}>
              <span>Prazo Padrão de Confecção Artesanal</span>
              <span className={styles.formHint}>Dias úteis necessários após aprovação</span>
            </div>

            <div className={styles.leadTimeControlsRow}>
              {/* Stepper +/- */}
              <div className={styles.stepperWrapper}>
                <button
                  type="button"
                  onClick={() => setDefaultLeadTimeDays((prev) => Math.max(1, prev - 1))}
                  className={styles.stepperBtn}
                >
                  -
                </button>
                <div className={styles.stepperValue}>
                  {defaultLeadTimeDays}
                </div>
                <button
                  type="button"
                  onClick={() => setDefaultLeadTimeDays((prev) => prev + 1)}
                  className={styles.stepperBtn}
                >
                  +
                </button>
              </div>

              <span className={styles.leadTimeUnit}>
                {defaultLeadTimeDays === 1 ? 'dia útil' : 'dias úteis'} de confecção
              </span>
            </div>

            {/* Atalhos Rápidos de Épocas */}
            <div className={styles.leadTimePresets}>
              <button
                type="button"
                onClick={() => setLeadTime(5)}
                className={`${styles.presetBtn} ${defaultLeadTimeDays === 5 ? styles.presetBtnActive : ''}`}
              >
                5 dias (Padrão Normal)
              </button>
              <button
                type="button"
                onClick={() => setLeadTime(7)}
                className={`${styles.presetBtn} ${defaultLeadTimeDays === 7 ? styles.presetBtnActive : ''}`}
              >
                7 dias (Média Demanda)
              </button>
              <button
                type="button"
                onClick={() => setLeadTime(8)}
                className={`${styles.presetBtn} ${defaultLeadTimeDays === 8 ? styles.presetBtnActive : ''}`}
              >
                8 dias (Alta Demanda / Mães)
              </button>
              <button
                type="button"
                onClick={() => setLeadTime(10)}
                className={`${styles.presetBtn} ${defaultLeadTimeDays === 10 ? styles.presetBtnActive : ''}`}
              >
                10 dias (Pico de Natal)
              </button>
            </div>

            {/* Checkbox inteligente de aplicação em lote */}
            <label className={styles.checkboxNotice}>
              <input
                type="checkbox"
                checked={applyLeadTimeToAllProducts}
                onChange={(e) => setApplyLeadTimeToAllProducts(e.target.checked)}
              />
              <div className={styles.checkboxNoticeText}>
                <span className={styles.checkboxNoticeTitle}>
                  Aplicar esse novo prazo ({defaultLeadTimeDays} dias úteis) a todos os produtos do catálogo agora
                </span>
                <span className={styles.checkboxNoticeDesc}>
                  Excelente para datas como Natal ou Dia das Mães: com um só clique, todos os produtos existentes passam a exibir o novo prazo no catálogo e nos pedidos para evitar sobrecarga.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* CARD 3: Contatos & Redes Sociais */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <MessageCircle size={18} className={styles.cardHeaderIcon} />
            <span>Canais de Contato & Redes Sociais</span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.contactGrid}>
            {/* WhatsApp */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>WhatsApp Oficial da Loja</span>
                <span className={styles.formHint}>(Com DDD)</span>
              </label>
              <div className={styles.inputWithBtn}>
                <input
                  type="text"
                  placeholder="Ex: 35984026382"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className={styles.formInput}
                />
                <button
                  type="button"
                  onClick={handleTestWhatsapp}
                  className={styles.testBtn}
                  title="Testar link do WhatsApp"
                >
                  <ExternalLink size={13} />
                  <span>Testar</span>
                </button>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                Os pedidos do carrinho e o botão flutuante serão enviados diretamente para este número.
              </span>
            </div>

            {/* Instagram */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Instagram Oficial</span>
                <span className={styles.formHint}>(Usuário/Arroba)</span>
              </label>
              <div className={styles.inputWithBtn}>
                <input
                  type="text"
                  placeholder="Ex: welembrancinhas"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={styles.formInput}
                />
                <button
                  type="button"
                  onClick={handleTestInstagram}
                  className={styles.testBtn}
                  title="Testar link do Instagram"
                >
                  <ExternalLink size={13} />
                  <span>Testar</span>
                </button>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                Exibido no topo do site e no rodapé para os clientes acompanharem as novidades.
              </span>
            </div>
          </div>

          <div className={styles.contactGrid}>
            {/* Nome da Loja */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Nome da Loja</span>
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={styles.formInput}
              />
            </div>

            {/* Nome da Artesã */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Nome da Artesã / Responsável</span>
              </label>
              <input
                type="text"
                value={artisanName}
                onChange={(e) => setArtisanName(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Salvar Rodapé */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving || loading}
          className={styles.saveButton}
          style={{ width: '100%', maxWidth: '16rem', justifyContent: 'center', padding: '0.875rem 1.5rem', fontSize: '0.9375rem' }}
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
