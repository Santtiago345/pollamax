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

export function getFlag(teamName: string): string {
  return FLAG_MAP[teamName] ?? '🏳️';
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
  date: string; // ISO string
  scoreA: number | null;
  scoreB: number | null;
  status: 'scheduled' | 'live' | 'finished';
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

// Determinar el estado del partido basado en la presencia del score y la fecha
function determineStatus(match: OpenFootballMatch): 'scheduled' | 'live' | 'finished' {
  if (match.score?.ft) return 'finished';
  
  const matchDate = new Date(parseMatchDateTime(match.date, match.time));
  const now = new Date();
  
  // Si la hora de inicio ya pasó pero no hay score, podría estar en vivo
  if (now > matchDate && !match.score) {
    const diffHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 3) return 'live'; // Asumimos que un partido dura máx 3 horas
  }
  
  return 'scheduled';
}

// Procesar el array de partidos del JSON crudo
export function processMatches(rawMatches: OpenFootballMatch[]): ProcessedMatch[] {
  return rawMatches.map((m, index) => {
    const dateISO = parseMatchDateTime(m.date, m.time);
    const status = determineStatus(m);
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
      status,
      group: m.group ?? 'Knockout',
      round: m.round,
      ground: m.ground ?? '',
      goals1: m.goals1,
      goals2: m.goals2,
    };
  });
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
