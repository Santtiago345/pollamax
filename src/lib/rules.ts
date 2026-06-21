/**
 * Calcula los puntos ganados por un usuario basados en su predicción y el resultado real de un partido.
 * 
 * Reglas de puntuación:
 * - Ganador correcto -> 5 puntos base.
 * - Marcador exacto -> +2 puntos de bonus (adicional a los 5 del ganador).
 * - Empate correcto -> 3 puntos.
 * - Goles de un equipo -> 1 punto por cada equipo que coincida exactamente con la predicción (máximo 2).
 * - Diferencia de goles exacta -> 1 punto.
 * 
 * @param predA Goles predichos para el equipo A
 * @param predB Goles predichos para el equipo B
 * @param scoreA Goles reales anotados por el equipo A
 * @param scoreB Goles reales anotados por el equipo B
 */
export function calculatePoints(
  predA: number,
  predB: number,
  scoreA: number,
  scoreB: number
): number {
  let points = 0;

  const realWinner = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'draw';
  const predWinner = predA > predB ? 'A' : predA < predB ? 'B' : 'draw';

  // Ganador o empate correcto
  if (realWinner === predWinner) {
    if (realWinner === 'draw') {
      points += 3; // Empate correcto
    } else {
      points += 5; // Ganador correcto
    }
  }

  // Marcador exacto: bonus adicional
  if (predA === scoreA && predB === scoreB) {
    points += 2; // Bonus por exactitud
    return points; // No se acumula diferencia ni goles individuales
  }

  // Diferencia de goles exacta
  const realDiff = scoreA - scoreB;
  const predDiff = predA - predB;
  if (realDiff === predDiff) {
    points += 1;
  }

  // Goles de un equipo: 1 punto por cada equipo que coincida
  if (predA === scoreA) {
    points += 1;
  }
  if (predB === scoreB) {
    points += 1;
  }

  return points;
}

/**
 * Determina si una apuesta puede ser realizada o modificada basado en la fecha de inicio del partido.
 * Las apuestas se bloquean 5 minutos antes de la hora de inicio del partido.
 * 
 * @param matchDateStr ISO string o fecha del partido
 * @returns boolean indicando si la apuesta está bloqueada
 */
export function isBetLocked(matchDateStr: string): boolean {
  const matchDate = new Date(matchDateStr);
  const now = new Date();
  
  // Calcular diferencia en milisegundos
  const diffMs = matchDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  // Si la fecha es en el pasado o falta menos de 5 minutos, está bloqueada
  return diffMinutes < 5;
}
