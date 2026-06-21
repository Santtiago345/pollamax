import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, writeBatch, doc, getDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculatePoints } from '@/lib/rules';

export const dynamic = 'force-dynamic';

// Lógica de Sincronización de Partidos
// Este endpoint es llamado por un cron o servicio de fondo para actualizar los marcadores en tiempo real.
// Si se cuenta con una API key de api-football o football-data.org se puede realizar el fetch aquí.
export async function GET(request: Request) {
  try {
    // Verificar API key si está configurada en producción
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY;
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { message: 'No autorizado.' },
        { status: 401 }
      );
    }

    const matchesRef = collection(db, 'matches');
    // Consultar todos los partidos activos (scheduled o live) para sincronizarlos
    const q = query(matchesRef, where('status', 'in', ['scheduled', 'live']));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'No matches to synchronize.' }, { status: 200 });
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    // SIMULACIÓN DE DATOS DE API: En producción se realizaría el fetch a la API de fútbol aquí.
    // Ejemplo: fetch('https://api.football-data.org/v4/competitions/WC/matches', { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY || '' } })
    
    for (const matchDoc of querySnapshot.docs) {
      const match = matchDoc.data();
      
      // Simularemos una actualización aleatoria de los partidos en vivo o que acaban de finalizar para pruebas.
      // Si el partido está "live" en la app y queremos actualizar goles de forma automatizada:
      if (match.status === 'live') {
        const currentScoreA = match.scoreA ?? 0;
        const currentScoreB = match.scoreB ?? 0;
        
        // Simular probabilidad de gol
        const rand = Math.random();
        let newScoreA = currentScoreA;
        let newScoreB = currentScoreB;
        let status = 'live';

        if (rand < 0.1) {
          newScoreA += 1;
        } else if (rand < 0.2) {
          newScoreB += 1;
        } else if (rand < 0.23) {
          // El partido finaliza
          status = 'finished';
        }

        if (newScoreA !== currentScoreA || newScoreB !== currentScoreB || status === 'finished') {
          // Si el partido finaliza, se calculan puntos y se actualiza a los usuarios
          if (status === 'finished') {
            // Repartir puntos
            const betsQuery = query(
              collection(db, 'bets'),
              where('matchId', '==', matchDoc.id),
              where('processed', '==', false)
            );
            const betsSnapshot = await getDocs(betsQuery);

            // Procesar apuestas y rachas
            for (const betDoc of betsSnapshot.docs) {
              const bet = betDoc.data();
              const pointsEarned = calculatePoints(bet.predA, bet.predB, newScoreA, newScoreB);

              const isExact = bet.predA === newScoreA && bet.predB === newScoreB;
              const predDiff = Math.sign(bet.predA - bet.predB);
              const actualDiff = Math.sign(newScoreA - newScoreB);
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
                if (newCount >= 2) extraPoints = newCount - 1;
                newStreak = { type: 'exact', count: newCount, lastMatchId: matchDoc.id };
              } else if (isWinner) {
                const newCount = prevStreak.type === 'winner' ? (prevStreak.count || 0) + 1 : 1;
                if (newCount === 3) extraPoints = 3;
                else if (newCount >= 4) extraPoints = 1;
                newStreak = { type: 'winner', count: newCount, lastMatchId: matchDoc.id };
              } else {
                newStreak = { type: null, count: 0, lastMatchId: null };
              }

              const totalPoints = pointsEarned + extraPoints;

              batch.update(betDoc.ref, {
                pointsEarned: totalPoints,
                processed: true
              });

              batch.update(userRef, {
                points: increment(totalPoints),
                streak: newStreak
              });

              const historyRef = doc(collection(db, 'history'));
              batch.set(historyRef, {
                userId: bet.userId,
                userName: bet.userName,
                message: `🤖 Sincronizador: ${match.teamA} vs ${match.teamB} finalizó ${newScoreA}-${newScoreB}. ${bet.userName} ganó +${totalPoints} pts.${extraPoints > 0 ? ` +${extraPoints} pts por racha (${newStreak.type} x${newStreak.count})` : ''}`,
                timestamp: new Date().toISOString()
              });

              if (extraPoints > 0) {
                const streakTypeLabel = newStreak.type === 'exact' ? 'Marcadores Exactos' : 'Ganadores';
                const streakRef = doc(collection(db, 'history'));
                batch.set(streakRef, {
                  userId: bet.userId,
                  userName: bet.userName,
                  message: `🔥 ¡Racha de ${streakTypeLabel}! ${bet.userName} lleva ${newStreak.count} aciertos consecutivos y ganó +${extraPoints} pts extra.`,
                  timestamp: new Date().toISOString()
                });
              }
            }

            // Resetear rachas de usuarios que no participaron en este partido
            const bettors = new Set(betsSnapshot.docs.map((d) => d.data().userId));
            const usersSnap = await getDocs(collection(db, 'users'));
            usersSnap.forEach((uDoc) => {
              if (!bettors.has(uDoc.id)) {
                const uRef = doc(db, 'users', uDoc.id);
                batch.update(uRef, { streak: { type: null, count: 0, lastMatchId: null } });
              }
            });
            
            if (betsSnapshot.empty) {
              const historyRef = doc(collection(db, 'history'));
              batch.set(historyRef, {
                userId: 'system',
                userName: 'Sistema',
                message: `🤖 Sincronizador: El partido ${match.teamA} vs ${match.teamB} finalizó ${newScoreA}-${newScoreB}.`,
                timestamp: new Date().toISOString()
              });
            }
          }

          batch.update(matchDoc.ref, {
            scoreA: newScoreA,
            scoreB: newScoreB,
            status
          });
          
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: `Synchronization completed. Updated ${updatedCount} matches.`,
      status: 'success'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error synchronizing matches:', error);
    return NextResponse.json({
      message: 'Failed to synchronize matches.',
      error: error.message
    }, { status: 500 });
  }
}
