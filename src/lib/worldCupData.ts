// ============================================================
// worldCupData.ts
// Módulo de datos del Mundial 2026 usando openfootball (gratuito)
// Fuente: https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json
// ============================================================

export const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json';

// Mapeo de nombres en inglés (openfootball) a emojis de bandera
const FLAG_MAP: Record<string, string> = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Czech Republic': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia & Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'New Zealand': '🇳🇿',
  'Norway': '🇳🇴',
  'Senegal': '🇸🇳',
  'Colombia': '🇨🇴',
  'Argentina': '🇦🇷',
  'China PR': '🇨🇳',
  'Chile': '🇨🇱',
  'Honduras': '🇭🇳',
  'Morocco': '🇲🇦',
  'Germany': '🇩🇪',
  'Japan': '🇯🇵',
  'Saudi Arabia': '🇸🇦',
  'France': '🇫🇷',
  'Australia': '🇦🇺',
  'Paraguay': '🇵🇾',
  'Portugal': '🇵🇹',
  'Spain': '🇪🇸',
  'Uruguay': '🇺🇾',
  'Ukraine': '🇺🇦',
  'Netherlands': '🇳🇱',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Nigeria': '🇳🇬',
  'Belgium': '🇧🇪',
  'Croatia': '🇭🇷',
  'Egypt': '🇪🇬',
  'Ivory Coast': '🇨🇮',
  'Iran': '🇮🇷',
  'Ecuador': '🇪🇨',
  'Cameroon': '🇨🇲',
  'Tunisia': '🇹🇳',
  'Poland': '🇵🇱',
  'Serbia': '🇷🇸',
  'Costa Rica': '🇨🇷',
  'Algeria': '🇩🇿',
  'Mali': '🇲🇱',
  'Türkiye': '🇹🇷',
  'Turkey': '🇹🇷',
  'Venezuela': '🇻🇪',
  'Denmark': '🇩🇰',
  'Slovenia': '🇸🇮',
  'Austria': '🇦🇹',
  'Romania': '🇷🇴',
  'Indonesia': '🇮🇩',
  'Jamaica': '🇯🇲',
  'Peru': '🇵🇪',
  'Guatemala': '🇬🇹',
  'Italy': '🇮🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Panama': '🇵🇦',
  'Cuba': '🇨🇺',
  'Trinidad & Tobago': '🇹🇹',
  'Ghana': '🇬🇭',
  'Uzbekistan': '🇺🇿',
  'Slovakia': '🇸🇰',
  'Hungary': '🇭🇺',
  'Greece': '🇬🇷',
  'Israel': '🇮🇱',
  'Congo DR': '🇨🇩',
  'Zambia': '🇿🇲',
  'Angola': '🇦🇴',
  'Sudan': '🇸🇩',
  'Mozambique': '🇲🇿',
  'Kenya': '🇰🇪',
  'Tanzania': '🇹🇿',
  'Ethiopia': '🇪🇹',
  'Comoros': '🇰🇲',
  'Kuwait': '🇰🇼',
  'Iraq': '🇮🇶',
  'Thailand': '🇹🇭',
  'Philippines': '🇵🇭',
  'Bahrain': '🇧🇭',
  'Jordan': '🇯🇴',
  'India': '🇮🇳',
  'Bangladesh': '🇧🇩',
  'United Arab Emirates': '🇦🇪',
  'Oman': '🇴🇲',
  'Libya': '🇱🇾',
  'Mauritania': '🇲🇷',
};

