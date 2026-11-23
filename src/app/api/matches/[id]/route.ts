import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

// ELO rating calculator helper
function calculateNewElos(ratingA: number, ratingB: number, scoreA: number, scoreB: number, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  let actualA = 0.5;
  let actualB = 0.5;
  if (scoreA > scoreB) {
    actualA = 1;
    actualB = 0;
  } else if (scoreB > scoreA) {
    actualA = 0;
    actualB = 1;
  }

  const newRatingA = Math.round(ratingA + k * (actualA - expectedA));
  const newRatingB = Math.round(ratingB + k * (actualB - expectedB));

  return {
    newRatingA,
    newRatingB,
    deltaA: newRatingA - ratingA,
    deltaB: newRatingB - ratingB,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await db.orm.public.Match.where({ id: matchId }).first();
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.homeScore !== undefined) updateData.homeScore = Number(body.homeScore);
    if (body.awayScore !== undefined) updateData.awayScore = Number(body.awayScore);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.submittedById !== undefined) updateData.submittedById = Number(body.submittedById);
    if (body.submittedHomeScore !== undefined) updateData.submittedHomeScore = Number(body.submittedHomeScore);
    if (body.submittedAwayScore !== undefined) updateData.submittedAwayScore = Number(body.submittedAwayScore);
    if (body.proofScreenshotUrl !== undefined) updateData.proofScreenshotUrl = body.proofScreenshotUrl;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // If match is being confirmed / completed, update ELO ratings of players, standings, and advance bracket
    if (body.status === 'COMPLETED' && updateData.homeScore !== undefined && updateData.awayScore !== undefined) {
      updateData.playedAt = new Date();

      const homePart = await db.orm.public.TournamentParticipant.where({ id: match.homeParticipantId }).first();
      const awayPart = await db.orm.public.TournamentParticipant.where({ id: match.awayParticipantId }).first();

      if (homePart && awayPart) {
        const homeUser = await db.orm.public.User.where({ id: homePart.userId }).first();
        const awayUser = await db.orm.public.User.where({ id: awayPart.userId }).first();

        if (homeUser && awayUser) {
          const { newRatingA, newRatingB, deltaA, deltaB } = calculateNewElos(
            homeUser.eloRating,
            awayUser.eloRating,
            updateData.homeScore,
            updateData.awayScore
          );

          await db.orm.public.User.where({ id: homeUser.id }).update({ eloRating: newRatingA });
          await db.orm.public.User.where({ id: awayUser.id }).update({ eloRating: newRatingB });

          // Send notifications
          await db.orm.public.Notification.create({
            userId: homeUser.id,
            title: 'Official Match Result Recorded',
            message: `Official score recorded by Admin: ${updateData.homeScore}-${updateData.awayScore}. ELO changed: ${deltaA >= 0 ? '+' : ''}${deltaA} (New: ${newRatingA})`,
            linkUrl: `/matches/${match.id}`,
            isRead: false,
          });

          await db.orm.public.Notification.create({
            userId: awayUser.id,
            title: 'Official Match Result Recorded',
            message: `Official score recorded by Admin: ${updateData.awayScore}-${updateData.homeScore}. ELO changed: ${deltaB >= 0 ? '+' : ''}${deltaB} (New: ${newRatingB})`,
            linkUrl: `/matches/${match.id}`,
            isRead: false,
          });
        }

        // Update Standings if exists for group/league stage
        try {
          const homeStanding = await db.orm.public.Standing.where({ 
            tournamentId: match.tournamentId, 
            participantId: homePart.id 
          }).first();
          if (homeStanding) {
            const isWin = updateData.homeScore > updateData.awayScore;
            const isDraw = updateData.homeScore === updateData.awayScore;
            await db.orm.public.Standing.where({ id: homeStanding.id }).update({
              played: (homeStanding.played || 0) + 1,
              won: (homeStanding.won || 0) + (isWin ? 1 : 0),
              drawn: (homeStanding.drawn || 0) + (isDraw ? 1 : 0),
              lost: (homeStanding.lost || 0) + (!isWin && !isDraw ? 1 : 0),
              goalsFor: (homeStanding.goalsFor || 0) + updateData.homeScore,
              goalsAgainst: (homeStanding.goalsAgainst || 0) + updateData.awayScore,
              goalDifference: (homeStanding.goalDifference || 0) + (updateData.homeScore - updateData.awayScore),
              points: (homeStanding.points || 0) + (isWin ? 3 : isDraw ? 1 : 0),
            });
          }

          const awayStanding = await db.orm.public.Standing.where({ 
            tournamentId: match.tournamentId, 
            participantId: awayPart.id 
          }).first();
          if (awayStanding) {
            const isWin = updateData.awayScore > updateData.homeScore;
            const isDraw = updateData.homeScore === updateData.awayScore;
            await db.orm.public.Standing.where({ id: awayStanding.id }).update({
              played: (awayStanding.played || 0) + 1,
              won: (awayStanding.won || 0) + (isWin ? 1 : 0),
              drawn: (awayStanding.drawn || 0) + (isDraw ? 1 : 0),
              lost: (awayStanding.lost || 0) + (!isWin && !isDraw ? 1 : 0),
              goalsFor: (awayStanding.goalsFor || 0) + updateData.awayScore,
              goalsAgainst: (awayStanding.goalsAgainst || 0) + updateData.homeScore,
              goalDifference: (awayStanding.goalDifference || 0) + (updateData.awayScore - updateData.homeScore),
              points: (awayStanding.points || 0) + (isWin ? 3 : isDraw ? 1 : 0),
            });
          }
        } catch (standingErr) {
          console.warn('Standing update skipped:', standingErr);
        }

        // Advance knockout bracket winner if applicable
        try {
          const winnerPartId = updateData.homeScore > updateData.awayScore ? homePart.id : awayPart.id;
          const matchNum = match.matchNumber || 1;

          if (match.stage === 'Quarter-Finals') {
            const targetSfMatchNum = matchNum <= 2 ? 1 : 2;
            const isTargetHome = matchNum === 1 || matchNum === 3;
            const nextMatch = await db.orm.public.Match.where({
              tournamentId: match.tournamentId,
              stage: 'Semi-Finals',
              matchNumber: targetSfMatchNum,
            }).first();

            if (nextMatch) {
              await db.orm.public.Match.where({ id: nextMatch.id }).update({
                ...(isTargetHome ? { homeParticipantId: winnerPartId } : { awayParticipantId: winnerPartId }),
              });
            }
          } else if (match.stage === 'Semi-Finals') {
            const isTargetHome = matchNum === 1;
            const nextMatch = await db.orm.public.Match.where({
              tournamentId: match.tournamentId,
              stage: 'Final',
            }).first();

            if (nextMatch) {
              await db.orm.public.Match.where({ id: nextMatch.id }).update({
                ...(isTargetHome ? { homeParticipantId: winnerPartId } : { awayParticipantId: winnerPartId }),
              });
            }
          }
        } catch (bracketErr) {
          console.warn('Bracket progression skipped:', bracketErr);
        }
      }
    }

    const updated = await db.orm.public.Match.where({ id: matchId }).update(updateData);

    return NextResponse.json({ match: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // Delete any disputes on this match first
    const allDisputes = await db.orm.public.MatchDispute.all();
    for (const d of allDisputes.filter((d) => d.matchId === matchId)) {
      await db.orm.public.MatchDispute.where({ id: d.id }).delete();
    }

    await db.orm.public.Match.where({ id: matchId }).delete();

    return NextResponse.json({ success: true, message: 'Match deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
