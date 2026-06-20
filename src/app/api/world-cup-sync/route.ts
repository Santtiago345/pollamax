import { NextResponse } from 'next/server';
import { collection, doc, writeBatch, getDocs, query, where, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchWorldCupData, processMatches, calculateGroupStandings } from '@/lib/worldCupData';
import { calculatePoints } from '@/lib/rules';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Obtener datos del Mundial desde openfootball
    const rawData = await fetchWorldCupData();

    if (!rawData) {
      return NextResponse.json(
        { message: 'No se pudo obtener datos del Mundial desde openfootball.', status: 'error' },
        { status: 503 }
      );
    }

    const matches = processMatches(rawData.matches);
    const groups = calculateGroupStandings(matches);
    
    let upsertedMatches = 0;
    let pointsAwarded = 0;

    // 2. Upsert de partidos en Firestore (por lotes de 500 máximo)
    const BATCH_SIZE = 490;
    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = matches.slice(i, i + BATCH_SIZE);

      for (const match of chunk) {
        const matchRef = doc(db, 'matches', match.id);
        const existingSnap = await getDoc(matchRef);
        const existingData = existingSnap.exists() ? existingSnap.data() : null;

        // Detectar si un partido acaba de finalizar (transición scheduled/live → finished)
        const justFinished =
          match.status === 'finished' &&
          existingData &&
          existingData.status !== 'finished' &&
          match.scoreA !== null &&
          match.scoreB !== null;

        // Preparar el objeto para guardar
        batch.set(
          matchRef,
          {
            id: match.id,
            teamA: match.teamA,
            teamB: match.teamB,
            teamAFlag: match.teamAFlag,
            teamBFlag: match.teamBFlag,
            date: match.date,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            status: match.status,
            group: match.group,
            round: match.round,
            ground: match.ground,
          },
          { merge: true }
        );

        // Si el partido acaba de finalizar: calcular y repartir puntos de apuestas
        if (justFinished && match.scoreA !== null && match.scoreB !== null) {
          await batch.commit(); // Commit del lote actual antes del batch de puntos

          const pointsBatch = writeBatch(db);

          const betsQuery = query(
            collection(db, 'bets'),
            where('matchId', '==', match.id),
            where('processed', '==', false)
          );
          const betsSnapshot = await getDocs(betsQuery);

          betsSnapshot.forEach((betDoc) => {
            const bet = betDoc.data();
            const pointsEarned = calculatePoints(bet.predA, bet.predB, match.scoreA!, match.scoreB!);

            pointsBatch.update(betDoc.ref, { pointsEarned, processed: true });
            pointsBatch.update(doc(db, 'users', bet.userId), { points: increment(pointsEarned) });

            const historyRef = doc(collection(db, 'history'));
            pointsBatch.set(historyRef, {
              userId: bet.userId,
              userName: bet.userName,
              message: `⚽ ${match.teamA} ${match.scoreA}-${match.scoreB} ${match.teamB} finalizado. ${bet.userName} ganó +${pointsEarned} pts (pronosticó ${bet.predA}-${bet.predB}).`,
              timestamp: new Date().toISOString(),
            });
            pointsAwarded++;
          });

          if (!betsSnapshot.empty) {
            await pointsBatch.commit();
          }

          // Continuar con un nuevo batch
          const newBatch = writeBatch(db);
          upsertedMatches++;
          continue;
        }

        upsertedMatches++;
      }

      await batch.commit();
    }

    // 3. Guardar tablas de grupos en caché de Firestore
    const groupsBatch = writeBatch(db);
    const cacheRef = doc(db, 'worldCupCache', 'groups');
    groupsBatch.set(cacheRef, {
      groups,
      lastUpdated: new Date().toISOString(),
    });

    // 4. Guardar timestamp de última sincronización
    const syncRef = doc(db, 'worldCupCache', 'lastSync');
    groupsBatch.set(syncRef, {
      timestamp: new Date().toISOString(),
      matchesTotal: matches.length,
    });

    await groupsBatch.commit();

    return NextResponse.json({
      message: `Sincronización completada. ${upsertedMatches} partidos actualizados, ${pointsAwarded} apuestas con puntos evaluados.`,
      status: 'success',
      data: {
        matchesTotal: matches.length,
        groupsCalculated: groups.length,
        lastSync: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Error in world-cup-sync:', error);
    return NextResponse.json(
      { message: 'Error durante la sincronización del Mundial.', error: error.message, status: 'error' },
      { status: 500 }
    );
  }
}
