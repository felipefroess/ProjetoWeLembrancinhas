import { Category, Product } from '@/types';

/**
 * Definição de eventos comemorativos do calendário brasileiro para lembrancinhas
 */
export interface SeasonalEventDefinition {
  id: string;
  name: string;
  month: number; // 1 a 12
  day: number;   // 1 a 31
  graceDays?: number; // Dias após a data em que o evento ainda tem relevância
  keywords: string[]; // Palavras-chave para identificar categorias e produtos
}

/**
 * Cálculo da Páscoa (Algoritmo de Meeus/Butcher) válido para qualquer ano
 */
function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Dia das Mães no Brasil (2º domingo de maio)
 */
function getMothersDay(year: number): { month: number; day: number } {
  let count = 0;
  for (let day = 1; day <= 14; day++) {
    const d = new Date(year, 4, day);
    if (d.getDay() === 0) {
      count++;
      if (count === 2) return { month: 5, day };
    }
  }
  return { month: 5, day: 10 };
}

/**
 * Dia dos Pais no Brasil (2º domingo de agosto)
 */
function getFathersDay(year: number): { month: number; day: number } {
  let count = 0;
  for (let day = 1; day <= 14; day++) {
    const d = new Date(year, 7, day);
    if (d.getDay() === 0) {
      count++;
      if (count === 2) return { month: 8, day };
    }
  }
  return { month: 8, day: 10 };
}

/**
 * Retorna todos os eventos sazonais com as datas calculadas para o ano em questão
 */
export function getSeasonalEventsForYear(year: number): SeasonalEventDefinition[] {
  const easter = getEasterDate(year);
  const mothers = getMothersDay(year);
  const fathers = getFathersDay(year);

  return [
    {
      id: 'volta-as-aulas',
      name: 'Volta às Aulas / Cadernos',
      month: 2,
      day: 10,
      graceDays: 5,
      keywords: ['volta-as-aulas', 'volta as aulas', 'escolar', 'caderno', 'cadernos', 'planner', 'etiqueta']
    },
    {
      id: 'pascoa',
      name: 'Páscoa',
      month: easter.month,
      day: easter.day,
      graceDays: 2,
      keywords: ['pascoa', 'páscoa', 'coelho', 'chocolate']
    },
    {
      id: 'dia-das-maes',
      name: 'Dia das Mães',
      month: mothers.month,
      day: mothers.day,
      graceDays: 2,
      keywords: ['dia-das-maes', 'dia das maes', 'dia das mães', 'maes', 'mães', 'mae', 'mãe']
    },
    {
      id: 'dia-dos-namorados',
      name: 'Dia dos Namorados',
      month: 6,
      day: 12,
      graceDays: 2,
      keywords: ['dia-dos-namorados', 'dia dos namorados', 'namorado', 'namorada', 'namorados', 'romantico', 'romântico']
    },
    {
      id: 'dia-dos-pais',
      name: 'Dia dos Pais',
      month: fathers.month,
      day: fathers.day,
      graceDays: 2,
      keywords: ['dia-dos-pais', 'dia dos pais', 'pais', 'pai']
    },
    {
      id: 'dia-das-criancas',
      name: 'Dia das Crianças',
      month: 10,
      day: 12,
      graceDays: 2,
      keywords: ['dia-das-criancas', 'dia das criancas', 'dia das crianças', 'crianca', 'crianças', 'infantil']
    },
    {
      id: 'dia-dos-professores',
      name: 'Dia dos Professores',
      month: 10,
      day: 15,
      graceDays: 3,
      keywords: ['dia-dos-professores', 'dia dos professores', 'professor', 'professores', 'professora', 'prof']
    },
    {
      id: 'halloween',
      name: 'Halloween',
      month: 10,
      day: 31,
      graceDays: 1,
      keywords: ['halloween', 'dia das bruxas', 'bruxas']
    },
    {
      id: 'natal',
      name: 'Natal & Fim de Ano',
      month: 12,
      day: 25,
      graceDays: 4,
      keywords: ['natal', 'natalino', 'natalina', 'boas-festas', 'boas festas', 'ano-novo', 'reveillon', 'fim de ano']
    }
  ];
}

/**
 * Calcula a distância em dias até a próxima ocorrência do evento
 */