const SPANISH_MAP: Record<string, string> = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Czech Republic': 'República Checa',
  'Canada': 'Canadá',
  'Bosnia & Herzegovina': 'Bosnia y Herzegovina',
  'Qatar': 'Qatar',
  'Switzerland': 'Suiza',
  'New Zealand': 'Nueva Zelanda',
  'Senegal': 'Senegal',
  'Colombia': 'Colombia',
  'Argentina': 'Argentina',
  'China PR': 'China',
  'Chile': 'Chile',
  'Honduras': 'Honduras',
  'Morocco': 'Marruecos',
  'Germany': 'Alemania',
  'Japan': 'Japón',
  'Saudi Arabia': 'Arabia Saudita',
  'France': 'Francia',
  'Australia': 'Australia',
  'Paraguay': 'Paraguay',
  'Portugal': 'Portugal',
  'Spain': 'España',
  'Uruguay': 'Uruguay',
  'Ukraine': 'Ucrania',
  'Netherlands': 'Países Bajos',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'England': 'Inglaterra',
  'Nigeria': 'Nigeria',
  'Belgium': 'Bélgica',
  'Croatia': 'Croacia',
  'Egypt': 'Egipto',
  'Ivory Coast': 'Costa de Marfil',
  'Iran': 'Irán',
  'Ecuador': 'Ecuador',
  'Cameroon': 'Camerún',
  'Tunisia': 'Túnez',
  'Poland': 'Polonia',
  'Serbia': 'Serbia',
  'Costa Rica': 'Costa Rica',
  'Algeria': 'Argelia',
  'Mali': 'Malí',
  'Türkiye': 'Turquía',
  'Turkey': 'Turquía',
  'Venezuela': 'Venezuela',
  'Denmark': 'Dinamarca',
  'Slovenia': 'Eslovenia',
  'Austria': 'Austria',
  'Romania': 'Rumanía',
  'Indonesia': 'Indonesia',
  'Jamaica': 'Jamaica',
  'Peru': 'Perú',
  'Guatemala': 'Guatemala',
  'Italy': 'Italia',
  'Scotland': 'Escocia',
  'Wales': 'Gales',
  'Panama': 'Panamá',
  'Cuba': 'Cuba',
  'Trinidad & Tobago': 'Trinidad y Tobago',
  'Ghana': 'Ghana',
  'Uzbekistan': 'Uzbekistán',
  'Slovakia': 'Eslovaquia',
  'Hungary': 'Hungría',
  'Greece': 'Grecia',
  'Israel': 'Israel',
  'Congo DR': 'Congo RD',
  'Zambia': 'Zambia',
  'Angola': 'Angola',
  'Sudan': 'Sudán',
  'Mozambique': 'Mozambique',
  'Kenya': 'Kenia',
  'Tanzania': 'Tanzania',
  'Ethiopia': 'Etiopía',
  'Comoros': 'Comoras',
  'Kuwait': 'Kuwait',
  'Iraq': 'Irak',
  'Thailand': 'Tailandia',
  'Philippines': 'Filipinas',
  'Bahrain': 'Baréin',
  'Jordan': 'Jordania',
  'India': 'India',
  'Bangladesh': 'Bangladesh',
  'United Arab Emirates': 'Emiratos Árabes Unidos',
  'Oman': 'Omán',
  'Libya': 'Libia',
  'Mauritania': 'Mauritania',
};

export function getFlag(teamName: string): string {
  return FLAG_MAP[teamName] ?? '🏳️';
}

export function getSpanishName(teamName: string): string {
  return SPANISH_MAP[teamName] ?? teamName;
}

export function isTeamDefined(teamName: string): boolean {
  return teamName in FLAG_MAP;
}

// Tipos
export interface OpenFootballGoal {
  name: string;
  minute: string;
  penalty?: boolean;
  owngoal?: boolean;
}

export interface OpenFootballMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  score?: { ft: [number, number]; ht?: [number, number] };
  goals1?: OpenFootballGoal[];
  goals2?: OpenFootballGoal[];
  group?: string;
  ground?: string;
}

export interface OpenFootballData {
  name: string;
  matches: OpenFootballMatch[];
}

// Tipos procesados
export interface ProcessedMatch {
  id: string;
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  date: string;
  scoreA: number | null;
  scoreB: number | null;
  scoreAHt: number | null;
  scoreBHt: number | null;
  status: 'scheduled' | 'live' | 'finished';
  minutes: number;
  group: string;
  round: string;
  ground: string;
  goals1?: OpenFootballGoal[];
  goals2?: OpenFootballGoal[];
}

