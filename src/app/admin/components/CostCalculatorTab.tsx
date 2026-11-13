'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  TrendingUp, 
  Clock, 
  Layers, 
  DollarSign, 
  Package, 
  Gift, 
  Percent, 
  ArrowRight,
  Info
} from 'lucide-react';
import styles from './CostCalculatorTab.module.css';

interface PresetItem {
  name: string;
  paper: number;
  ribbon: number;
  treat: number;
  packaging: number;
  extras: number;
  minutes: number;
  margin: number;
}

const PRESET_TEMPLATES: PresetItem[] = [
  {
    name: 'Mini Lata Natalina',
    paper: 1.50,
    ribbon: 0.90,
    treat: 2.20,
    packaging: 0.60,
    extras: 0.30,
    minutes: 12,
    margin: 60,
  },
  {
    name: 'Porta-Sabonete Luxo',
    paper: 1.20,
    ribbon: 0.80,
    treat: 2.50,
    packaging: 0.60,
    extras: 0.40,
    minutes: 10,
    margin: 50,
  },
  {
    name: 'Caderno c/ Elástico',
    paper: 8.50,
    ribbon: 1.20,
    treat: 0,
    packaging: 1.50,
    extras: 0.80,
    minutes: 25,
    margin: 70,
  },
  {
    name: 'Caixa Milk 3D',
    paper: 2.10,
    ribbon: 1.40,
    treat: 1.50,
    packaging: 0.50,
    extras: 0.50,
    minutes: 15,
    margin: 60,
  },
  {
    name: 'Estojo Professores',
    paper: 12.00,
    ribbon: 2.00,
    treat: 4.50,
    packaging: 2.00,
    extras: 1.50,
    minutes: 35,
    margin: 65,
  },
];

interface CostCalculatorTabProps {
  onApplyPrice?: (price: string) => void;
}