export function getDaysUntilEvent(event: SeasonalEventDefinition, refDate: Date): number {
  const currentYear = refDate.getFullYear();
  const eventDateThisYear = new Date(currentYear, event.month - 1, event.day, 23, 59, 59);
  const cutoffThisYear = new Date(eventDateThisYear.getTime() + (event.graceDays || 1) * 24 * 60 * 60 * 1000);

  if (refDate <= cutoffThisYear) {
    const diffMs = eventDateThisYear.getTime() - refDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } else {
    // Evento já passou este ano; calcula para o próximo ano
    const eventsNextYear = getSeasonalEventsForYear(currentYear + 1);
    const evNext = eventsNextYear.find(e => e.id === event.id) || event;
    const eventDateNextYear = new Date(currentYear + 1, evNext.month - 1, evNext.day, 23, 59, 59);
    const diffMs = eventDateNextYear.getTime() - refDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}

/**
 * Retorna uma pontuação de proximidade para uma categoria:
 * - 'todos': -1 (sempre no início)
 * - eventos sazonais: número de dias até o evento (menor = mais próximo = maior prioridade)
 * - categorias atemporais (maternidade, batizado, etc.): 150 dias de base
 */
export function getCategoryProximityScore(
  category: { id: string; name?: string },
  refDate: Date
): number {
  if (category.id === 'todos') {
    return -1;
  }

  const text = `${category.id} ${category.name || ''}`.toLowerCase();
  const events = getSeasonalEventsForYear(refDate.getFullYear());

  let minDays = Infinity;
  let matched = false;

  for (const ev of events) {
    if (ev.keywords.some((kw) => text.includes(kw))) {
      const days = getDaysUntilEvent(ev, refDate);
      if (days < minDays) {
        minDays = days;
        matched = true;
      }
    }
  }

  if (matched) {
    return minDays;
  }

  // Categorias atemporais (maternidade, batizado, casamento, aniversários)
  // Ficam logo após os eventos imediatos (~60-90 dias) e à frente de datas distantes (180+ dias)
  return 150;
}

/**
 * Ordena as categorias de forma inteligente pelo evento comemorativo mais próximo:
 * 1. 'Todos os Mimos' (sempre no topo)
 * 2. Evento sazonal mais próximo do momento (ex: Natal nos meses de out/nov/dez)
 * 3. Próximos eventos e categorias permanentes (cadernos, maternidade)
 * 4. Eventos que já passaram este ano
 */
export function sortCategoriesBySeasonalProximity(
  categories: Category[],
  refDate?: Date | null
): Category[] {
  if (!refDate) return categories;
  return [...categories].sort((a, b) => {
    const scoreA = getCategoryProximityScore(a, refDate);
    const scoreB = getCategoryProximityScore(b, refDate);
    return scoreA - scoreB;
  });
}

/**
 * Ordena a lista de produtos quando a visão geral "Todos os Mimos" está ativa:
 * - Produtos do evento mais próximo aparecem primeiro!
 * - Mantém produtos populares/destaque no topo de cada grupo.
 */
export function sortProductsBySeasonalProximity(
  products: Product[],
  categoryNameMap?: Map<string, string>,
  refDate?: Date | null
): Product[] {
  if (!refDate) return products;
  return [...products].sort((a, b) => {
    const catNameA = categoryNameMap?.get(a.category) || a.category;
    const catNameB = categoryNameMap?.get(b.category) || b.category;

    const scoreA = getCategoryProximityScore({ id: a.category, name: catNameA }, refDate);
    const scoreB = getCategoryProximityScore({ id: b.category, name: catNameB }, refDate);

    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    // Desempate dentro da mesma categoria: populares e destaques primeiro
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    return 0;
  });
}

/**
 * Retorna o evento sazonal que está ativo ou mais próximo no momento
 */
export function getTopUpcomingSeasonalEvent(refDate?: Date | null): {
  event: SeasonalEventDefinition;
  daysUntil: number;
} | null {
  if (!refDate) return null;
  const events = getSeasonalEventsForYear(refDate.getFullYear());
  let topEvent: SeasonalEventDefinition | null = null;
  let minDays = Infinity;

  for (const ev of events) {
    const days = getDaysUntilEvent(ev, refDate);
    if (days < minDays) {
      minDays = days;
      topEvent = ev;
    }
  }

  return topEvent ? { event: topEvent, daysUntil: minDays } : null;
}

/**
 * Retorna o ID do ÚNICO produto que deve receber o selo 'Mais Pedido':
 * - Obrigatoriamente da categoria do evento comemorativo mais próximo (ex: Natal agora).
 * - Seleciona apenas 1 produto principal dessa categoria para exclusividade e atratividade real.
 */
export function getSeasonalTopProductId(
  products: Product[],
  categoryNameMap?: Map<string, string>,
  refDate?: Date | null
): string | null {
  if (!products || products.length === 0 || !refDate) return null;

  const upcoming = getTopUpcomingSeasonalEvent(refDate);

  if (upcoming) {
    const seasonalProducts = products.filter((p) => {
      const catName = (categoryNameMap?.get(p.category) || p.category).toLowerCase();
      const pName = p.name.toLowerCase();
      return (
        upcoming.event.keywords.some((kw) => catName.includes(kw)) ||
        upcoming.event.keywords.some((kw) => pName.includes(kw))
      );
    });

    if (seasonalProducts.length > 0) {
      // Retorna o produto principal (destaque/popular ou 1º cadastrado do evento)
      const best = seasonalProducts.find((p) => p.featured) || seasonalProducts[0];
      return best.id;
    }
  }

  // Fallback: 1º produto destacado
  const fallback = products.find((p) => p.featured) || products[0];
  return fallback ? fallback.id : null;
}
