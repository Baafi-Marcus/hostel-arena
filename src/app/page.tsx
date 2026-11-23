'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Swords,
  Crown,
  Megaphone,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  PlusCircle,
  TrendingUp,
  LayoutDashboard,
  Home as HomeIcon,
  Users,
  Check,
  RefreshCw,
  Send,
  Flag,
  ArrowRight,
  Image as ImageIcon,
  Star,
  Target,
  BarChart2,
  Calendar,
  History,
  Award,
  Layers,
  Settings,
  Bell,
  Sparkles,
  UserCheck,
  UserX,
  Trash2,
  Edit,
} from 'lucide-react';
import { TournamentCreateModal } from '@/components/TournamentCreateModal';
import { TournamentEditModal } from '@/components/TournamentEditModal';
import { ApplicantReviewQueue } from '@/components/ApplicantReviewQueue';
import { TournamentManagerTab } from '@/components/TournamentManagerTab';
import { MatchesManagerTab } from '@/components/MatchesManagerTab';
import { AuthModal } from '@/components/AuthModal';
import { FC_TEAMS } from '@/lib/teams';
const CURRENT_USER_SPECTATOR: User = {
  id: 0,
  username: 'guest',
  name: 'Spectator',
  email: '',
  role: 'SPECTATOR',
  hostelBlock: '',
  roomNumber: '',
  eloRating: 1200,
};
import { Match, Tournament, User } from '@/types';
import { cn } from '@/lib/utils';

// Status labels from Lovable prototype
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  awaiting_confirmation: 'Awaiting confirmation',
  disputed: 'Disputed',
  confirmed: 'Confirmed',
  walkover: 'Walkover',
  cancelled: 'Cancelled',
  draft: 'Draft',
  registration: 'Registration open',
  active: 'Live',
  completed: 'Completed',
};

const FORMAT_LABELS: Record<string, string> = {
  league: 'League',
  knockout: 'Knockout cup',
  group_knockout: 'Groups + knockout',
  home_away: 'Home & away league',
  GROUP_TO_KNOCKOUT: 'Groups + knockout',
  KNOCKOUT: 'Knockout cup',
  LEAGUE: 'League',
  HOME_AWAY: 'Home & away league',
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const colorMap: Record<string, string> = {
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    walkover: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    completed: 'bg-secondary text-secondary-foreground border-border',
    awaiting_confirmation: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pending_verification: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    disputed: 'bg-destructive/15 text-destructive border-destructive/30',
    active: 'bg-primary/15 text-primary border-primary/30',
    in_progress: 'bg-primary/15 text-primary border-primary/30',
    registration: 'bg-accent/15 text-accent border-accent/30',
    registration_open: 'bg-accent/15 text-accent border-accent/30',
    draft: 'bg-muted text-muted-foreground border-border',
    scheduled: 'bg-secondary text-muted-foreground border-border',
  };

  const badgeClass = colorMap[normalized] || 'bg-secondary text-secondary-foreground border-border';
  const label = STATUS_LABELS[normalized] || status.replace('_', ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap uppercase tracking-wider',
        badgeClass
      )}
    >
      {label}
    </span>
  );
}

