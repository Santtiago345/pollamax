import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculatePoints } from '@/lib/rules';

export const dynamic = 'force-dynamic';

// Lógica de Sincronización de Partidos
// Este endpoint es llamado por un cron o servicio de fondo para actualizar los marcadores en tiempo real.
// Si se cuenta con una API key de api-football o football-data.org se puede realizar el fetch aquí.
export async function GET() {
  try {
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

            betsSnapshot.forEach((betDoc) => {
              const bet = betDoc.data();
              const pointsEarned = calculatePoints(bet.predA, bet.predB, newScoreA, newScoreB);

              batch.update(betDoc.ref, {
                pointsEarned,
                processed: true
              });

              // Incrementar puntos del usuario
              const userRef = doc(db, 'users', bet.userId);
              batch.update(userRef, {
                points: {
                  // Firebase Firestore en Next.js Client SDK/Web API usa increment
                  // Pero del lado de Node/Server en API Routes es compatible con firestore increment helper:
                  __op: 'Increment',
                  value: pointsEarned
                }
              });

              const historyRef = doc(collection(db, 'history'));
              batch.set(historyRef, {
                userId: bet.userId,
                userName: bet.userName,
                message: `🤖 Sincronizador: ${match.teamA} vs ${match.teamB} finalizó ${newScoreA}-${newScoreB}. ${bet.userName} ganó +${pointsEarned} pts.`,
                timestamp: new Date().toISOString()
              });
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