export default function CostCalculatorTab({ onApplyPrice }: CostCalculatorTabProps) {
  // Materiais (por unidade)
  const [paperCost, setPaperCost] = useState<number | ''>(1.80);
  const [ribbonCost, setRibbonCost] = useState<number | ''>(0.90);
  const [treatCost, setTreatCost] = useState<number | ''>(2.00);
  const [packagingCost, setPackagingCost] = useState<number | ''>(0.70);
  const [extrasCost, setExtrasCost] = useState<number | ''>(0.40);

  // Mão de Obra
  const [productionMinutes, setProductionMinutes] = useState<number | ''>(15);
  const [hourlyRate, setHourlyRate] = useState<number | ''>(25.00);

  // Custos Indiretos (Energia, lâminas de corte, perdas)
  const [indirectPercent, setIndirectPercent] = useState<number>(5);

  // Margem de Lucro Desejada
  const [profitMargin, setProfitMargin] = useState<number>(60);

  // Preço customizado / arredondado
  const [customOverridePrice, setCustomOverridePrice] = useState<number | null>(null);

  // Feedback de cópia
  const [copied, setCopied] = useState(false);

  // Cálculos dinâmicos
  const calculations = useMemo(() => {
    const paper = Number(paperCost) || 0;
    const ribbon = Number(ribbonCost) || 0;
    const treat = Number(treatCost) || 0;
    const packaging = Number(packagingCost) || 0;
    const extras = Number(extrasCost) || 0;

    const materialsTotal = paper + ribbon + treat + packaging + extras;

    const minutes = Number(productionMinutes) || 0;
    const rate = Number(hourlyRate) || 0;
    const laborCost = (minutes / 60) * rate;

    const directCost = materialsTotal + laborCost;
    const indirectCost = directCost * (indirectPercent / 100);
    const totalUnitCost = directCost + indirectCost;

    // Preço sugerido com margem
    const rawSuggestedPrice = totalUnitCost * (1 + profitMargin / 100);

    // Arredondamentos comerciais comuns (ex: 14.90 ou 15.00)
    const roundedPoint90 = Math.max(0.9, Math.ceil(rawSuggestedPrice) - 0.10);
    const roundedPoint00 = Math.max(1, Math.ceil(rawSuggestedPrice));

    const finalPrice = customOverridePrice !== null ? customOverridePrice : rawSuggestedPrice;
    const netProfit = finalPrice - totalUnitCost;
    const effectiveMarginPercent = totalUnitCost > 0 ? (netProfit / totalUnitCost) * 100 : 0;

    return {
      materialsTotal,
      laborCost,
      indirectCost,
      totalUnitCost,
      rawSuggestedPrice,
      roundedPoint90,
      roundedPoint00,
      finalPrice,
      netProfit,
      effectiveMarginPercent,
    };
  }, [
    paperCost,
    ribbonCost,
    treatCost,
    packagingCost,
    extrasCost,
    productionMinutes,
    hourlyRate,
    indirectPercent,
    profitMargin,
    customOverridePrice,
  ]);

  // Aplicar modelo pré-configurado
  const handleApplyPreset = (preset: PresetItem) => {
    setPaperCost(preset.paper);
    setRibbonCost(preset.ribbon);
    setTreatCost(preset.treat);
    setPackagingCost(preset.packaging);
    setExtrasCost(preset.extras);
    setProductionMinutes(preset.minutes);
    setProfitMargin(preset.margin);
    setCustomOverridePrice(null);
  };

  // Resetar valores
  const handleReset = () => {
    setPaperCost('');
    setRibbonCost('');
    setTreatCost('');
    setPackagingCost('');
    setExtrasCost('');
    setProductionMinutes(15);
    setHourlyRate(25.00);
    setIndirectPercent(5);
    setProfitMargin(60);
    setCustomOverridePrice(null);
  };

  // Copiar preço
  const handleCopyPrice = (priceVal: number) => {
    navigator.clipboard.writeText(priceVal.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulação de lotes (1, 10, 20, 50, 100 unidades)
  const batchSimulation = useMemo(() => {
    const quantities = [1, 10, 25, 50, 100];
    return quantities.map((qty) => {
      const totalRevenue = calculations.finalPrice * qty;
      const totalCost = calculations.totalUnitCost * qty;
      const totalProfit = calculations.netProfit * qty;
      return { qty, totalRevenue, totalCost, totalProfit };
    });
  }, [calculations]);

  return (
    <div className={styles.calculatorContainer}>
      {/* Cabeçalho */}
      <div className={styles.headerRow}>
        <div className={styles.headingWrapper}>
          <h2 className={styles.heading}>
            <span className={styles.headingIcon}>
              <Calculator size={20} />
            </span>
            Calculadora de Custos & Preço Sugerido
          </h2>
          <p className={styles.subheading}>
            Calcule o custo exato de papéis, laços, doces e mão de obra para encontrar o preço de venda perfeito com lucro garantido.
          </p>
        </div>

        <button type="button" onClick={handleReset} className={styles.resetBtn}>
          <RotateCcw size={14} />
          <span>Limpar Campos</span>
        </button>
      </div>

      {/* Modelos Prontos de Precificação */}
      <div className={styles.presetTemplatesBar}>
        <span className={styles.presetLabel}> Modelos Sugeridos:
        </span>
        <div className={styles.presetButtons}>
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl)}
              className={styles.templatePill}
              title="Preencher com valores médios deste produto"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal */}
      <div className={styles.mainLayout}>
        {/* Coluna da Esquerda: Insumos e Mão de Obra */}
        <div className={styles.inputsColumn}>
          {/* Card 1: Materiais e Insumos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Package size={16} color="#6D4C3D" />
                <span>1. Materiais & Insumos (por unidade)</span>
              </div>
              <span className={styles.cardHeaderTotal}>
                Subtotal: R$ {calculations.materialsTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.materialGrid}>
                {/* Papel / Acrílico / Base */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Papelaria / Acrílico / Lata</span>
                    <span className={styles.fieldHint}>Folhas, bases</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      placeholder="0.00"
                      value={paperCost}
                      onChange={(e) => {
                        setPaperCost(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                {/* Fitas, Laços e Aviamentos */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Fitas, Laços & Aviamentos</span>
                    <span className={styles.fieldHint}>Cetim, pompom</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      placeholder="0.00"
                      value={ribbonCost}
                      onChange={(e) => {
                        setRibbonCost(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                {/* Doces / Chocolates / Sabonetes */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Doces / Sabonetes (Recheio)</span>
                    <span className={styles.fieldHint}>Se houver no mimo</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      placeholder="0.00"
                      value={treatCost}
                      onChange={(e) => {
                        setTreatCost(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                {/* Embalagem e Tags */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Embalagem & Tag</span>
                    <span className={styles.fieldHint}>Saquinho, fita adesiva</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      placeholder="0.00"
                      value={packagingCost}
                      onChange={(e) => {
                        setPackagingCost(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>
                </div>
              </div>

              {/* Outros Insumos (Cola quente, fita banana) */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <span>Outros Insumos e Detalhes</span>
                  <span className={styles.fieldHint}>Cola quente, fita banana, ilhós, vinil</span>
                </label>
                <div className={styles.inputPrefixWrap}>
                  <span className={styles.prefix}>R$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="0.00"
                    value={extrasCost}
                    onChange={(e) => {
                      setExtrasCost(e.target.value ? Number(e.target.value) : '');
                      setCustomOverridePrice(null);
                    }}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Mão de Obra & Tempo de Trabalho */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <Clock size={16} color="#6D4C3D" />
                <span>2. Mão de Obra & Tempo de Confecção</span>
              </div>
              <span className={styles.cardHeaderTotal}>
                Custo do Tempo: R$ {calculations.laborCost.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.laborRow}>
                {/* Tempo por unidade */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Tempo Gasto por Peça</span>
                    <span className={styles.fieldHint}>(em minutos)</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>Min</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="15"
                      value={productionMinutes}
                      onChange={(e) => {
                        setProductionMinutes(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.timePresetsRow}>
                    <button
                      type="button"
                      onClick={() => setProductionMinutes(5)}
                      className={`${styles.timePresetBtn} ${productionMinutes === 5 ? styles.timePresetBtnActive : ''}`}
                    >
                      5m
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductionMinutes(10)}
                      className={`${styles.timePresetBtn} ${productionMinutes === 10 ? styles.timePresetBtnActive : ''}`}
                    >
                      10m
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductionMinutes(15)}
                      className={`${styles.timePresetBtn} ${productionMinutes === 15 ? styles.timePresetBtnActive : ''}`}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductionMinutes(20)}
                      className={`${styles.timePresetBtn} ${productionMinutes === 20 ? styles.timePresetBtnActive : ''}`}
                    >
                      20m
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductionMinutes(30)}
                      className={`${styles.timePresetBtn} ${productionMinutes === 30 ? styles.timePresetBtnActive : ''}`}
                    >
                      30m
                    </button>
                  </div>
                </div>

                {/* Valor da Hora de Trabalho */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Valor da Sua Hora</span>
                    <span className={styles.fieldHint}>Salário desejado / horas</span>
                  </label>
                  <div className={styles.inputPrefixWrap}>
                    <span className={styles.prefix}>R$/h</span>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      placeholder="25.00"
                      value={hourlyRate}
                      onChange={(e) => {
                        setHourlyRate(e.target.value ? Number(e.target.value) : '');
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                    />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', marginTop: 4 }}>
                    Dica: R$ 25/h equivale a ~R$ 3.000/mês trabalhando 6 horas/dia.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Margem de Lucro Desejada */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <TrendingUp size={16} color="#6D4C3D" />
                <span>3. Margem de Lucro Desejada</span>
              </div>
              <span className={styles.cardHeaderTotal} style={{ color: '#047857' }}>
                +{profitMargin}% de Lucro
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.marginSelectorRow}>
                {[30, 50, 60, 75, 100, 150].map((marginVal) => (
                  <button
                    key={marginVal}
                    type="button"
                    onClick={() => {
                      setProfitMargin(marginVal);
                      setCustomOverridePrice(null);
                    }}
                    className={`${styles.marginOptionBtn} ${profitMargin === marginVal ? styles.marginOptionBtnActive : ''}`}
                  >
                    {marginVal}%
                  </button>
                ))}
              </div>

              {/* Custos Indiretos (Energia / Lâminas de corte) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #F0E8DE' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4A3B32' }}>
                    Custos Fixos / Perdas / Energia
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                    Desgaste de lâmina da plotter, cola, tinta e luz
                  </span>
                </div>

                <div style={{ width: '6rem' }}>
                  <div className={styles.inputPrefixWrap}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="20"
                      value={indirectPercent}
                      onChange={(e) => {
                        setIndirectPercent(Number(e.target.value) || 0);
                        setCustomOverridePrice(null);
                      }}
                      className={styles.textInput}
                      style={{ textAlign: 'right', paddingRight: '0.25rem' }}
                    />
                    <span className={styles.prefix} style={{ borderRight: 'none', borderLeft: '1px solid #DACFBF' }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Preço Sugerido & Simulador */}
        <div className={styles.resultsColumn}>
          {/* Card Principal de Preço Sugerido */}
          <div className={styles.priceCard}>
            <div className={styles.priceCardHeader}>
              <span className={styles.priceCardTag}>
                <Sparkles size={12} /> Preço Sugerido
              </span>

              <button
                type="button"
                onClick={() => handleCopyPrice(calculations.finalPrice)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                title="Copiar preço"
              >
                {copied ? <Check size={14} color="#6EE7B7" /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className={styles.suggestedPriceBox}>
              <span className={styles.suggestedPriceLabel}>Preço de Venda por Unidade</span>
              <div className={styles.suggestedPriceValue}>
                R$ {calculations.finalPrice.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className={styles.profitSummaryBadge}>
              <span>Lucro Líquido por Peça:</span>
              <strong>+ R$ {calculations.netProfit.toFixed(2).replace('.', ',')}</strong>
            </div>

            {/* Arredondamento Rápido */}
            <div className={styles.roundingBox}>
              <span className={styles.roundingLabel}>Arredondamento Comercial (Psicológico):</span>
              <div className={styles.roundingButtonsRow}>
                <button
                  type="button"
                  onClick={() => setCustomOverridePrice(calculations.roundedPoint90)}
                  className={styles.roundingBtn}
                  title="Final .90 atrai mais clientes"
                >
                  R$ {calculations.roundedPoint90.toFixed(2).replace('.', ',')}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomOverridePrice(calculations.roundedPoint00)}
                  className={styles.roundingBtn}
                  title="Valor cheio redondo"
                >
                  R$ {calculations.roundedPoint00.toFixed(2).replace('.', ',')}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomOverridePrice(null)}
                  className={styles.roundingBtn}
                  title="Preço exato calculado com markup"
                >
                  Exato
                </button>
              </div>
            </div>

            {/* Botão de Aplicar ao Produto se for modal */}
            {onApplyPrice && (
              <button
                type="button"
                onClick={() => onApplyPrice(calculations.finalPrice.toFixed(2))}
                style={{ backgroundColor: '#ffffff', color: '#6D4C3D', border: 'none', padding: '0.75rem', borderRadius: '0.625rem', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <Check size={18} />
                <span>Aplicar no Cadastro do Produto</span>
              </button>
            )}
          </div>

          {/* Card Detalhamento de Custos */}
          <div className={styles.breakdownCard}>
            <span className={styles.breakdownTitle}>Detalhamento de Custos (CPV)</span>

            <div className={styles.breakdownList}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownItemLabel}>
                  <Package size={13} /> Materiais & Insumos:
                </span>
                <span className={styles.breakdownItemValue}>
                  R$ {calculations.materialsTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className={styles.breakdownItem}>
                <span className={styles.breakdownItemLabel}>
                  <Clock size={13} /> Mão de Obra ({productionMinutes}min):
                </span>
                <span className={styles.breakdownItemValue}>
                  R$ {calculations.laborCost.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className={styles.breakdownItem}>
                <span className={styles.breakdownItemLabel}>
                  <Layers size={13} /> Custos Fixos ({indirectPercent}%):
                </span>
                <span className={styles.breakdownItemValue}>
                  R$ {calculations.indirectCost.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className={styles.breakdownTotalItem}>
                <span style={{ fontWeight: 700, color: '#4A3B32' }}>Custo Total de Produção:</span>
                <span style={{ fontWeight: 800, color: '#6D4C3D', fontSize: '0.9375rem' }}>
                  R$ {calculations.totalUnitCost.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Card Simulador de Encomendas em Lote */}
          <div className={styles.simulatorCard}>
            <span className={styles.breakdownTitle}>Simulação de Encomendas (Kits)</span>

            <table className={styles.simulatorTable}>
              <thead>
                <tr>
                  <th>Qtd</th>
                  <th>Total Venda</th>
                  <th>Custo</th>
                  <th>Seu Lucro</th>
                </tr>
              </thead>
              <tbody>
                {batchSimulation.map((row) => (
                  <tr key={row.qty}>
                    <td><strong>{row.qty}x</strong></td>
                    <td>R$ {row.totalRevenue.toFixed(2).replace('.', ',')}</td>
                    <td style={{ color: '#8C7A6B' }}>R$ {row.totalCost.toFixed(2).replace('.', ',')}</td>
                    <td className={styles.simProfitText}>+ R$ {row.totalProfit.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