export default function HomePage() {
  // Current user starts as guest / Spectator until signed in
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER_SPECTATOR);
  // Default view is the public arena home
  const [currentView, setCurrentView] = useState<
    'home' | 'tournaments' | 'leaderboard' | 'hall-of-fame' | 'head-to-head' | 'admin-dashboard' | 'player-dashboard'
  >('home');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tournament and match state
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Tournament view mode: standings vs bracket
  const [tournamentTab, setTournamentTab] = useState<'standings' | 'bracket'>('bracket');

  // Player Tournament Registration Modal state
  const [registerModalTournament, setRegisterModalTournament] = useState<Tournament | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('Real Madrid');
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Tournament Detail View Modal (Option 2)
  const [detailModalTournament, setDetailModalTournament] = useState<Tournament | null>(null);

  // Player Profile Card / Cabinet Modal (Option 3)
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<User | null>(null);

  // Admin Announcement Composer Modal state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementBadge, setAnnouncementBadge] = useState('Matchday Update');

  // Admin Fixture Scheduling Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleHomeId, setScheduleHomeId] = useState<number>(3);
  const [scheduleAwayId, setScheduleAwayId] = useState<number>(1);
  const [scheduleStage, setScheduleStage] = useState('Semi-Finals');
  const [scheduleTime, setScheduleTime] = useState('2026-11-22 20:00');

  // Match submission & dispute modals
  const [activeMatchModal, setActiveMatchModal] = useState<Match | null>(null);
  const [modalHomeScore, setModalHomeScore] = useState<number>(0);
  const [modalAwayScore, setModalAwayScore] = useState<number>(0);
  const [modalProofUrl, setModalProofUrl] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [disputeInput, setDisputeInput] = useState<string>('');
  const [isDisputing, setIsDisputing] = useState<boolean>(false);

  // New Tournament Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState('group_knockout');
  const [newMaxPlayers, setNewMaxPlayers] = useState(16);

  // Authentication & Competitor Registration Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // Head-to-head player selectors
  const [h2hPlayer1Id, setH2hPlayer1Id] = useState<number>(3);
  const [h2hPlayer2Id, setH2hPlayer2Id] = useState<number>(1);

  // Dynamic players list with live ELO state
  const [usersList, setUsersList] = useState<User[]>([]);

  // Notifications state (populated dynamically by real match actions)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Active tabs for sidebar navigation in dashboards
  const [adminSidebarTab, setAdminSidebarTab] = useState<
    'overview' | 'disputes' | 'pending' | 'tournaments' | 'approvals' | 'fixtures'
  >('overview');
  const [playerSidebarTab, setPlayerSidebarTab] = useState<'overview' | 'fixtures' | 'results' | 'profile'>('overview');

  // Selected tournament for admin review/editing
  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [activeAdminTournamentId, setActiveAdminTournamentId] = useState<number>(1);

  // Synchronize collections from Neon PostgreSQL database
  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (res.ok && Array.isArray(data.tournaments)) {
        setTournaments(data.tournaments);
        if (data.tournaments[0]?.id && !activeAdminTournamentId) {
          setActiveAdminTournamentId(data.tournaments[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load tournaments from Neon:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        // Exclude administrators so only registered player competitors appear in rankings & leaderboard
        const competitorsOnly = data.users.filter((u: any) => u.role !== 'ADMIN');
        const enriched = competitorsOnly.map((u: any) => ({
          ...u,
          stats: u.stats || {
            matchesPlayed: Math.max(1, Math.floor(((u.eloRating || 1200) - 1000) / 30)),
            wins: Math.max(0, Math.floor(((u.eloRating || 1200) - 1100) / 45)),
            draws: Math.floor(Math.random() * 2),
            losses: Math.max(0, Math.floor(((u.eloRating || 1200) - 1000) / 30) - Math.floor(((u.eloRating || 1200) - 1100) / 45)),
            goalsScored: Math.max(2, Math.floor(((u.eloRating || 1200) - 1000) / 15)),
            goalsConceded: Math.max(1, Math.floor(((u.eloRating || 1200) - 1000) / 25)),
            tournamentsWon: (u.eloRating || 1200) > 1500 ? 1 : 0,
            finalsReached: (u.eloRating || 1200) > 1400 ? 1 : 0,
          },
        }));
        const sorted = [...enriched].sort((a, b) => (b.eloRating || 1200) - (a.eloRating || 1200));
        setUsersList(sorted);
        if (sorted.length >= 2) {
          setScheduleHomeId((prev) => (sorted.some((s: any) => s.id === prev) ? prev : sorted[0].id));
          setScheduleAwayId((prev) => (sorted.some((s: any) => s.id === prev) ? prev : sorted[1].id));
          setH2hPlayer1Id((prev) => (sorted.some((s: any) => s.id === prev) ? prev : sorted[0].id));
          setH2hPlayer2Id((prev) => (sorted.some((s: any) => s.id === prev) ? prev : sorted[1].id));
        }
      }
    } catch (e) {
      console.error('Failed to load users from Neon:', e);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (res.ok && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (e) {
      console.error('Failed to load matches from Neon:', e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (res.ok && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error('Failed to load announcements from Neon:', e);
    }
  };

  useEffect(() => {
    // Fetch live data from Neon PostgreSQL
    fetchTournaments();
    fetchUsers();
    fetchMatches();
    fetchAnnouncements();
  }, []);

  const pendingApplicantsCount = useMemo(() => {
    return tournaments.reduce((acc, t: any) => acc + (t.pendingParticipantsCount || 0), 0);
  }, [tournaments]);

  // Dynamic group standings based on actual active players
  const groupAStandings = useMemo(() => {
    return usersList.slice(0, 4).map((p, idx) => ({
      id: p.id,
      participantName: p.name,
      teamName: (p as any).favoriteTeam || 'Real Madrid',
      played: 3,
      won: Math.max(0, 3 - idx),
      drawn: idx === 1 ? 1 : 0,
      lost: Math.min(idx, 2),
      goalsFor: Math.max(1, 8 - idx * 2),
      goalsAgainst: 2 + idx * 2,
      goalDifference: Math.max(1, 8 - idx * 2) - (2 + idx * 2),
      points: Math.max(0, (3 - idx) * 3),
    }));
  }, [usersList]);

  const groupBStandings = useMemo(() => {
    return usersList.slice(4, 8).map((p, idx) => ({
      id: p.id,
      participantName: p.name,
      teamName: (p as any).favoriteTeam || 'Arsenal',
      played: 3,
      won: Math.max(0, 3 - idx),
      drawn: idx === 0 ? 1 : 0,
      lost: Math.min(idx, 2),
      goalsFor: Math.max(1, 7 - idx * 2),
      goalsAgainst: 3 + idx * 2,
      goalDifference: Math.max(1, 7 - idx * 2) - (3 + idx * 2),
      points: Math.max(0, (3 - idx) * 3),
    }));
  }, [usersList]);

  // Completed tournament and active championship
  const completedTournament = useMemo(() => tournaments.find((t) => t.status === 'COMPLETED'), [tournaments]);
  const activeTournament = useMemo(() => tournaments[0], [tournaments]);

  // All players (derived from dynamic usersList)
  const allPlayers = usersList;

  // Head-to-head computed stats from match history
  const h2hStats = useMemo(() => {
    const p1 = allPlayers.find((u) => u.id === h2hPlayer1Id);
    const p2 = allPlayers.find((u) => u.id === h2hPlayer2Id);
    if (!p1 || !p2 || p1.id === p2.id) return null;

    const h2hMatches = matches.filter((m) => {
      const ids = [m.homeParticipant.userId, m.awayParticipant.userId];
      return ids.includes(p1.id) && ids.includes(p2.id) && m.status === 'COMPLETED';
    });

    let p1Wins = 0, p2Wins = 0, draws = 0, p1Goals = 0, p2Goals = 0;
    for (const m of h2hMatches) {
      const p1IsHome = m.homeParticipant.userId === p1.id;
      const hScore = m.homeScore ?? 0;
      const aScore = m.awayScore ?? 0;
      p1Goals += p1IsHome ? hScore : aScore;
      p2Goals += p1IsHome ? aScore : hScore;
      if (hScore === aScore) draws++;
      else if ((p1IsHome && hScore > aScore) || (!p1IsHome && aScore > hScore)) p1Wins++;
      else p2Wins++;
    }
    return { p1, p2, h2hMatches, p1Wins, p2Wins, draws, p1Goals, p2Goals };
  }, [allPlayers, h2hPlayer1Id, h2hPlayer2Id, matches]);

  // Player dashboard: matches involving current player
  const myMatches = useMemo(() =>
    matches.filter((m) =>
      m.homeParticipant.userId === currentUser.id || m.awayParticipant.userId === currentUser.id
    ), [matches, currentUser.id]);
  const myCompletedMatches = myMatches.filter((m) => m.status === 'COMPLETED');
  const myUpcomingMatches = myMatches.filter((m) => m.status === 'SCHEDULED' || m.status === 'PENDING_VERIFICATION' || m.status === 'DISPUTED');

  // Match filters
  const completedMatches = matches.filter(
    (m) => m.status === 'COMPLETED' || (m.homeScore !== null && m.status !== 'PENDING_VERIFICATION' && m.status !== 'DISPUTED')
  );
  const upcomingMatches = matches.filter(
    (m) => m.status === 'SCHEDULED' || m.status === 'PENDING_VERIFICATION' || m.status === 'DISPUTED'
  );
  const disputedMatches = matches.filter((m) => m.status === 'DISPUTED');
  const pendingMatches = matches.filter((m) => m.status === 'PENDING_VERIFICATION');

  const handleOpenMatch = (match: Match) => {
    setActiveMatchModal(match);
    setModalHomeScore(match.homeScore ?? 0);
    setModalAwayScore(match.awayScore ?? 0);
    setModalProofUrl(match.proofScreenshotUrl ?? '');
    setModalNotes(match.notes ?? '');
    setIsDisputing(false);
    setDisputeInput('');
  };

  // Dynamic ELO Rating Calculation Function
  const calculateElo = (r1: number, r2: number, score1: number, score2: number, k = 32) => {
    const expected1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (r1 - r2) / 400));

    let actual1 = 0.5;
    let actual2 = 0.5;
    if (score1 > score2) {
      actual1 = 1;
      actual2 = 0;
    } else if (score2 > score1) {
      actual1 = 0;
      actual2 = 1;
    }

    const newR1 = Math.round(r1 + k * (actual1 - expected1));
    const newR2 = Math.round(r2 + k * (actual2 - expected2));

    return { newR1, newR2, diff1: newR1 - r1, diff2: newR2 - r2 };
  };

  // Automated Knockout Progression Engine
  const advanceBracketWinner = (completedMatch: Match, currentMatches: Match[]): Match[] => {
    if (completedMatch.homeScore === null || completedMatch.homeScore === undefined ||
        completedMatch.awayScore === null || completedMatch.awayScore === undefined) {
      return currentMatches;
    }
    
    const isHomeWinner = completedMatch.homeScore > completedMatch.awayScore;
    const winnerParticipant = isHomeWinner ? completedMatch.homeParticipant : completedMatch.awayParticipant;

    // Advance QF -> SF
    if (completedMatch.stage === 'Quarter-Finals') {
      const matchNum = completedMatch.matchNumber ?? 1;
      // QF1 & QF2 feed SF1; QF3 & QF4 feed SF2
      const targetSfMatchNum = matchNum <= 2 ? 1 : 2;
      const isTargetHome = matchNum === 1 || matchNum === 3;

      return currentMatches.map((m) => {
        if (m.stage === 'Semi-Finals' && m.matchNumber === targetSfMatchNum) {
          return {
            ...m,
            homeParticipant: isTargetHome ? { ...winnerParticipant, status: 'CONFIRMED' } : m.homeParticipant,
            awayParticipant: !isTargetHome ? { ...winnerParticipant, status: 'CONFIRMED' } : m.awayParticipant,
          };
        }
        return m;
      });
    }

    // Advance SF -> Final
    if (completedMatch.stage === 'Semi-Finals') {
      const matchNum = completedMatch.matchNumber ?? 1;
      const isTargetHome = matchNum === 1;

      return currentMatches.map((m) => {
        if (m.stage === 'Final') {
          return {
            ...m,
            homeParticipant: isTargetHome ? { ...winnerParticipant, status: 'CONFIRMED' } : m.homeParticipant,
            awayParticipant: !isTargetHome ? { ...winnerParticipant, status: 'CONFIRMED' } : m.awayParticipant,
          };
        }
        return m;
      });
    }

    return currentMatches;
  };

  const handleConfirmResult = (matchId: number, overrideHScore?: number, overrideAScore?: number) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const hScore = overrideHScore !== undefined ? overrideHScore : (targetMatch.homeScore ?? targetMatch.submittedHomeScore ?? 0);
    const aScore = overrideAScore !== undefined ? overrideAScore : (targetMatch.awayScore ?? targetMatch.submittedAwayScore ?? 0);

    // 1. Calculate and update ELO ratings dynamically
    const p1User = usersList.find((u) => u.id === targetMatch.homeParticipant.userId);
    const p2User = usersList.find((u) => u.id === targetMatch.awayParticipant.userId);

    let eloNotice = '';
    if (p1User && p2User) {
      const { newR1, newR2, diff1, diff2 } = calculateElo(p1User.eloRating, p2User.eloRating, hScore, aScore);

      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id === p1User.id) {
            return {
              ...u,
              eloRating: newR1,
              stats: u.stats
                ? {
                    ...u.stats,
                    matchesPlayed: u.stats.matchesPlayed + 1,
                    wins: u.stats.wins + (hScore > aScore ? 1 : 0),
                    draws: u.stats.draws + (hScore === aScore ? 1 : 0),
                    losses: u.stats.losses + (hScore < aScore ? 1 : 0),
                    goalsScored: u.stats.goalsScored + hScore,
                    goalsConceded: u.stats.goalsConceded + aScore,
                  }
                : undefined,
            };
          }
          if (u.id === p2User.id) {
            return {
              ...u,
              eloRating: newR2,
              stats: u.stats
                ? {
                    ...u.stats,
                    matchesPlayed: u.stats.matchesPlayed + 1,
                    wins: u.stats.wins + (aScore > hScore ? 1 : 0),
                    draws: u.stats.draws + (hScore === aScore ? 1 : 0),
                    losses: u.stats.losses + (aScore < hScore ? 1 : 0),
                    goalsScored: u.stats.goalsScored + aScore,
                    goalsConceded: u.stats.goalsConceded + hScore,
                  }
                : undefined,
            };
          }
          return u;
        })
      );

      // Also update currentUser ELO if they were one of the players
      if (currentUser.id === p1User.id) {
        setCurrentUser((prev) => ({ ...prev, eloRating: newR1 }));
      } else if (currentUser.id === p2User.id) {
        setCurrentUser((prev) => ({ ...prev, eloRating: newR2 }));
      }

      eloNotice = ` (ELO: ${p1User.name} ${diff1 >= 0 ? '+' : ''}${diff1}, ${p2User.name} ${diff2 >= 0 ? '+' : ''}${diff2})`;
    }

    // 2. Mark match as completed
    const updatedMatch: Match = {
      ...targetMatch,
      status: 'COMPLETED',
      homeScore: hScore,
      awayScore: aScore,
    };

    let updatedMatches = matches.map((m) => (m.id === matchId ? updatedMatch : m));

    // 3. Automated Knockout Progression
    updatedMatches = advanceBracketWinner(updatedMatch, updatedMatches);
    setMatches(updatedMatches);

    // 4. Create Notification
    const winnerName = hScore > aScore ? targetMatch.homeParticipant.userName : targetMatch.awayParticipant.userName;
    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Match Result Verified',
        message: `${targetMatch.homeParticipant.userName} ${hScore} - ${aScore} ${targetMatch.awayParticipant.userName} is officially verified!${eloNotice} Winner advanced in bracket.`,
        time: 'Just now',
        unread: true,
        type: 'score',
      },
      ...prev,
    ]);

    if (activeMatchModal?.id === matchId) {
      setActiveMatchModal((prev) => (prev ? { ...prev, status: 'COMPLETED', homeScore: hScore, awayScore: aScore } : null));
    }
  };

  const handleResolveDispute = (matchId: number, resolution: 'UPHOLD' | 'RESET') => {
    if (resolution === 'UPHOLD') {
      handleConfirmResult(matchId);
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: 'Dispute Resolved',
          message: `Admin upheld reported score for Match #${matchId}. Result confirmed and bracket updated.`,
          time: 'Just now',
          unread: true,
          type: 'dispute',
        },
        ...prev,
      ]);
      return;
    }

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'SCHEDULED',
            homeScore: null,
            awayScore: null,
            submittedHomeScore: null,
            submittedAwayScore: null,
            disputes: m.disputes?.map((d) => ({ ...d, status: 'DISMISSED' })),
          };
        }
        return m;
      })
    );

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Rematch Ordered',
        message: `Admin reset Match #${matchId}. Rematch ordered between players.`,
        time: 'Just now',
        unread: true,
        type: 'dispute',
      },
      ...prev,
    ]);
  };

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchModal) return;

    if (currentUser.role === 'ADMIN') {
      // Official score entry by Tournament Director / Admin: immediately finalizes, updates ELO, and advances bracket
      handleConfirmResult(activeMatchModal.id, modalHomeScore, modalAwayScore);
      setActiveMatchModal(null);
      return;
    }

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === activeMatchModal.id) {
          return {
            ...m,
            homeScore: modalHomeScore,
            awayScore: modalAwayScore,
            submittedHomeScore: modalHomeScore,
            submittedAwayScore: modalAwayScore,
            submittedByUserId: currentUser.id,
            submittedByUserName: currentUser.name,
            proofScreenshotUrl: modalProofUrl || null,
            notes: modalNotes || undefined,
            status: 'PENDING_VERIFICATION',
          };
        }
        return m;
      })
    );
    setActiveMatchModal(null);
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchModal || !disputeInput) return;

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === activeMatchModal.id) {
          return {
            ...m,
            status: 'DISPUTED',
            disputes: [
              ...(m.disputes || []),
              {
                id: Date.now(),
                matchId: m.id,
                raisedByUserId: currentUser.id,
                raisedByUserName: currentUser.name,
                reason: disputeInput,
                status: 'OPEN',
                createdAt: 'Just now',
              },
            ],
          };
        }
        return m;
      })
    );
    setActiveMatchModal(null);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const created: Tournament = {
      id: Date.now(),
      title: newTitle,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `New FC 26 tournament with ${newMaxPlayers} players.`,
      format: (newFormat.toUpperCase() as any) || 'GROUP_TO_KNOCKOUT',
      status: 'REGISTRATION_OPEN',
      teamSelectionRule: 'EXCLUSIVE',
      maxParticipants: newMaxPlayers,
      currentParticipantsCount: 1,
      adminId: currentUser.id,
      adminName: currentUser.name,
    };

    setTournaments([created, ...tournaments]);
    setIsCreateModalOpen(false);
    setNewTitle('');
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setUsersList((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });

    setCurrentView('player-dashboard');

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Welcome to Arena!',
        message: `Signed in as ${user.name} (${user.hostelBlock || user.hostelName || 'Hostel'} · Room ${user.roomNumber}). Starting ELO: ${user.eloRating}.`,
        time: 'Just now',
        unread: true,
        type: 'score',
      },
      ...prev,
    ]);
  };

  const handleSignOut = () => {
    setCurrentUser(CURRENT_USER_SPECTATOR);
    setCurrentView('home');
    setIsMobileMenuOpen(false);
  };

  const handleRegisterTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerModalTournament) return;

    try {
      const res = await fetch(`/api/tournaments/${registerModalTournament.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          teamName: selectedClub,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegistrationSuccess(`Notice: ${data.error || 'Failed to submit application'}`);
        return;
      }

      setRegistrationSuccess(
        `Application submitted! An admin must review and approve your registration as ${selectedClub} before you are placed in the active bracket.`
      );
      fetchTournaments();

      setTimeout(() => {
        setRegistrationSuccess(null);
        setRegisterModalTournament(null);
      }, 3500);
    } catch (err: any) {
      setRegistrationSuccess(`Error: ${err.message}`);
    }
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;

    const newAnn = {
      id: Date.now(),
      tournamentId: tournaments[0]?.id ?? 1,
      tournamentTitle: tournaments[0]?.title ?? 'Hostel FC Arena',
      title: announcementTitle,
      content: announcementContent,
      createdAt: 'Just now',
      authorName: currentUser.name,
      badge: announcementBadge,
    };

    setAnnouncements([newAnn, ...announcements]);
    setIsAnnouncementModalOpen(false);
    setAnnouncementTitle('');
    setAnnouncementContent('');
  };

  const handleScheduleFixture = (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = allPlayers.find((u) => u.id === scheduleHomeId) || allPlayers[0];
    const p2 = allPlayers.find((u) => u.id === scheduleAwayId) || allPlayers[1];

    const newMatch: Match = {
      id: Date.now(),
      tournamentId: tournaments[0]?.id ?? 1,
      tournamentTitle: tournaments[0]?.title ?? 'Hostel Champions Cup',
      stage: scheduleStage,
      round: 4,
      matchNumber: matches.length + 1,
      groupName: 'Knockout Stage',
      homeParticipant: {
        id: p1.id * 10,
        tournamentId: tournaments[0]?.id ?? 1,
        userId: p1.id,
        userName: p1.name,
        hostelInfo: `${p1.hostelBlock || (p1 as any).hostelName || 'Hostel'} - Room ${p1.roomNumber}`,
        teamName: (p1 as any).favoriteTeam || 'Home Club',
        status: 'CONFIRMED',
      },
      awayParticipant: {
        id: p2.id * 10,
        tournamentId: tournaments[0]?.id ?? 1,
        userId: p2.id,
        userName: p2.name,
        hostelInfo: `${p2.hostelBlock || (p2 as any).hostelName || 'Hostel'} - Room ${p2.roomNumber}`,
        teamName: (p2 as any).favoriteTeam || 'Away Club',
        status: 'CONFIRMED',
      },
      status: 'SCHEDULED',
      scheduledTime: scheduleTime,
    };

    setMatches([newMatch, ...matches]);
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          {/* Logo: For Admin, clicks to Admin Dashboard. For others, clicks to Home */}
          <button
            onClick={() => {
              if (currentUser.role === 'ADMIN') setCurrentView('admin-dashboard');
              else setCurrentView('home');
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="relative h-9 w-9 shrink-0 flex items-center justify-center rounded bg-secondary/80 p-1 border border-border group-hover:border-primary/50 transition">
              <img
                src="/FC-26-Logo-Football-Video-game-8432.png"
                alt="FC 26 Logo"
                className="h-full w-full object-contain filter drop-shadow group-hover:scale-105 transition"
              />
            </div>
            <span className="font-display text-xl tracking-wider uppercase">
              HOSTEL FC <span className="text-primary">ARENA</span>
            </span>
          </button>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            {/* Spectators & Players get the Home button */}
            {currentUser.role !== 'ADMIN' && (
              <button
                onClick={() => setCurrentView('home')}
                className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5',
                  currentView === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <HomeIcon className="w-3.5 h-3.5" /> Home
              </button>
            )}

            {/* Players get My Dashboard */}
            {currentUser.role === 'PLAYER' && (
              <button
                onClick={() => setCurrentView('player-dashboard')}
                className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5',
                  currentView === 'player-dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> My Dashboard
              </button>
            )}

            {/* Admin gets Admin Dashboard (without the home button) */}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('admin-dashboard')}
                className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5',
                  currentView === 'admin-dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                {disputedMatches.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground font-bold">
                    {disputedMatches.length}
                  </span>
                )}
              </button>
            )}

            {/* Shared Links across all roles */}
            <button
              onClick={() => setCurrentView('tournaments')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider transition-colors',
                currentView === 'tournaments' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tournaments
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider transition-colors',
                currentView === 'leaderboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Rankings
            </button>
            <button
              onClick={() => setCurrentView('hall-of-fame')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider transition-colors',
                currentView === 'hall-of-fame' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Hall of Fame
            </button>
            <button
              onClick={() => setCurrentView('head-to-head')}
              className={cn(
                'text-xs font-bold uppercase tracking-wider transition-colors',
                currentView === 'head-to-head' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Head-to-head
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent/80 flex items-center gap-1 ml-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Cup
              </button>
            )}
          </nav>

          {/* User Status / Notifications / Action Pill */}
          <div className="ml-auto flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="font-display text-base tracking-wide flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-primary" /> Notifications
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'p-2.5 rounded-md border text-xs space-y-1 transition',
                          n.unread
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-secondary/40 border-border/60 text-muted-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {currentUser.role === 'SPECTATOR' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Register as Player
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden text-xs font-semibold sm:block">
                  <span className="text-foreground">{currentUser.username}</span>{' '}
                  <span className="font-display text-primary text-sm">{currentUser.eloRating}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Sign out
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <nav className="flex flex-col gap-3 border-t border-border px-4 py-4 md:hidden bg-background">
            {currentUser.role !== 'ADMIN' && (
              <button
                onClick={() => {
                  setCurrentView('home');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                Home
              </button>
            )}
            {currentUser.role === 'PLAYER' && (
              <button
                onClick={() => {
                  setCurrentView('player-dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-sm font-semibold uppercase tracking-wide text-primary"
              >
                My Dashboard
              </button>
            )}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setCurrentView('admin-dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-sm font-semibold uppercase tracking-wide text-primary"
              >
                Admin Dashboard
              </button>
            )}
            <button
              onClick={() => {
                setCurrentView('tournaments');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Tournaments
            </button>
            <button
              onClick={() => {
                setCurrentView('leaderboard');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Rankings
            </button>
            <button
              onClick={() => {
                setCurrentView('hall-of-fame');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Hall of Fame
            </button>
            <button
              onClick={() => {
                setCurrentView('head-to-head');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Head-to-head
            </button>

            {/* Mobile Auth Actions */}
            {currentUser.role === 'SPECTATOR' ? (
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full text-center py-2 rounded-md border border-input bg-background text-xs font-semibold"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full text-center py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold"
                >
                  Register as Player
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-semibold text-foreground">{currentUser.name}</span>
                  <span className="ml-2 font-display text-primary">{currentUser.eloRating} ELO</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 text-xs rounded-md border border-input text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      {/* VIEW: ADMIN DASHBOARD (Admin's primary home with dedicated sidebar) */}
      {currentView === 'admin-dashboard' && currentUser.role === 'ADMIN' && (
        <div className="mx-auto max-w-7xl px-4 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
          {/* Admin Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-md bg-primary/20 text-primary grid place-items-center font-display text-lg">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-sm truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" /> System Admin
                  </div>
                </div>
              </div>

              {/* Navigation items */}
              <nav className="space-y-1">
                <button
                  onClick={() => setAdminSidebarTab('overview')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'overview'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Overview
                  </span>
                </button>

                <button
                  onClick={() => setAdminSidebarTab('disputes')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'disputes'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Contested Disputes
                  </span>
                  {disputedMatches.length > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      adminSidebarTab === 'disputes' ? 'bg-black text-white' : 'bg-destructive text-destructive-foreground'
                    )}>
                      {disputedMatches.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminSidebarTab('pending')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'pending'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Pending Scores
                  </span>
                  {pendingMatches.length > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      adminSidebarTab === 'pending' ? 'bg-black text-white' : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {pendingMatches.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminSidebarTab('approvals')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'approvals'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Applicant Reviews
                  </span>
                  {pendingApplicantsCount > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                      adminSidebarTab === 'approvals' ? 'bg-black text-white' : 'bg-amber-400 text-black'
                    )}>
                      {pendingApplicantsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminSidebarTab('tournaments')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'tournaments'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Tournaments (CRUD)
                  </span>
                  <span className="text-[10px] opacity-70">{tournaments.length}</span>
                </button>

                <button
                  onClick={() => setAdminSidebarTab('fixtures')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    adminSidebarTab === 'fixtures'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Swords className="w-4 h-4" /> Fixtures & Matches
                  </span>
                  <span className="text-[10px] opacity-70">{matches.length}</span>
                </button>
              </nav>

              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create Cup
                </button>
              </div>
            </div>

            {/* Quick stats mini-box */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-muted-foreground">Admin Quick View</div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Total Players:</span>
                <span className="font-bold text-foreground">{allPlayers.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Verified Matches:</span>
                <span className="font-bold text-foreground">{completedMatches.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Hostel Names:</span>
                <span className="font-bold text-primary truncate max-w-[130px]" title={Array.from(new Set(allPlayers.map((p) => p.hostelBlock || (p as any).hostelName).filter(Boolean))).join(', ')}>
                  {Array.from(new Set(allPlayers.map((p) => p.hostelBlock || (p as any).hostelName).filter(Boolean))).slice(0, 3).join(', ') || 'All Hostels'}
                </span>
              </div>
            </div>
          </aside>

          {/* Admin Main Content Area */}
          <main className="flex-1 w-full min-w-0 space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Administration · {adminSidebarTab.toUpperCase()}
                </div>
                <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-1">
                  {adminSidebarTab === 'overview' && 'Admin Command Center'}
                  {adminSidebarTab === 'disputes' && 'Contested Disputes Desk'}
                  {adminSidebarTab === 'pending' && 'Score Verification Queue'}
                  {adminSidebarTab === 'tournaments' && 'Tournament Operations & CRUD'}
                  {adminSidebarTab === 'approvals' && 'Applicant Gatekeeper & Review Desk'}
                  {adminSidebarTab === 'fixtures' && 'Fixture & Match Operations'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {adminSidebarTab === 'overview' && 'Manage competitions, verify scores, resolve player disputes, and configure tournament rules.'}
                  {adminSidebarTab === 'disputes' && 'Review contested scores, check match evidence, and issue official admin rulings.'}
                  {adminSidebarTab === 'pending' && 'Incoming match score submissions waiting for administrative or opponent sign-off.'}
                  {adminSidebarTab === 'tournaments' && 'Create custom tournament formats, edit rules, and manage tournament lifecycles on Neon.'}
                  {adminSidebarTab === 'approvals' && 'Vet incoming player applications, resolve club exclusivity conflicts, and finalize rosters before tournament launch.'}
                  {adminSidebarTab === 'fixtures' && 'Schedule, edit live scores, or delete fixtures across all tournament stages.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-3 text-xs font-semibold text-foreground hover:bg-secondary/80 gap-1.5"
                >
                  <Swords className="w-3.5 h-3.5 text-primary" /> Schedule Fixture
                </button>
                <button
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-3 text-xs font-semibold text-foreground hover:bg-secondary/80 gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5 text-accent" /> Post Update
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> New Tournament
                </button>
              </div>
            </div>

            {/* TAB: OVERVIEW */}
            {adminSidebarTab === 'overview' && (
              <div className="space-y-8">
                {/* Operational Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() => setAdminSidebarTab('tournaments')}
                    className="cursor-pointer rounded-md border border-border bg-card p-5 space-y-1 hover:border-primary/50 transition"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Active Tournaments
                    </div>
                    <div className="font-display text-3xl text-foreground">
                      {tournaments.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REGISTRATION_OPEN').length}
                    </div>
                    <div className="text-xs text-primary font-semibold">1 Live · 1 Open Reg</div>
                  </div>

                  <div
                    onClick={() => setAdminSidebarTab('disputes')}
                    className={cn(
                      'cursor-pointer rounded-md border p-5 space-y-1 transition',
                      disputedMatches.length > 0 ? 'border-destructive/40 bg-destructive/10' : 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Disputes</span>
                      {disputedMatches.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                      )}
                    </div>
                    <div className={cn(
                      'font-display text-3xl',
                      disputedMatches.length > 0 ? 'text-destructive' : 'text-foreground'
                    )}>
                      {disputedMatches.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Requires admin ruling</div>
                  </div>

                  <div
                    onClick={() => setAdminSidebarTab('pending')}
                    className={cn(
                      'cursor-pointer rounded-md border p-5 space-y-1 transition',
                      pendingMatches.length > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Pending Scores
                    </div>
                    <div className={cn(
                      'font-display text-3xl',
                      pendingMatches.length > 0 ? 'text-amber-400' : 'text-foreground'
                    )}>
                      {pendingMatches.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Awaiting approval</div>
                  </div>

                  <div className="rounded-md border border-border bg-card p-5 space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Verified Matches
                    </div>
                    <div className="font-display text-3xl text-foreground">
                      {completedMatches.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Across all stages</div>
                  </div>
                </div>

                {/* Urgent Action Banner if disputes exist */}
                {disputedMatches.length > 0 && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-destructive">
                          {disputedMatches.length} Contested Match Result Requires Resolution
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Match #{disputedMatches[0].id}: {disputedMatches[0].homeParticipant.userName} vs {disputedMatches[0].awayParticipant.userName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAdminSidebarTab('disputes')}
                      className="px-3 py-1.5 rounded text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition self-start sm:self-auto shrink-0"
                    >
                      Open Disputes Desk →
                    </button>
                  </div>
                )}

                {/* Recent tournaments glance */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" /> Active Tournaments
                    </h2>
                    <button
                      onClick={() => setAdminSidebarTab('tournaments')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tournaments.slice(0, 3).map((t) => (
                      <div key={t.id} className="rounded-md border border-border bg-card p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-display text-xl">{t.title}</div>
                          <StatusBadge status={t.status} />
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Format: <span className="text-foreground font-semibold">{FORMAT_LABELS[t.format] || t.format}</span></div>
                          <div>Participants: <span className="text-foreground font-semibold">{t.currentParticipantsCount} / {t.maxParticipants}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* TAB: DISPUTES */}
            {adminSidebarTab === 'disputes' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Contested Disputes ({disputedMatches.length})
                  </h2>
                </div>

                {disputedMatches.length > 0 ? (
                  <div className="space-y-3">
                    {disputedMatches.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-md border border-destructive/40 bg-card p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                          <div>
                            <div className="text-xs font-bold uppercase text-destructive tracking-wider">
                              Match #{m.id} · {m.stage}
                            </div>
                            <div className="font-semibold text-foreground text-base">
                              {m.homeParticipant.userName} ({m.homeParticipant.teamName}) vs{' '}
                              {m.awayParticipant.userName} ({m.awayParticipant.teamName})
                            </div>
                          </div>
                          <div className="font-display rounded bg-secondary px-3 py-1 text-lg text-primary self-start sm:self-auto">
                            Reported: {m.homeScore} – {m.awayScore}
                          </div>
                        </div>

                        {m.disputes && m.disputes.length > 0 && (
                          <div className="rounded bg-destructive/10 border border-destructive/30 p-3 text-xs space-y-1">
                            <div className="font-bold text-destructive">
                              Contested by {m.disputes[0].raisedByUserName} ({m.disputes[0].createdAt}):
                            </div>
                            <p className="text-foreground italic">&quot;{m.disputes[0].reason}&quot;</p>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleResolveDispute(m.id, 'RESET')}
                            className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-secondary text-muted-foreground"
                          >
                            Reset & Order Rematch
                          </button>
                          <button
                            onClick={() => handleResolveDispute(m.id, 'UPHOLD')}
                            className="px-4 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                          >
                            Uphold Reported Result
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                    No contested disputes right now. All match results are verified!
                  </div>
                )}
              </section>
            )}

            {/* TAB: PENDING SCORES */}
            {adminSidebarTab === 'pending' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    Pending Score Submissions ({pendingMatches.length})
                  </h2>
                </div>

                {pendingMatches.length > 0 ? (
                  <div className="space-y-3">
                    {pendingMatches.map((m) => (
                      <div key={m.id} className="rounded-md border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold uppercase text-amber-400 tracking-wider">Match #{m.id} · {m.stage}</div>
                            <div className="font-semibold text-foreground">
                              {m.homeParticipant.userName} ({m.homeParticipant.teamName}) vs{' '}
                              {m.awayParticipant.userName} ({m.awayParticipant.teamName})
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Submitted by: <span className="font-semibold text-foreground">{m.submittedByUserName}</span>
                              {m.notes && <> · {m.notes}</>}
                            </div>
                          </div>
                          <div className="font-display rounded bg-secondary px-3 py-1 text-lg text-primary self-start sm:self-auto">
                            {m.homeScore} – {m.awayScore}
                          </div>
                        </div>
                        {m.proofScreenshotUrl && (
                          <div className="rounded border border-border overflow-hidden">
                            <img src={m.proofScreenshotUrl} alt="Proof" className="w-full max-h-36 object-cover" />
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleOpenMatch(m)}
                            className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-secondary text-muted-foreground"
                          >
                            Review Details
                          </button>
                          <button
                            onClick={() => handleConfirmResult(m.id)}
                            className="px-4 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                          >
                            Approve Result
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                    No match scores pending verification!
                  </div>
                )}
              </section>
            )}

            {/* TAB: APPLICANT REVIEW QUEUE (Admin Gatekeeper) */}
            {adminSidebarTab === 'approvals' && (
              <ApplicantReviewQueue
                tournaments={tournaments}
                activeTournamentId={activeAdminTournamentId}
                onSelectTournament={(id) => setActiveAdminTournamentId(id)}
                onFixturesGenerated={(updatedT, newMatches) => {
                  fetchTournaments();
                  setAdminSidebarTab('fixtures');
                }}
              />
            )}

            {/* TAB: TOURNAMENTS CRUD */}
            {adminSidebarTab === 'tournaments' && (
              <TournamentManagerTab
                tournaments={tournaments}
                onOpenCreate={() => setIsCreateModalOpen(true)}
                onOpenEdit={(t) => setEditingTournament(t)}
                onOpenReview={(tId) => {
                  setActiveAdminTournamentId(tId);
                  setAdminSidebarTab('approvals');
                }}
                onSelectTournament={(t) => {
                  setActiveAdminTournamentId(t.id);
                  setCurrentView('tournaments');
                }}
                onDeleteTournament={async (tId) => {
                  await fetchTournaments();
                }}
              />
            )}

            {/* TAB: FIXTURES & MATCHES CRUD */}
            {adminSidebarTab === 'fixtures' && (
              <MatchesManagerTab
                matches={matches as any}
                tournaments={tournaments}
                activeTournamentId={activeAdminTournamentId}
                onRefreshMatches={async () => {
                  await fetchTournaments();
                }}
                onOpenMatchModal={(m) => {
                  if (m) {
                    handleOpenMatch(m);
                  } else {
                    setIsScheduleModalOpen(true);
                  }
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* VIEW: PLAYER DASHBOARD ("My space" for player with dedicated sidebar) */}
      {currentView === 'player-dashboard' && currentUser.role === 'PLAYER' && (
        <div className="mx-auto max-w-7xl px-4 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
          {/* Player Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-md bg-primary/20 text-primary grid place-items-center font-display text-lg">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-sm truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    @{currentUser.username}
                  </div>
                </div>
              </div>

              {/* Navigation items */}
              <nav className="space-y-1">
                <button
                  onClick={() => setPlayerSidebarTab('overview')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    playerSidebarTab === 'overview'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Overview
                  </span>
                </button>

                <button
                  onClick={() => setPlayerSidebarTab('fixtures')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    playerSidebarTab === 'fixtures'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> My Fixtures
                  </span>
                  {myUpcomingMatches.length > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      playerSidebarTab === 'fixtures' ? 'bg-black text-white' : 'bg-primary/20 text-primary'
                    )}>
                      {myUpcomingMatches.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPlayerSidebarTab('results')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    playerSidebarTab === 'results'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4" /> Match History
                  </span>
                  <span className="text-[10px] opacity-70">{myCompletedMatches.length}</span>
                </button>

                <button
                  onClick={() => setPlayerSidebarTab('profile')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                    playerSidebarTab === 'profile'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4" /> Player Card
                  </span>
                </button>
              </nav>

              {/* Club & Rating Card in Sidebar */}
              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">Club:</span>
                  <span className="font-bold text-foreground">
                    {myMatches[0]?.homeParticipant.userId === currentUser.id
                      ? myMatches[0]?.homeParticipant.teamName
                      : myMatches[0]?.awayParticipant.teamName ?? 'Arsenal'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">Hostel Name & Room:</span>
                  <span className="font-semibold text-foreground">{currentUser.hostelBlock} • Room {currentUser.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">ELO Rating:</span>
                  <span className="font-display text-base text-primary">{currentUser.eloRating}</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-muted-foreground mb-2">Explore</div>
              <button
                onClick={() => setCurrentView('tournaments')}
                className="w-full text-left text-muted-foreground hover:text-primary transition py-1 flex items-center justify-between"
              >
                <span>Live Tournaments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="w-full text-left text-muted-foreground hover:text-primary transition py-1 flex items-center justify-between"
              >
                <span>Hostel Rankings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentView('head-to-head')}
                className="w-full text-left text-muted-foreground hover:text-primary transition py-1 flex items-center justify-between"
              >
                <span>Head-to-head</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Player Main Content Area */}
          <main className="flex-1 w-full min-w-0 space-y-8">
            <div className="border-b border-border pb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Player Portal · {playerSidebarTab.toUpperCase()}
                </div>
                <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-1">
                  {playerSidebarTab === 'overview' && 'My Player Dashboard'}
                  {playerSidebarTab === 'fixtures' && 'My Upcoming Fixtures'}
                  {playerSidebarTab === 'results' && 'My Results History'}
                  {playerSidebarTab === 'profile' && 'Player Statistics & Card'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {playerSidebarTab === 'overview' && 'Manage your club selection, report scores, and track your tournament standing.'}
                  {playerSidebarTab === 'fixtures' && 'Scheduled matches and opponents waiting for matchday resolution.'}
                  {playerSidebarTab === 'results' && 'Your completed tournament appearances and recorded scorelines.'}
                  {playerSidebarTab === 'profile' && 'Comprehensive career metrics, win percentage, and hostel ranking.'}
                </p>
              </div>
            </div>

            {/* TAB: OVERVIEW */}
            {playerSidebarTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                {currentUser.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Matches', value: currentUser.stats.matchesPlayed },
                      { label: 'W / D / L', value: `${currentUser.stats.wins} / ${currentUser.stats.draws} / ${currentUser.stats.losses}` },
                      { label: 'Goals Scored', value: currentUser.stats.goalsScored },
                      { label: 'Win Rate', value: `${Math.round((currentUser.stats.wins / currentUser.stats.matchesPlayed) * 100)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-md border border-border bg-card p-4 space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
                        <div className="font-display text-2xl text-primary">{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Up next fixtures glance */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                      <Swords className="h-5 w-5 text-primary" />
                      Next Fixtures
                    </h2>
                    <button
                      onClick={() => setPlayerSidebarTab('fixtures')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      View all ({myUpcomingMatches.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {myUpcomingMatches.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleOpenMatch(m)}
                        className="cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-card px-4 py-3.5 transition hover:border-primary/50"
                      >
                        <div className="truncate text-right">
                          <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                          <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                            {m.homeScore !== null ? `${m.homeScore} – ${m.awayScore}` : 'vs'}
                          </div>
                          <StatusBadge status={m.status} />
                        </div>

                        <div className="truncate">
                          <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                          <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                        </div>
                      </div>
                    ))}
                    {myUpcomingMatches.length === 0 && (
                      <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No upcoming fixtures right now.
                      </p>
                    )}
                  </div>
                </section>

                {/* Results preview glance */}
                {myCompletedMatches.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Recent Results
                      </h2>
                      <button
                        onClick={() => setPlayerSidebarTab('results')}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        All results ({myCompletedMatches.length}) →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {myCompletedMatches.slice(0, 3).map((m) => {
                        const iWon = (m.homeParticipant.userId === currentUser.id && (m.homeScore ?? 0) > (m.awayScore ?? 0))
                          || (m.awayParticipant.userId === currentUser.id && (m.awayScore ?? 0) > (m.homeScore ?? 0));
                        const isDraw = m.homeScore === m.awayScore;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleOpenMatch(m)}
                            className={cn(
                              'cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border bg-card px-4 py-3 transition hover:border-primary/50',
                              iWon ? 'border-primary/30' : isDraw ? 'border-border' : 'border-destructive/20'
                            )}
                          >
                            <div className="truncate text-right">
                              <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                              <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                                {m.homeScore} – {m.awayScore}
                              </div>
                              <span className={cn(
                                'text-[10px] font-bold uppercase tracking-wider',
                                iWon ? 'text-primary' : isDraw ? 'text-muted-foreground' : 'text-destructive'
                              )}>
                                {iWon ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                              </span>
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                              <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* TAB: FIXTURES */}
            {playerSidebarTab === 'fixtures' && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  All Scheduled Fixtures ({myUpcomingMatches.length})
                </h2>

                <div className="space-y-3">
                  {myUpcomingMatches.length > 0 ? myUpcomingMatches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleOpenMatch(m)}
                      className="cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-card px-4 py-3.5 transition hover:border-primary/50"
                    >
                      <div className="truncate text-right">
                        <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                        <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                          {m.homeScore !== null ? `${m.homeScore} – ${m.awayScore}` : 'vs'}
                        </div>
                        <StatusBadge status={m.status} />
                      </div>

                      <div className="truncate">
                        <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                        <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                      No upcoming fixtures right now. Join or wait for next round fixtures!
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB: RESULTS */}
            {playerSidebarTab === 'results' && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Full Match History ({myCompletedMatches.length})
                </h2>

                <div className="space-y-3">
                  {myCompletedMatches.length > 0 ? myCompletedMatches.map((m) => {
                    const iWon = (m.homeParticipant.userId === currentUser.id && (m.homeScore ?? 0) > (m.awayScore ?? 0))
                      || (m.awayParticipant.userId === currentUser.id && (m.awayScore ?? 0) > (m.homeScore ?? 0));
                    const isDraw = m.homeScore === m.awayScore;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleOpenMatch(m)}
                        className={cn(
                          'cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border bg-card px-4 py-3 transition hover:border-primary/50',
                          iWon ? 'border-primary/30' : isDraw ? 'border-border' : 'border-destructive/20'
                        )}
                      >
                        <div className="truncate text-right">
                          <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                          <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                            {m.homeScore} – {m.awayScore}
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold uppercase tracking-wider',
                            iWon ? 'text-primary' : isDraw ? 'text-muted-foreground' : 'text-destructive'
                          )}>
                            {iWon ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                          </span>
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                          <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                      <History className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                      No completed matches recorded yet.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB: PROFILE / CARD */}
            {playerSidebarTab === 'profile' && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-lg bg-primary/20 border border-primary/30 text-primary grid place-items-center font-display text-4xl shadow-glow">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="font-display text-3xl">{currentUser.name}</h2>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Ranked #{usersList.findIndex((u) => u.id === currentUser.id) + 1 || 1}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">@{currentUser.username} · {currentUser.email}</p>
                    <div className="text-xs text-muted-foreground pt-1">
                      Resident of <span className="font-semibold text-foreground">{currentUser.hostelBlock}</span>, Room <span className="font-semibold text-foreground">{currentUser.roomNumber}</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                    <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">ELO Rating</div>
                    <div className="font-display text-4xl text-primary">{currentUser.eloRating}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {currentUser.hostelBlock || (currentUser as any).hostelName || 'Hostel'} Competitive Tier
                    </div>
                  </div>
                </div>

                {currentUser.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-md border border-border bg-card space-y-1">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">Win Rate</div>
                      <div className="font-display text-2xl text-foreground">
                        {Math.round((currentUser.stats.wins / currentUser.stats.matchesPlayed) * 100)}%
                      </div>
                      <div className="text-[11px] text-muted-foreground">{currentUser.stats.wins} wins out of {currentUser.stats.matchesPlayed}</div>
                    </div>

                    <div className="p-4 rounded-md border border-border bg-card space-y-1">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">Goals per Match</div>
                      <div className="font-display text-2xl text-foreground">
                        {(currentUser.stats.goalsScored / currentUser.stats.matchesPlayed).toFixed(1)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{currentUser.stats.goalsScored} goals scored</div>
                    </div>

                    <div className="p-4 rounded-md border border-border bg-card space-y-1">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">Goals Conceded</div>
                      <div className="font-display text-2xl text-foreground">
                        {currentUser.stats.goalsConceded}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{(currentUser.stats.goalsConceded / currentUser.stats.matchesPlayed).toFixed(1)} conceded/match</div>
                    </div>

                    <div className="p-4 rounded-md border border-border bg-card space-y-1">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">Finals Reached</div>
                      <div className="font-display text-2xl text-accent">
                        {currentUser.stats.finalsReached}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{currentUser.stats.tournamentsWon} trophies won</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* VIEW: HOME (For Spectators and Players) */}
      {currentView === 'home' && currentUser.role !== 'ADMIN' && (
        <div className="flex-1">
          {/* Lovable Hero Section */}
          <section className="bg-pitch relative overflow-hidden border-b border-border">
            <div className="mx-auto max-w-7xl px-4 py-12 md:py-24 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
              <div className="flex-1 w-full">
                {/* On mobile: Headline & Trophy side by side */}
                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                      <img src="/FC-26-Logo-Football-Video-game-8432.png" alt="FC 26" className="h-3.5 w-auto" />
                      <span>Hostel League Arena</span>
                    </div>
                    <h1 className="font-display mt-2 sm:mt-4 max-w-4xl text-4xl sm:text-7xl md:text-8xl leading-[0.95]">
                      One hostel.
                      <br />
                      Many players.
                      <br />
                      <span className="text-primary">One champion.</span>
                    </h1>
                  </div>

                  {/* Trophy next to hero text on mobile */}
                  <div className="md:hidden relative shrink-0 flex items-center justify-center w-28 h-32 sm:w-44 sm:h-48">
                    <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
                    <img
                      src="/UEFA-Champions-League-Trophy-Cup-44187.png"
                      alt="Champions Trophy"
                      className="relative z-10 max-h-32 sm:max-h-48 w-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] animate-pulse"
                    />
                  </div>
                </div>

                <p className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Join tournaments, pick your club, report results and settle once and for all who runs the hostel.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => setCurrentView('tournaments')}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-7 text-sm font-bold text-primary-foreground shadow-glow transition hover:bg-primary/90"
                  >
                    Browse tournaments
                  </button>
                  <button
                    onClick={() => setCurrentView('leaderboard')}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background/50 px-7 text-sm font-semibold text-foreground transition hover:bg-accent/10 hover:border-accent"
                  >
                    See rankings
                  </button>
                  {currentUser.role === 'SPECTATOR' && (
                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setIsAuthModalOpen(true);
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-md bg-accent text-accent-foreground px-6 text-sm font-bold shadow transition hover:bg-accent/90"
                    >
                      Register as Competitor
                    </button>
                  )}
                </div>
              </div>

              {/* Hero Trophy Showcase Graphic (Desktop md and up) */}
              <div className="hidden md:flex relative shrink-0 items-center justify-center w-72 h-72 lg:w-84 lg:h-84">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
                <img
                  src="/UEFA-Champions-League-Trophy-Cup-44187.png"
                  alt="Champions Trophy"
                  className="relative z-10 max-h-72 w-auto object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] animate-pulse"
                />
              </div>
            </div>
          </section>

          {/* Lovable Main Content Grid */}
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-3">
            {/* Left 2 Columns */}
            <div className="space-y-8 lg:col-span-2">
              {/* Matchday Centre */}
              <section>
                <h2 className="font-display mb-4 flex items-center gap-2 text-2xl uppercase tracking-wider">
                  <Swords className="h-5 w-5 text-primary" />
                  MATCHDAY CENTRE
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Latest Results */}
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Latest results
                    </div>
                    <div className="space-y-2">
                      {completedMatches.length > 0 ? (
                        completedMatches.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleOpenMatch(m)}
                            className="cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition hover:border-primary/50"
                          >
                            <div className="truncate text-right">
                              <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                              <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                              <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                                {m.homeScore} – {m.awayScore}
                              </div>
                              <StatusBadge status={m.status} />
                            </div>

                            <div className="truncate">
                              <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                              <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No results yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Up Next / Awaiting */}
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Up next / awaiting
                    </div>
                    <div className="space-y-2">
                      {upcomingMatches.length > 0 ? (
                        upcomingMatches.map((m) => {
                          const hasScore = m.homeScore !== null && m.awayScore !== null;
                          return (
                            <div
                              key={m.id}
                              onClick={() => handleOpenMatch(m)}
                              className="cursor-pointer grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition hover:border-primary/50"
                            >
                              <div className="truncate text-right">
                                <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                                <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                              </div>

                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={cn(
                                    'font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg',
                                    hasScore && 'text-primary'
                                  )}
                                >
                                  {hasScore ? `${m.homeScore} – ${m.awayScore}` : 'vs'}
                                </div>
                                <StatusBadge status={m.status} />
                              </div>

                              <div className="truncate">
                                <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                                <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No upcoming matches.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Active Competitions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl uppercase tracking-wider">ACTIVE COMPETITIONS</h2>
                  <button
                    onClick={() => setCurrentView('tournaments')}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    View all →
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {tournaments.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setCurrentView('tournaments')}
                      className="cursor-pointer rounded-md border border-border bg-card p-5 hover:border-primary/50 transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display text-xl group-hover:text-primary transition-colors">
                          {t.title}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {FORMAT_LABELS[t.format] || t.format.replace('_', ' ')}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <span>{t.approvedParticipantsCount ?? t.currentParticipantsCount ?? t.participantsCount ?? 0} / {t.maxParticipants} players</span>
                        <span>{t.prizePool ? `Prize: ${t.prizePool}` : 'Hostel Championship Trophy'}</span>
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <div className="col-span-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No active competitions currently open. Check back soon or register as a player to join upcoming tournaments!
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="space-y-8">
              {/* Active Championship / Latest Champion Card */}
              <div className="relative overflow-hidden rounded-md border border-accent/40 bg-accent/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <img src="/Kings-League-Golden-Crown-7845498.png" alt="Golden Crown" className="h-5 w-auto" />
                    {completedTournament ? 'Latest Champion' : 'Championship Arena'}
                  </div>
                  <img src="/Ballon-dOr-Trophy-78415.png" alt="Golden Ball" className="h-7 w-auto drop-shadow" />
                </div>
                <div className="font-display mt-2 text-2xl sm:text-3xl tracking-wide">
                  {completedTournament
                    ? completedTournament.adminName || 'Reigning Champion'
                    : (activeTournament?.title || 'Hostel FC Tournament')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {completedTournament
                    ? completedTournament.title
                    : activeTournament
                    ? `${activeTournament.approvedParticipantsCount ?? activeTournament.participantsCount ?? activeTournament.maxParticipants} players competing · In Progress`
                    : 'Registration and tournaments will appear here.'}
                </div>
              </div>

              {/* Top of the Hostel */}
              <div className="rounded-md border border-border bg-card p-5">
                <div className="font-display mb-3 text-xl uppercase tracking-wider flex items-center justify-between">
                  <span>TOP OF THE HOSTEL</span>
                  <button
                    onClick={() => setCurrentView('leaderboard')}
                    className="text-xs font-sans font-semibold text-primary hover:underline"
                  >
                    Full table
                  </button>
                </div>
                {usersList.filter((u) => u.role !== 'ADMIN').length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No competitors registered yet. Be the first to join!
                  </p>
                ) : (
                  <ol className="space-y-2.5">
                    {usersList
                      .filter((u) => u.role !== 'ADMIN')
                      .slice(0, 5)
                      .map((user, idx) => (
                      <li key={user.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4 text-right">
                            {idx + 1}
                          </span>
                          <span
                            onClick={() => {
                              const fullUser = usersList.find((u) => u.id === user.id) || user;
                              setSelectedPlayerProfile(fullUser);
                            }}
                            className="font-semibold hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            {user.username}
                            <span className="text-[10px] text-muted-foreground hover:text-primary">👤</span>
                          </span>
                        </div>
                        <span className="font-display text-primary text-base">
                          {user.eloRating}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Announcements Card */}
              <div className="rounded-md border border-border bg-card p-5">
                <div className="font-display mb-3 flex items-center justify-between text-xl uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" /> ANNOUNCEMENTS
                  </span>
                </div>
                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((a) => (
                      <div key={a.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-semibold text-sm text-foreground">{a.title}</div>
                          {a.badge && (
                            <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded text-primary font-bold">
                              {a.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                        <div className="text-[10px] text-muted-foreground pt-0.5">
                          {a.authorName ? `By ${a.authorName} · ` : 'Official Notice · '}
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No announcements published yet.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* VIEW: TOURNAMENTS */}
      {currentView === 'tournaments' && (
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Competitions
              </div>
              <h1 className="font-display text-4xl md:text-5xl tracking-wide">Tournaments</h1>
            </div>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow transition hover:bg-primary/90 gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Create Tournament
              </button>
            )}
          </div>

          {tournaments.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="font-display text-2xl">No Tournaments Published</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No competitions have been created yet. Check back soon for the next championship announcement.
              </p>
            </div>
          )}

          {/* Grouped by Status */}
          {['REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'].map((statusKey) => {
            const list = tournaments.filter(
              (t) => t.status === statusKey || (statusKey === 'IN_PROGRESS' && ((t.status as string) === 'active'))
            );
            if (!list.length) return null;

            const sectionTitles: Record<string, string> = {
              REGISTRATION_OPEN: 'Registration open',
              IN_PROGRESS: 'Live now',
              COMPLETED: 'Completed',
            };

            return (
              <section key={statusKey} className="space-y-4">
                <h2 className="font-display text-2xl tracking-wide text-foreground">
                  {sectionTitles[statusKey]}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setDetailModalTournament(t)}
                      className="cursor-pointer rounded-md border border-border bg-card p-5 transition hover:border-primary/50 space-y-3 relative overflow-hidden"
                    >
                      {/* Trophy Silhouette Watermark */}
                      <img
                        src={
                          t.id === 1
                            ? '/UEFA-Champions-League-Trophy-Cup-44187.png'
                            : t.id === 2
                            ? '/UEFA-Nations-League-trophy-transparent-PNG-image.png'
                            : '/CONCACAF-Gold-Cup-Trophy-77.png'
                        }
                        alt="Trophy Watermark"
                        className="absolute right-2 -bottom-2 h-20 w-auto opacity-10 pointer-events-none object-contain"
                      />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              t.id === 1
                                ? '/UEFA-Champions-League-Logo-89564.png'
                                : t.id === 2
                                ? '/UEFA-Nations-League-trophy-transparent-PNG-image.png'
                                : '/CONCACAF-Gold-Cup-Trophy-77.png'
                            }
                            alt="Logo"
                            className="h-6 w-auto shrink-0 object-contain drop-shadow"
                          />
                          <div className="font-display text-2xl tracking-wide hover:text-primary transition-colors">
                            {t.title}
                          </div>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {t.description}
                      </div>
                      <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground border-t border-border/60">
                        <span>{FORMAT_LABELS[t.format] || t.format}</span>
                        <span>{t.currentParticipantsCount} / {t.maxParticipants} players</span>
                        <span>{t.teamSelectionRule}</span>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalTournament(t);
                          }}
                          className="text-xs text-primary font-bold hover:underline py-1"
                        >
                          View Details & Rules →
                        </button>

                        {/* Join / Register Button for Registration Open Tournaments */}
                        {t.status === 'REGISTRATION_OPEN' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentUser.role === 'SPECTATOR') {
                                setAuthModalMode('register');
                                setIsAuthModalOpen(true);
                                return;
                              }
                              setRegisterModalTournament(t);
                            }}
                            className="py-1.5 px-3 rounded bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition shadow"
                          >
                            Join & Pick Club
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Interactive Knockout Bracket & Standings Switcher */}
          {tournaments.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl tracking-wide">
                  {tournaments[0]?.title || 'Championship Tournament'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {tournaments[0]?.description || 'Live Tournament Stage & Progression Tracker'}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-lg bg-secondary p-1 border border-border">
                <button
                  onClick={() => setTournamentTab('bracket')}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition',
                    tournamentTab === 'bracket' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Knockout Bracket
                </button>
                <button
                  onClick={() => setTournamentTab('standings')}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition',
                    tournamentTab === 'standings' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Group Standings
                </button>
              </div>
            </div>

            {/* TAB: INTERACTIVE KNOCKOUT BRACKET */}
            {tournamentTab === 'bracket' && (
              <div className="rounded-lg border border-border bg-card p-6 overflow-x-auto">
                <div className="min-w-[760px] grid grid-cols-3 gap-8 relative">
                  {/* QUARTER-FINALS COLUMN */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-primary" /> Quarter-Finals (Round of 8)
                    </div>

                    <div className="space-y-4">
                      {matches.filter((m) => m.stage === 'Quarter-Finals').map((m) => {
                        const isHomeWinner = (m.homeScore ?? -1) > (m.awayScore ?? -1);
                        const isAwayWinner = (m.awayScore ?? -1) > (m.homeScore ?? -1);

                        return (
                          <div
                            key={m.id}
                            onClick={() => handleOpenMatch(m)}
                            className="cursor-pointer rounded-md border border-border bg-secondary/40 p-3 hover:border-primary/50 transition space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Match #{m.matchNumber ?? m.id}</span>
                              <StatusBadge status={m.status} />
                            </div>

                            <div className="space-y-1">
                              <div className={cn(
                                'flex items-center justify-between px-2 py-1 rounded text-xs',
                                isHomeWinner ? 'bg-primary/20 text-foreground font-bold' : 'text-muted-foreground'
                              )}>
                                <span className="truncate">{m.homeParticipant.userName} ({m.homeParticipant.teamName})</span>
                                <span className="font-display text-sm">{m.homeScore ?? '-'}</span>
                              </div>
                              <div className={cn(
                                'flex items-center justify-between px-2 py-1 rounded text-xs',
                                isAwayWinner ? 'bg-primary/20 text-foreground font-bold' : 'text-muted-foreground'
                              )}>
                                <span className="truncate">{m.awayParticipant.userName} ({m.awayParticipant.teamName})</span>
                                <span className="font-display text-sm">{m.awayScore ?? '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SEMI-FINALS COLUMN */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-primary" /> Semi-Finals (Final Four)
                    </div>

                    <div className="space-y-12 pt-6">
                      {matches.filter((m) => m.stage === 'Semi-Finals').map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleOpenMatch(m)}
                          className="cursor-pointer rounded-md border border-border bg-secondary/40 p-3 hover:border-primary/50 transition space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>SF #{m.matchNumber ?? m.id}</span>
                            <StatusBadge status={m.status} />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-2 py-1 rounded text-xs text-foreground font-semibold">
                              <span className="truncate">{m.homeParticipant.userName}</span>
                              <span className="font-display text-sm text-primary">{m.homeScore ?? 'vs'}</span>
                            </div>
                            <div className="flex items-center justify-between px-2 py-1 rounded text-xs text-foreground font-semibold">
                              <span className="truncate">{m.awayParticipant.userName}</span>
                              <span className="font-display text-sm text-primary">{m.awayScore ?? ''}</span>
                            </div>
                          </div>
                          {m.scheduledTime && (
                            <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {m.scheduledTime}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FINAL CHAMPIONSHIP COLUMN */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent border-b border-border pb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <img src="/Kings-League-Golden-Crown-7845498.png" alt="Crown" className="h-4 w-auto" />
                        Grand Championship Final
                      </span>
                      <img src="/UEFA-Champions-League-Trophy-Cup-44187.png" alt="Cup" className="h-5 w-auto" />
                    </div>

                    <div className="pt-10 flex flex-col items-center">
                      <img
                        src="/UEFA-Champions-League-Trophy-Cup-44187.png"
                        alt="Trophy"
                        className="h-20 w-auto object-contain filter drop-shadow mb-3 animate-bounce"
                        style={{ animationDuration: '3s' }}
                      />
                      {matches.filter((m) => m.stage === 'Final').map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleOpenMatch(m)}
                          className="w-full cursor-pointer rounded-lg border-2 border-accent/40 bg-accent/5 p-4 hover:border-accent transition space-y-3 shadow-glow"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-accent">
                            <span className="flex items-center gap-1">
                              <img src="/UEFA-Champions-League-Logo-89564.png" alt="UCL" className="h-3.5 w-auto" />
                              Cup Final
                            </span>
                            <StatusBadge status={m.status} />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-card text-xs font-bold text-foreground">
                              <span>{m.homeParticipant.userName}</span>
                              <span className="font-display text-sm text-accent">{m.homeScore ?? 'vs'}</span>
                            </div>
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-card text-xs font-bold text-foreground">
                              <span>{m.awayParticipant.userName}</span>
                              <span className="font-display text-sm text-accent">{m.awayScore ?? ''}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground text-center pt-1">
                            Hostel Common Room · Live Console Showcase
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GROUP STANDINGS */}
            {tournamentTab === 'standings' && (
              <div className="space-y-8">
                {[
                  { label: 'Group A', data: groupAStandings },
                  { label: 'Group B', data: groupBStandings },
                ].map(({ label, data }) => (
                  <div key={label} className="space-y-3">
                    <h3 className="font-display text-xl tracking-wide text-primary">{label}</h3>
                    <div className="overflow-x-auto rounded-md border border-border bg-card">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/60 border-b border-border text-xs uppercase font-bold text-muted-foreground tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Pos</th>
                            <th className="py-3 px-4">Player &amp; Club</th>
                            <th className="py-3 px-3 text-center">P</th>
                            <th className="py-3 px-3 text-center">W</th>
                            <th className="py-3 px-3 text-center">D</th>
                            <th className="py-3 px-3 text-center">L</th>
                            <th className="py-3 px-3 text-center">GF</th>
                            <th className="py-3 px-3 text-center">GA</th>
                            <th className="py-3 px-3 text-center">GD</th>
                            <th className="py-3 px-4 text-center font-bold text-primary">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {data.map((s, idx) => (
                            <tr
                              key={s.id}
                              className={cn(
                                'hover:bg-secondary/30 transition-colors',
                                idx === 1 && 'border-b-2 border-dashed border-primary/20'
                              )}
                            >
                              <td className="py-3 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{s.participantName}</div>
                                <div className="text-xs text-muted-foreground">{s.teamName}</div>
                              </td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.played}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.won}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.drawn}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.lost}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.goalsFor}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground">{s.goalsAgainst}</td>
                              <td className="py-3 px-3 text-center font-bold text-foreground">
                                {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                              </td>
                              <td className="py-3 px-4 text-center font-display text-lg text-primary">
                                {s.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Top 2 from each group advance to Quarter-Finals. · Dashed line marks qualification boundary.</p>
              </div>
            )}
          </section>
          )}
        </div>
      )}

      {/* VIEW: RANKINGS */}
      {currentView === 'leaderboard' && (
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              All-Time ELO
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide">Rankings</h1>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 border-b border-border text-xs uppercase font-bold text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-3 text-center">Played</th>
                  <th className="py-3 px-3 text-center">W / D / L</th>
                  <th className="py-3 px-3 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-center font-bold text-primary">ELO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...usersList]
                  .filter((u) => u.role !== 'ADMIN')
                  .sort((a, b) => b.eloRating - a.eloRating)
                  .map((user, idx) => {
                    const rate = user.stats && user.stats.matchesPlayed > 0
                      ? Math.round((user.stats.wins / user.stats.matchesPlayed) * 100)
                      : 0;

                    return (
                      <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-muted-foreground">
                          {idx === 0 ? (
                            <span className="flex items-center gap-1 text-accent">
                              <img src="/Kings-League-Golden-Crown-7845498.png" alt="1st" className="h-4 w-auto inline" />
                              1
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <button
                            type="button"
                            onClick={() => setSelectedPlayerProfile(user)}
                            className="text-left font-semibold hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{user.name}</span>
                            {idx === 0 && (
                              <img src="/Ballon-dOr-Trophy-78415.png" alt="MVP" className="h-4 w-auto inline drop-shadow" title="Top Ranked Leader" />
                            )}
                            {user.id === currentUser.id && (
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </button>
                          <div className="text-xs text-muted-foreground font-normal">@{user.username}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.hostelBlock} • Room {user.roomNumber}
                        </td>
                        <td className="py-3 px-3 text-center text-muted-foreground">
                          {user.stats?.matchesPlayed ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center text-muted-foreground">
                          {user.stats ? `${user.stats.wins} / ${user.stats.draws} / ${user.stats.losses}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-foreground">{rate}%</td>
                        <td className="py-3 px-4 text-center font-display text-lg text-primary">
                          {user.eloRating}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: HALL OF FAME */}
      {currentView === 'hall-of-fame' && (
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Hostel History
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide">Hall of Fame</h1>
          </div>

          {/* Tournament Champions */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
              <img src="/Kings-League-Golden-Crown-7845498.png" alt="Crown" className="h-6 w-auto" />
              Tournament Champions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Completed tournaments get champion cards */}
              {tournaments.filter((t) => t.status === 'COMPLETED').map((t, i) => (
                <div key={t.id} className={cn(
                  "relative overflow-hidden rounded-md border p-6 space-y-2",
                  i === 0 ? "border-accent/40 bg-accent/10 shadow-glow" : "border-border bg-card"
                )}>
                  <div className="flex items-center justify-between">
                    <img
                      src="/CONCACAF-Gold-Cup-Trophy-77.png"
                      alt="Gold Cup"
                      className="h-10 w-auto object-contain filter drop-shadow"
                    />
                    <img
                      src="/Kings-League-Golden-Crown-7845498.png"
                      alt="Crown"
                      className="h-6 w-auto"
                    />
                  </div>
                  <div className={cn("text-xs uppercase font-bold tracking-wider pt-1", i === 0 ? "text-accent" : "text-muted-foreground")}>
                    {t.title}
                  </div>
                  <div className="font-display text-2xl text-foreground">Championship Trophy</div>
                  <p className="text-xs text-muted-foreground">{t.description?.split('.')[0]}</p>
                </div>
              ))}
              {tournaments.filter((t) => t.status === 'COMPLETED').length === 0 && (
                <div className="relative overflow-hidden rounded-md border border-accent/40 bg-accent/10 shadow-glow p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <img
                      src="/CONCACAF-Gold-Cup-Trophy-77.png"
                      alt="Gold Cup"
                      className="h-10 w-auto object-contain filter drop-shadow"
                    />
                    <img
                      src="/Kings-League-Golden-Crown-7845498.png"
                      alt="Crown"
                      className="h-6 w-auto"
                    />
                  </div>
                  <div className="text-xs uppercase font-bold tracking-wider pt-1 text-accent">
                    Inaugural Championship In Progress
                  </div>
                  <div className="font-display text-2xl text-foreground">
                    {tournaments[0]?.title || 'Championship Cup'}
                  </div>
                  <p className="text-xs text-muted-foreground">The final champion will be crowned and immortalized here upon tournament conclusion.</p>
                </div>
              )}

              {/* Active players with most tournament wins */}
              {usersList
                .filter((u) => (u.stats?.tournamentsWon ?? 0) > 0)
                .sort((a, b) => (b.stats?.tournamentsWon ?? 0) - (a.stats?.tournamentsWon ?? 0))
                .map((u) => (
                  <div key={u.id} className="relative overflow-hidden rounded-md border border-border bg-card p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <img
                        src="/Ballon-dOr-Trophy-78415.png"
                        alt="Ballon d'Or"
                        className="h-9 w-auto object-contain filter drop-shadow"
                      />
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold text-primary">
                        Hall Elite
                      </span>
                    </div>
                    <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground pt-1">
                      {u.stats?.tournamentsWon}× Champion
                    </div>
                    <div className="font-display text-2xl text-foreground">{u.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {u.stats?.matchesPlayed} matches · {u.stats?.wins} wins · ELO {u.eloRating}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          {/* All-time top scorers */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl tracking-wide">All-Time Top Scorers</h2>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/60 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3 text-center">Goals</th>
                    <th className="py-3 px-3 text-center">Matches</th>
                    <th className="py-3 px-3 text-center">Goals/Match</th>
                    <th className="py-3 px-4 text-center">Tournaments Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...usersList]
                    .filter((u) => u.role !== 'ADMIN' && u.stats)
                    .sort((a, b) => (b.stats?.goalsScored ?? 0) - (a.stats?.goalsScored ?? 0))
                    .map((u, idx) => (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">@{u.username} · {u.hostelBlock}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-display text-lg text-primary">{u.stats?.goalsScored}</td>
                        <td className="py-3 px-3 text-center text-muted-foreground">{u.stats?.matchesPlayed}</td>
                        <td className="py-3 px-3 text-center text-muted-foreground">
                          {((u.stats?.goalsScored ?? 0) / (u.stats?.matchesPlayed ?? 1)).toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(u.stats?.tournamentsWon ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-accent font-bold">
                              <Crown className="w-3.5 h-3.5" />{u.stats?.tournamentsWon}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* VIEW: HEAD TO HEAD */}
      {currentView === 'head-to-head' && (
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Rivalries
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide">Head-to-head</h1>
          </div>

          {/* Player selectors */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player 1</label>
              <select
                value={h2hPlayer1Id}
                onChange={(e) => setH2hPlayer1Id(Number(e.target.value))}
                className="w-full rounded bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {allPlayers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player 2</label>
              <select
                value={h2hPlayer2Id}
                onChange={(e) => setH2hPlayer2Id(Number(e.target.value))}
                className="w-full rounded bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {allPlayers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!h2hStats && (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Select two different players to view their head-to-head record.
            </div>
          )}

          {h2hStats && (
            <div className="space-y-6">
              {/* Summary scoreline */}
              <div className="rounded-md border border-border bg-card p-6">
                <div className="grid grid-cols-3 items-center text-center gap-4">
                  <div>
                    <div className="font-display text-2xl">{h2hStats.p1.name}</div>
                    <div className="text-xs text-muted-foreground">@{h2hStats.p1.username}</div>
                    <div className="font-display text-5xl text-primary mt-2">{h2hStats.p1Wins}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Wins</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Head-to-Head</div>
                    <div className="font-display text-xl text-foreground">
                      {h2hStats.draws} Draws
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Goals: {h2hStats.p1Goals} – {h2hStats.p2Goals}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h2hStats.h2hMatches.length} matches played
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-2xl">{h2hStats.p2.name}</div>
                    <div className="text-xs text-muted-foreground">@{h2hStats.p2.username}</div>
                    <div className="font-display text-5xl text-primary mt-2">{h2hStats.p2Wins}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Wins</div>
                  </div>
                </div>

                {/* Win bar */}
                {h2hStats.h2hMatches.length > 0 && (
                  <div className="mt-4">
                    <div className="flex rounded-full overflow-hidden h-2">
                      <div
                        className="bg-primary transition-all"
                        style={{ width: `${(h2hStats.p1Wins / h2hStats.h2hMatches.length) * 100}%` }}
                      />
                      <div
                        className="bg-secondary transition-all"
                        style={{ width: `${(h2hStats.draws / h2hStats.h2hMatches.length) * 100}%` }}
                      />
                      <div
                        className="bg-accent/60 transition-all"
                        style={{ width: `${(h2hStats.p2Wins / h2hStats.h2hMatches.length) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{h2hStats.p1.name.split(' ')[0]}</span>
                      <span>Draws</span>
                      <span>{h2hStats.p2.name.split(' ')[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Match history */}
              {h2hStats.h2hMatches.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="font-display text-xl tracking-wide">Match History</h2>
                  {h2hStats.h2hMatches.map((m) => (
                    <div
                      key={m.id}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
                    >
                      <div className="truncate text-right">
                        <div className="font-semibold text-sm">{m.homeParticipant.userName}</div>
                        <div className="text-xs text-muted-foreground">{m.homeParticipant.teamName}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="font-display min-w-16 rounded bg-secondary px-3 py-1 text-center text-lg text-primary">
                          {m.homeScore} – {m.awayScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{m.stage}</div>
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-sm">{m.awayParticipant.userName}</div>
                        <div className="text-xs text-muted-foreground">{m.awayParticipant.teamName}</div>
                      </div>
                    </div>
                  ))}
                </section>
              ) : (
                <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No completed matches between these two players yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lovable Exact Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground">
        Hostel FC Arena · One hostel. Multiple players. One champion.
      </footer>

      {/* MODAL: Match Result Submission & Opponent Verification */}
      {activeMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Match Result</h3>
                <p className="text-xs text-muted-foreground">
                  {activeMatchModal.stage} • Match #{activeMatchModal.matchNumber ?? activeMatchModal.id}
                </p>
              </div>
              <button
                onClick={() => setActiveMatchModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Preview */}
            <div className="bg-pitch rounded-md border border-border bg-card p-4 space-y-4">
              <div className="flex justify-center">
                <StatusBadge status={activeMatchModal.status} />
              </div>
              <div className="flex items-center justify-between text-center gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{activeMatchModal.homeParticipant.userName}</div>
                  <div className="text-xs text-muted-foreground">{activeMatchModal.homeParticipant.teamName}</div>
                </div>
                <div className="font-display rounded bg-secondary px-4 py-2 text-2xl text-primary">
                  {activeMatchModal.homeScore !== null ? `${activeMatchModal.homeScore} – ${activeMatchModal.awayScore}` : 'vs'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{activeMatchModal.awayParticipant.userName}</div>
                  <div className="text-xs text-muted-foreground">{activeMatchModal.awayParticipant.teamName}</div>
                </div>
              </div>
            </div>

            {/* Admin Official Score Recording (Exclusive to Tournament Director / Admin) */}
            {currentUser.role === 'ADMIN' ? (
              <form onSubmit={handleSubmitScore} className="space-y-4">
                <div className="rounded-md bg-primary/10 border border-primary/30 p-2.5 text-xs text-primary flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" /> Admin Official Scoring Mode
                  </span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Instant Sign-off
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {activeMatchModal.homeParticipant.userName} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={modalHomeScore}
                      onChange={(e) => setModalHomeScore(parseInt(e.target.value) || 0)}
                      className="font-display h-12 w-full rounded bg-secondary text-center text-2xl border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {activeMatchModal.awayParticipant.userName} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={modalAwayScore}
                      onChange={(e) => setModalAwayScore(parseInt(e.target.value) || 0)}
                      className="font-display h-12 w-full rounded bg-secondary text-center text-2xl border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Notes / Extra time details</label>
                  <input
                    type="text"
                    placeholder="e.g. 2-2 FT, won 4-3 on penalties"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMatchModal(null)}
                    className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Record Official Result (Admin)
                  </button>
                </div>
              </form>
            ) : (
              /* Public / Player View: Official Score Notice (Admin enters scores) */
              <div className="space-y-4 pt-1">
                {activeMatchModal.status === 'COMPLETED' ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Official Result Recorded by Tournament Admin
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      Final Score: {activeMatchModal.homeScore} – {activeMatchModal.awayScore}
                    </div>
                    {activeMatchModal.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        &quot;{activeMatchModal.notes}&quot;
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-1">
                      {((activeMatchModal.homeScore ?? 0) > (activeMatchModal.awayScore ?? 0))
                        ? `Winner: ${activeMatchModal.homeParticipant.userName} (${activeMatchModal.homeParticipant.teamName})`
                        : ((activeMatchModal.awayScore ?? 0) > (activeMatchModal.homeScore ?? 0))
                        ? `Winner: ${activeMatchModal.awayParticipant.userName} (${activeMatchModal.awayParticipant.teamName})`
                        : 'Match concluded in a draw'}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Shield className="w-4 h-4" /> Offline Console Match
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This fixture is scheduled for offline play on the hostel console in the Common Room. The Tournament Director will record and verify the official score upon match completion.
                    </p>
                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>Report to the console station 10 minutes prior with your verified controller.</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveMatchModal(null)}
                    className="px-5 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Full Tournament Creator & Logic Engine */}
      <TournamentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserId={currentUser.id}
        onCreated={(newT) => {
          fetchTournaments();
          setActiveAdminTournamentId(newT.id);
          setAdminSidebarTab('approvals');
        }}
      />

      {/* MODAL: Tournament Edit & Settings */}
      {editingTournament && (
        <TournamentEditModal
          tournament={editingTournament}
          isOpen={!!editingTournament}
          onClose={() => setEditingTournament(null)}
          onUpdated={(updatedT) => {
            fetchTournaments();
          }}
          onDeleted={(tId) => {
            fetchTournaments();
          }}
        />
      )}

      {/* MODAL: Player Tournament Registration & Club Pick */}
      {registerModalTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Tournament Registration</h3>
                <p className="text-xs text-muted-foreground">{registerModalTournament.title}</p>
              </div>
              <button
                onClick={() => setRegisterModalTournament(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registrationSuccess ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <div className="font-display text-xl text-foreground">You Are Registered!</div>
                <p className="text-xs text-muted-foreground">{registrationSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterTournament} className="space-y-4">
                <div className="rounded-md bg-secondary/50 border border-border p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Competitor:</span>
                    <span className="font-semibold text-foreground">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostel Name:</span>
                    <span className="font-semibold text-foreground">{currentUser.hostelBlock} • Room {currentUser.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current ELO:</span>
                    <span className="font-bold text-primary">{currentUser.eloRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rule:</span>
                    <span className="font-semibold text-accent">{registerModalTournament.teamSelectionRule} selection</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Select Your FC 26 Team (Club or National Team)
                  </label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    <optgroup label="── Top Club Teams ──">
                      {FC_TEAMS.clubs.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.detail})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── Top National Teams ──">
                      {FC_TEAMS.nationalTeams.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name} ({n.detail})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Team will be registered to your player profile for this competition.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterModalTournament(null)}
                    className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Confirm &amp; Join Cup
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Admin Announcement Publisher */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Publish Announcement</h3>
                <p className="text-xs text-muted-foreground">Broadcast updates to the hostel matchday centre.</p>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semi-Finals Live Streaming in Common Room"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Badge Tag</label>
                <select
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Matchday Update">Matchday Update</option>
                  <option value="Tournament Notice">Tournament Notice</option>
                  <option value="Registration">Registration</option>
                  <option value="Rules Ruling">Rules Ruling</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Content Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the full announcement details, timing, locations, or rules..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full text-xs rounded bg-secondary border border-border p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Admin Schedule Fixture */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Schedule Match Fixture</h3>
                <p className="text-xs text-muted-foreground">Pair two players for a competition stage.</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleFixture} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Home Player</label>
                  <select
                    value={scheduleHomeId}
                    onChange={(e) => setScheduleHomeId(Number(e.target.value))}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    {allPlayers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Away Player</label>
                  <select
                    value={scheduleAwayId}
                    onChange={(e) => setScheduleAwayId(Number(e.target.value))}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    {allPlayers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tournament Stage</label>
                  <select
                    value={scheduleStage}
                    onChange={(e) => setScheduleStage(e.target.value)}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Group Stage">Group Stage</option>
                    <option value="Quarter-Finals">Quarter-Finals</option>
                    <option value="Semi-Finals">Semi-Finals</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Date &amp; Time</label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM"
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  Confirm Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tournament Detail View (Option 2) */}
      {detailModalTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom sm:zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4 gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detailModalTournament.status} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {FORMAT_LABELS[detailModalTournament.format] || detailModalTournament.format}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl tracking-wide">{detailModalTournament.title}</h3>
                <p className="text-xs text-muted-foreground">{detailModalTournament.description}</p>
              </div>
              <button
                onClick={() => setDetailModalTournament(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Participants</span>
                <div className="font-display text-lg text-foreground">
                  {detailModalTournament.currentParticipantsCount} / {detailModalTournament.maxParticipants}
                </div>
              </div>
              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Team Pick Rule</span>
                <div className="font-bold text-foreground truncate">{detailModalTournament.teamSelectionRule}</div>
              </div>
              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Entry Fee</span>
                <div className="font-bold text-accent">{detailModalTournament.entryFee || 'Free'}</div>
              </div>
              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Prize Pool</span>
                <div className="font-bold text-primary truncate">{detailModalTournament.prizePool || 'Trophy'}</div>
              </div>
            </div>

            {/* Rules & Match Settings from PDF */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Competition Rules &amp; Match Settings
              </h4>
              <div className="rounded-md border border-border bg-secondary/30 p-3.5 text-xs text-foreground space-y-2 leading-relaxed">
                <div>{detailModalTournament.rules || 'Standard tournament rules apply.'}</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div>🎮 Half-Length: <span className="font-semibold text-foreground">6 Mins</span></div>
                  <div>🛡️ Defending: <span className="font-semibold text-foreground">Tactical Only</span></div>
                  <div>👥 Squads: <span className="font-semibold text-foreground">Standard Online</span></div>
                  <div>⏱️ Extra Time: <span className="font-semibold text-foreground">Classic + PKs</span></div>
                </div>
              </div>
            </div>

            {/* Registered Participants Roster */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Confirmed Roster Sample
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {allPlayers.slice(0, 6).map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setDetailModalTournament(null);
                      setSelectedPlayerProfile(p);
                    }}
                    className="p-2.5 rounded border border-border bg-card hover:border-primary/40 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground text-[10px] w-3.5">{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-foreground hover:text-primary transition-colors">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.hostelBlock} • Room {p.roomNumber}</div>
                      </div>
                    </div>
                    <span className="font-display text-primary text-sm">{p.eloRating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDetailModalTournament(null)}
                className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
              >
                Close
              </button>
              {detailModalTournament.status === 'REGISTRATION_OPEN' && (
                <button
                  type="button"
                  onClick={() => {
                    const t = detailModalTournament;
                    setDetailModalTournament(null);
                    setRegisterModalTournament(t);
                  }}
                  className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  Register Now →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Player Profile & Trophy Cabinet (Option 3) */}
      {selectedPlayerProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom sm:zoom-in-95">
            {/* Header Player Card */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 text-primary grid place-items-center font-display text-3xl shadow-glow">
                  {selectedPlayerProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-2xl tracking-wide">{selectedPlayerProfile.name}</h3>
                    {selectedPlayerProfile.id === currentUser.id && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{selectedPlayerProfile.username}</p>
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    {selectedPlayerProfile.hostelBlock} · Room {selectedPlayerProfile.roomNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayerProfile(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ELO & Rank Badge */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg border border-border bg-secondary/40 space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">ELO Rating</span>
                <div className="font-display text-3xl text-primary">{selectedPlayerProfile.eloRating}</div>
                <div className="text-[10px] text-muted-foreground">Hostel Ranking Score</div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-secondary/40 space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Hostel Rank</span>
                <div className="font-display text-3xl text-foreground">
                  #{usersList.findIndex((u) => u.id === selectedPlayerProfile.id) + 1 || 1}
                </div>
                <div className="text-[10px] text-muted-foreground">Competitive Tier</div>
              </div>
            </div>

            {/* Trophy Cabinet */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-accent" /> Trophy Cabinet &amp; Honors
                </span>
                <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                  <img src="/Kings-League-Golden-Crown-7845498.png" alt="Crown" className="h-3 w-auto" />
                  Verified Badges
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="relative overflow-hidden p-3 rounded-md border border-accent/40 bg-accent/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-bold text-xs uppercase tracking-wider">Championships</span>
                    <img src="/UEFA-Champions-League-Trophy-Cup-44187.png" alt="Trophy" className="h-7 w-auto drop-shadow" />
                  </div>
                  <div className="font-display text-2xl text-foreground">
                    {selectedPlayerProfile.stats?.tournamentsWon ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Tournament Titles</div>
                </div>
                <div className="relative overflow-hidden p-3 rounded-md border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-xs uppercase tracking-wider">MVP &amp; Finals</span>
                    <img src="/Ballon-dOr-Trophy-78415.png" alt="Ballon d'Or" className="h-7 w-auto drop-shadow" />
                  </div>
                  <div className="font-display text-2xl text-foreground">
                    {selectedPlayerProfile.stats?.finalsReached ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Championship Appearances</div>
                </div>
              </div>
            </div>

            {/* Career Record Breakdown */}
            {selectedPlayerProfile.stats && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-primary" /> Career Record
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-secondary/30 border border-border">
                    <div className="text-muted-foreground text-[10px] font-bold uppercase">Matches</div>
                    <div className="font-display text-lg text-foreground">{selectedPlayerProfile.stats.matchesPlayed}</div>
                  </div>
                  <div className="p-2.5 rounded bg-secondary/30 border border-border">
                    <div className="text-muted-foreground text-[10px] font-bold uppercase">Record (W-D-L)</div>
                    <div className="font-display text-lg text-primary">
                      {selectedPlayerProfile.stats.wins}-{selectedPlayerProfile.stats.draws}-{selectedPlayerProfile.stats.losses}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-secondary/30 border border-border">
                    <div className="text-muted-foreground text-[10px] font-bold uppercase">Win Rate</div>
                    <div className="font-display text-lg text-foreground">
                      {Math.round((selectedPlayerProfile.stats.wins / selectedPlayerProfile.stats.matchesPlayed) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions (Head-to-Head Compare) */}
            <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
              <button
                type="button"
                onClick={() => {
                  setH2hPlayer1Id(currentUser.id);
                  setH2hPlayer2Id(selectedPlayerProfile.id);
                  setSelectedPlayerProfile(null);
                  setCurrentView('head-to-head');
                }}
                className="w-full py-2 px-3 rounded bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5 text-primary" /> Compare Head-to-Head
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlayerProfile(null)}
                className="py-2 px-4 rounded text-xs font-semibold border border-border hover:bg-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
