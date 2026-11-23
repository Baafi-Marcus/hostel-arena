export interface TournamentRulesConfig {
  legs: 1 | 2; // 1 = Single Leg, 2 = Two-Legged (Home & Away)
  groupCount?: number; // e.g. 2 or 4 groups for group stage
  advancePerGroup?: number; // e.g. Top 2 advance
  halfDurationMinutes?: number; // e.g. 6, 8, 10
  extraTime: 'NONE' | 'GOLDEN_GOAL' | 'CLASSIC';
  penaltiesEnabled: boolean;
  gameSpeed?: 'NORMAL' | 'FAST';
  difficulty?: 'LEGENDARY' | 'WORLD_CLASS';
  customNotes?: string;
}

export interface GeneratedMatchItem {
  stage: string;
  round: number;
  matchNumber: number;
  groupName?: string;
  homeParticipantId: number;
  awayParticipantId: number;
  status: 'SCHEDULED';
  notes?: string;
}

/**
 * Generates match fixtures according to admin-defined format and rules.
 */
export function generateTournamentFixtures(
  format: string,
  rules: TournamentRulesConfig,
  participantIds: number[]
): GeneratedMatchItem[] {
  const matches: GeneratedMatchItem[] = [];
  let matchCounter = 1;
  const isTwoLegged = rules.legs === 2;

  if (format === 'SINGLE_ELIMINATION') {
    // Generate Bracket Round 1 based on number of participants
    const n = participantIds.length;
    let stageName = 'Knockout Round 1';
    if (n === 4) stageName = 'Semi-Finals';
    else if (n === 8) stageName = 'Quarter-Finals';
    else if (n === 16) stageName = 'Round of 16';
    else if (n === 32) stageName = 'Round of 32';

    // Pair seeds: 1 vs n, 2 vs n-1, etc.
    const half = Math.floor(n / 2);
    for (let i = 0; i < half; i++) {
      const homeId = participantIds[i];
      const awayId = participantIds[n - 1 - i];

      // Leg 1
      matches.push({
        stage: stageName,
        round: 1,
        matchNumber: matchCounter++,
        homeParticipantId: homeId,
        awayParticipantId: awayId,
        status: 'SCHEDULED',
        notes: isTwoLegged ? 'Leg 1 of 2' : 'Single match tie',
      });

      // Leg 2 if configured by admin
      if (isTwoLegged) {
        matches.push({
          stage: stageName,
          round: 1,
          matchNumber: matchCounter++,
          homeParticipantId: awayId,
          awayParticipantId: homeId,
          status: 'SCHEDULED',
          notes: 'Leg 2 of 2 (Return leg)',
        });
      }
    }
  } else if (format === 'GROUP_TO_KNOCKOUT') {
    // Admin configured groups (default to 2 or 4 groups)
    const groupCount = rules.groupCount || (participantIds.length >= 16 ? 4 : 2);
    const groups: { [groupName: string]: number[] } = {};
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let g = 0; g < groupCount; g++) {
      groups[groupLetters[g]] = [];
    }

    // Distribute participants round-robin into groups
    participantIds.forEach((pid, idx) => {
      const gIndex = idx % groupCount;
      groups[groupLetters[gIndex]].push(pid);
    });

    // Generate round robin matches within each group
    for (const [groupName, members] of Object.entries(groups)) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          matches.push({
            stage: 'Group Stage',
            round: 1,
            matchNumber: matchCounter++,
            groupName: `Group ${groupName}`,
            homeParticipantId: members[i],
            awayParticipantId: members[j],
            status: 'SCHEDULED',
            notes: isTwoLegged ? 'Group Match (Leg 1)' : 'Group Match',
          });

          if (isTwoLegged) {
            matches.push({
              stage: 'Group Stage',
              round: 2,
              matchNumber: matchCounter++,
              groupName: `Group ${groupName}`,
              homeParticipantId: members[j],
              awayParticipantId: members[i],
              status: 'SCHEDULED',
              notes: 'Group Match (Leg 2)',
            });
          }
        }
      }
    }
  } else if (format === 'ROUND_ROBIN') {
    // Complete League Format: each participant plays every other participant
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        matches.push({
          stage: 'Regular Season',
          round: 1,
          matchNumber: matchCounter++,
          homeParticipantId: participantIds[i],
          awayParticipantId: participantIds[j],
          status: 'SCHEDULED',
          notes: isTwoLegged ? 'Matchday 1' : 'League Match',
        });

        if (isTwoLegged) {
          matches.push({
            stage: 'Regular Season',
            round: 2,
            matchNumber: matchCounter++,
            homeParticipantId: participantIds[j],
            awayParticipantId: participantIds[i],
            status: 'SCHEDULED',
            notes: 'Matchday 2 (Reverse fixture)',
          });
        }
      }
    }
  } else {
    // Default fallback to Knockout
    return generateTournamentFixtures('SINGLE_ELIMINATION', rules, participantIds);
  }

  return matches;
}