export interface GroupTeamStats {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface GroupStandings {
  group: string;
  teams: GroupTeamStats[];
}

export interface MatchChange {
  matchId: string;
  type: 'went_live' | 'halftime' | 'goal' | 'finished' | 'score_changed';
  message: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
}

// Parses el time string de openfootball (ej: "13:00 UTC-6") a un ISO string con fecha
function parseMatchDateTime(date: string, time: string): string {
  try {
    // Extraer la hora y la zona (ej: "13:00 UTC-6" => 13, 00, -6)
    const timeMatch = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)?$/);
    if (!timeMatch) {
      return `${date}T00:00:00.000Z`;
    }

    let [, hh, mm, tz] = timeMatch;
    const offsetHours = tz ? parseInt(tz) : 0;
    const utcHours = parseInt(hh) - offsetHours;
    const utcDate = new Date(`${date}T00:00:00.000Z`);
    utcDate.setUTCHours(utcHours, parseInt(mm), 0, 0);
    return utcDate.toISOString();
  } catch {
    return `${date}T00:00:00.000Z`;
  }
}

function determineStatus(match: OpenFootballMatch): 'scheduled' | 'live' | 'finished' {
  if (match.score?.ft) return 'finished';

  const matchDate = new Date(parseMatchDateTime(match.date, match.time));
  const now = new Date();
  const diffMs = now.getTime() - matchDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Si no ha empezado aún
  if (diffMs < 0) return 'scheduled';

  // Ya pasó la hora de inicio pero no hay resultado final
  // Asumimos duración máxima de 3 horas (incluye alargue)
  if (diffMins > 0 && diffMins < 210 && !match.score?.ft) return 'live';

  return 'scheduled';
}

function calcMatchMinutes(match: OpenFootballMatch): number {
  if (match.score?.ft) return 0;
  const matchDate = new Date(parseMatchDateTime(match.date, match.time));
  const now = new Date();
  const diffMs = now.getTime() - matchDate.getTime();
  if (diffMs < 0) return 0;
  const elapsed = Math.floor(diffMs / 60000);
  if (elapsed > 210) return 0;

  // Restar 15 min del entretiempo para mostrar tiempo real de juego
  if (elapsed <= 45) {
    // Primer tiempo
    return elapsed;
  } else if (elapsed <= 60) {
    // Entretiempo: congelar en 45'
    return 45;
  } else {
    // Segundo tiempo: restar los 15 min de entretiempo
    const adjusted = elapsed - 15;
    // Cap a 99' (tiempo regular + añadido máximo estimado)
    return Math.min(adjusted, 99);
  }
}

export function processMatches(rawMatches: OpenFootballMatch[]): ProcessedMatch[] {
  return rawMatches.map((m) => {
    const dateISO = parseMatchDateTime(m.date, m.time);
    const status = determineStatus(m);
    const minutes = calcMatchMinutes(m);
    const id = `wc2026_${m.team1.replace(/\s+/g, '_')}_${m.team2.replace(/\s+/g, '_')}_${m.date}`;

    return {
      id,
      teamA: m.team1,
      teamB: m.team2,
      teamAFlag: getFlag(m.team1),
      teamBFlag: getFlag(m.team2),
      date: dateISO,
      scoreA: m.score?.ft ? m.score.ft[0] : null,
      scoreB: m.score?.ft ? m.score.ft[1] : null,
      scoreAHt: m.score?.ht ? m.score.ht[0] : null,
      scoreBHt: m.score?.ht ? m.score.ht[1] : null,
      status,
      minutes,
      group: m.group ?? 'Knockout',
      round: m.round,
      ground: m.ground ?? '',
      goals1: m.goals1,
      goals2: m.goals2,
    };
  });
}

