export type UserRole = 'ADMIN' | 'PLAYER' | 'SPECTATOR';

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  roomNumber?: string;
  hostelBlock?: string;
  eloRating: number;
  stats?: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    tournamentsWon: number;
    finalsReached: number;
  };
}

export type TournamentFormat = 'LEAGUE' | 'KNOCKOUT' | 'GROUP_TO_KNOCKOUT' | 'HOME_AWAY';

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TeamSelectionRule =
  | 'EXCLUSIVE'
  | 'UNRESTRICTED'
  | 'RESTRICTED'
  | 'MATCH_BY_MATCH'
  | 'TOURNAMENT_LOCKED';

export interface Tournament {
  id: number;
  title: string;
  slug: string;
  description: string;
  format: TournamentFormat;
  status: TournamentStatus;
  teamSelectionRule: TeamSelectionRule;
  maxParticipants: number;
  currentParticipantsCount: number;
  entryFee?: string;
  prizePool?: string;
  rules?: string;
  bannerUrl?: string;
  startDate?: string;
  endDate?: string;
  adminId: number;
  adminName: string;
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  hostelInfo?: string; // e.g. "Block B - Room 304"
  teamName: string;    // e.g. "Real Madrid", "Arsenal"
  teamBadgeUrl?: string;
  groupName?: string;  // e.g. "Group A"
  seed?: number;
  status: 'REGISTERED' | 'CONFIRMED' | 'ELIMINATED' | 'DISQUALIFIED' | 'WINNER';
}

export type MatchStatus =
  | 'SCHEDULED'
  | 'PENDING_VERIFICATION'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MatchDispute {
  id: number;
  matchId: number;
  raisedByUserId: number;
  raisedByUserName: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
}

export interface Match {
  id: number;
  tournamentId: number;
  tournamentTitle: string;
  stage: string; // e.g. "Group Stage", "Quarter-Finals", "Semi-Finals", "Final"
  round: number;
  matchNumber?: number;
  groupName?: string;
  homeParticipant: TournamentParticipant;
  awayParticipant: TournamentParticipant;
  homeScore?: number | null;
  awayScore?: number | null;
  status: MatchStatus;
  submittedByUserId?: number | null;
  submittedByUserName?: string | null;
  submittedHomeScore?: number | null;
  submittedAwayScore?: number | null;
  proofScreenshotUrl?: string | null;
  notes?: string;
  scheduledTime?: string;
  playedAt?: string;
  disputes?: MatchDispute[];
}

export interface Standing {
  id: number;
  tournamentId: number;
  participantId: number;
  participantName: string;
  userAvatar?: string;
  teamName: string;
  groupName?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Announcement {
  id: number;
  tournamentId: number;
  tournamentTitle: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  badge?: string;
}
