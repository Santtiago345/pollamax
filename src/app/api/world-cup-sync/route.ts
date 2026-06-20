import { NextResponse } from 'next/server';
import { collection, doc, writeBatch, getDocs, query, where, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchWorldCupData, processMatches, calculateGroupStandings } from '@/lib/worldCupData';
import { calculatePoints } from '@/lib/rules';
import { adminDb } from '@/lib/firebaseAdmin';

const batch = adminDb.batch();

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

          for (const betDoc of betsSnapshot.docs) {
            const bet = betDoc.data();
            const pointsEarned = calculatePoints(bet.predA, bet.predB, match.scoreA!, match.scoreB!);
            // Determinar tipo de acierto para rachas
            const isExact = bet.predA === match.scoreA && bet.predB === match.scoreB;
            const predDiff = Math.sign(bet.predA - bet.predB);
            const actualDiff = Math.sign(match.scoreA! - match.scoreB!);
            const isWinner = predDiff === actualDiff && predDiff !== 0 && !isExact;

            // Leer estado actual de racha del usuario
            const userRef = doc(db, 'users', bet.userId);
            const userSnap = await getDoc(userRef);
            const userData: any = userSnap.exists() ? userSnap.data() : {};
            const prevStreak = userData.streak || { type: null, count: 0 };

            let extraPoints = 0;
            let newStreak: any = { type: null, count: 0, lastMatchId: null };

            if (isExact) {
              const newCount = prevStreak.type === 'exact' ? (prevStreak.count || 0) + 1 : 1;
              if (newCount === 3) extraPoints = 1;
              else if (newCount >= 4) extraPoints = 2;
              newStreak = { type: 'exact', count: newCount, lastMatchId: match.id };
            } else if (isWinner) {
              const newCount = prevStreak.type === 'winner' ? (prevStreak.count || 0) + 1 : 1;
              if (newCount === 3) extraPoints = 3;
              else if (newCount >= 4) extraPoints = 1;
              newStreak = { type: 'winner', count: newCount, lastMatchId: match.id };
            } else {
              // Falló o no acertó: pierde la racha
              newStreak = { type: null, count: 0, lastMatchId: null };
            }

            const totalPoints = pointsEarned + extraPoints;

            pointsBatch.update(betDoc.ref, { pointsEarned: totalPoints, processed: true });
            pointsBatch.update(userRef, { points: increment(totalPoints), streak: newStreak });

            const historyRef = doc(collection(db, 'history'));
            pointsBatch.set(historyRef, {
              userId: bet.userId,
              userName: bet.userName,
              message: `⚽ ${match.teamA} ${match.scoreA}-${match.scoreB} ${match.teamB} finalizado. ${bet.userName} ganó +${totalPoints} pts (pronosticó ${bet.predA}-${bet.predB}).${extraPoints > 0 ? ` +${extraPoints} pts por racha (${newStreak.type} x${newStreak.count})` : ''}`,
              timestamp: new Date().toISOString(),
            });
            pointsAwarded++;
          }

          // Resetear rachas de usuarios que no participaron en este partido
          const bettors = new Set(betsSnapshot.docs.map((d) => d.data().userId));
          const usersSnap = await getDocs(collection(db, 'users'));
          usersSnap.forEach((uDoc) => {
            if (!bettors.has(uDoc.id)) {
              const uRef = doc(db, 'users', uDoc.id);
              pointsBatch.update(uRef, { streak: { type: null, count: 0, lastMatchId: null } });
            }
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