export function detectMatchChanges(prev: ProcessedMatch[], current: ProcessedMatch[]): MatchChange[] {
  const changes: MatchChange[] = [];
  const prevMap = new Map(prev.map(m => [m.id, m]));

  for (const cur of current) {
    const prev = prevMap.get(cur.id);
    if (!prev) continue;

    if (prev.status !== 'finished' && cur.status === 'finished') {
      changes.push({
        matchId: cur.id,
        type: 'finished',
        message: `⚽ Finalizado: ${cur.teamA} ${cur.scoreA}-${cur.scoreB} ${cur.teamB}`,
        teamA: cur.teamA, teamB: cur.teamB, scoreA: cur.scoreA, scoreB: cur.scoreB,
      });
      continue;
    }

    if (prev.status !== 'live' && cur.status === 'live') {
      changes.push({
        matchId: cur.id,
        type: 'went_live',
        message: `🔴 En vivo: ${cur.teamA} vs ${cur.teamB}`,
        teamA: cur.teamA, teamB: cur.teamB, scoreA: cur.scoreA, scoreB: cur.scoreB,
      });
    }

    if (cur.status === 'live' && cur.scoreAHt != null && prev.scoreAHt == null) {
      changes.push({
        matchId: cur.id,
        type: 'halftime',
        message: `⏸️ Descanso: ${cur.teamA} ${cur.scoreAHt ?? cur.scoreA ?? 0}-${cur.scoreBHt ?? cur.scoreB ?? 0} ${cur.teamB}`,
        teamA: cur.teamA, teamB: cur.teamB, scoreA: cur.scoreA, scoreB: cur.scoreB,
      });
    }

    if (cur.status === 'live' && prev.scoreA !== null && cur.scoreA !== null && cur.scoreB !== null && prev.scoreB !== null &&
        (cur.scoreA > prev.scoreA || cur.scoreB > prev.scoreB)) {
      const scorer = cur.scoreA > prev.scoreA ? cur.teamA : cur.teamB;
      const lastGoal = (scorer === cur.teamA ? cur.goals1 : cur.goals2)?.slice(-1)[0];
      const minuteStr = lastGoal?.minute ?? `${cur.minutes}'`;
      changes.push({
        matchId: cur.id,
        type: 'goal',
        message: `⚽ ¡GOL! ${getSpanishName(scorer)} (${minuteStr}) — ${cur.scoreA}-${cur.scoreB}`,
        teamA: cur.teamA, teamB: cur.teamB, scoreA: cur.scoreA, scoreB: cur.scoreB,
      });
    }
  }

  return changes;
}

// Calcular las tablas de grupos desde los partidos procesados
export function calculateGroupStandings(matches: ProcessedMatch[]): GroupStandings[] {
  const groupsMap: Record<string, Record<string, GroupTeamStats>> = {};

  for (const match of matches) {
    if (!match.group.startsWith('Group')) continue; // Solo fase de grupos
    const g = match.group;

    if (!groupsMap[g]) groupsMap[g] = {};

    // Inicializar equipos si no existen
    if (!groupsMap[g][match.teamA]) {
      groupsMap[g][match.teamA] = { team: match.teamA, flag: match.teamAFlag, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
    }
    if (!groupsMap[g][match.teamB]) {
      groupsMap[g][match.teamB] = { team: match.teamB, flag: match.teamBFlag, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
    }

    // Solo calcular si el partido ha finalizado
    if (match.status !== 'finished' || match.scoreA === null || match.scoreB === null) continue;

    const teamA = groupsMap[g][match.teamA];
    const teamB = groupsMap[g][match.teamB];

    teamA.played++;
    teamB.played++;
    teamA.goalsFor += match.scoreA;
    teamA.goalsAgainst += match.scoreB;
    teamB.goalsFor += match.scoreB;
    teamB.goalsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      teamA.won++; teamA.points += 3;
      teamB.lost++;
    } else if (match.scoreA < match.scoreB) {
      teamB.won++; teamB.points += 3;
      teamA.lost++;
    } else {
      teamA.drawn++; teamA.points++;
      teamB.drawn++; teamB.points++;
    }

    teamA.goalDiff = teamA.goalsFor - teamA.goalsAgainst;
    teamB.goalDiff = teamB.goalsFor - teamB.goalsAgainst;
  }

  // Convertir a array y ordenar
  return Object.entries(groupsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teamsObj]) => ({
      group,
      teams: Object.values(teamsObj).sort((a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.team.localeCompare(b.team)
      ),
    }));
}

// Fetch de los datos crudos del mundial desde openfootball
export async function fetchWorldCupData(): Promise<OpenFootballData | null> {
  try {
    const response = await fetch(OPENFOOTBALL_URL, {
      next: { revalidate: 300 }, // Cache de 5 minutos en Next.js
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json() as OpenFootballData;
  } catch (error) {
    console.error('Error fetching World Cup data from openfootball:', error);
    return null;
  }
}
