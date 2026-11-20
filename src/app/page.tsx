'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  Gamepad2,
  Users,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  PlusCircle,
  Eye,
  Send,
  HelpCircle,
  Activity,
  Flame,
  ArrowUpRight,
  TrendingUp,
  X,
  FileCheck,
} from 'lucide-react';
import {
  CURRENT_USER_ADMIN,
  CURRENT_USER_PLAYER,
  CURRENT_USER_SPECTATOR,
  MOCK_LEADERBOARD_USERS,
  MOCK_TOURNAMENTS,
  MOCK_STANDINGS_GROUP_A,
  MOCK_STANDINGS_GROUP_B,
  MOCK_MATCHES,
  MOCK_ANNOUNCEMENTS,
} from '@/lib/mock-data';
import { Match, Tournament, User } from '@/types';

export default function HomePage() {
  // Current active role for testing all perspectives
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER_ADMIN);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'tournaments' | 'leaderboard' | 'disputes'>('matches');
  const [selectedGroup, setSelectedGroup] = useState<'A' | 'B'>('A');

  // Local interactive states
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(
    'Welcome to Hostel FC Arena! Switch roles anytime in the top right to test Player, Admin, and Spectator features.'
  );

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMatchForSubmit, setSelectedMatchForSubmit] = useState<Match | null>(null);
  const [submitHomeScore, setSubmitHomeScore] = useState<number>(0);
  const [submitAwayScore, setSubmitAwayScore] = useState<number>(0);
  const [submitProofUrl, setSubmitProofUrl] = useState<string>('');
  const [submitNotes, setSubmitNotes] = useState<string>('');

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedMatchForDispute, setSelectedMatchForDispute] = useState<Match | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('');

  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [newTourneyTitle, setNewTourneyTitle] = useState('');
  const [newTourneyFormat, setNewTourneyFormat] = useState<'LEAGUE' | 'KNOCKOUT' | 'GROUP_TO_KNOCKOUT'>('GROUP_TO_KNOCKOUT');
  const [newTourneyTeamRule, setNewTourneyTeamRule] = useState<'EXCLUSIVE' | 'UNRESTRICTED' | 'MATCH_BY_MATCH'>('EXCLUSIVE');
  const [newTourneyMaxPlayers, setNewTourneyMaxPlayers] = useState(16);
  const [newTourneyPrize, setNewTourneyPrize] = useState('$50 + Trophy');

  // Handlers for Match Lifecycle
  const handleConfirmMatch = (matchId: number) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'COMPLETED',
            playedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return m;
      })
    );
    setNotificationMsg(`Match #${matchId} confirmed by opponent! Standings and player ELO ratings updated.`);
  };

  const handleOpenSubmitModal = (match: Match) => {
    setSelectedMatchForSubmit(match);
    setSubmitHomeScore(match.homeScore ?? 0);
    setSubmitAwayScore(match.awayScore ?? 0);
    setSubmitProofUrl(match.proofScreenshotUrl ?? '');
    setSubmitNotes('');
    setIsSubmitModalOpen(true);
  };

  const handleSaveSubmittedScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForSubmit) return;

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === selectedMatchForSubmit.id) {
          return {
            ...m,
            homeScore: submitHomeScore,
            awayScore: submitAwayScore,
            submittedHomeScore: submitHomeScore,
            submittedAwayScore: submitAwayScore,
            submittedByUserId: currentUser.id,
            submittedByUserName: currentUser.name,
            proofScreenshotUrl: submitProofUrl || null,
            notes: submitNotes || undefined,
            status: 'PENDING_VERIFICATION',
          };
        }
        return m;
      })
    );
    setIsSubmitModalOpen(false);
    setNotificationMsg(
      `Score (${submitHomeScore} - ${submitAwayScore}) submitted for Match #${selectedMatchForSubmit.id}. Waiting for opponent verification.`
    );
  };

  const handleOpenDisputeModal = (match: Match) => {
    setSelectedMatchForDispute(match);
    setDisputeReason('');
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForDispute) return;

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === selectedMatchForDispute.id) {
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
                reason: disputeReason,
                status: 'OPEN',
                createdAt: 'Just now',
              },
            ],
          };
        }
        return m;
      })
    );
    setIsDisputeModalOpen(false);
    setNotificationMsg(`Match #${selectedMatchForDispute.id} flagged as disputed. Escalated to the Administrator Queue.`);
  };

  const handleResolveDispute = (matchId: number, resolution: 'UPHOLD' | 'RESET') => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          if (resolution === 'UPHOLD') {
            return {
              ...m,
              status: 'COMPLETED',
              disputes: m.disputes?.map((d) => ({ ...d, status: 'RESOLVED' })),
            };
          } else {
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
        }
        return m;
      })
    );
    setNotificationMsg(
      resolution === 'UPHOLD'
        ? `Dispute on Match #${matchId} reviewed and result confirmed as official.`
        : `Dispute on Match #${matchId} reviewed: Score reset. Rematch scheduled!`
    );
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyTitle) return;

    const newTournament: Tournament = {
      id: Date.now(),
      title: newTourneyTitle,
      slug: newTourneyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `New competitive FC 26 tournament with ${newTourneyMaxPlayers} participants.`,
      format: newTourneyFormat,
      status: 'REGISTRATION_OPEN',
      teamSelectionRule: newTourneyTeamRule,
      maxParticipants: newTourneyMaxPlayers,
      currentParticipantsCount: 1,
      prizePool: newTourneyPrize,
      adminId: currentUser.id,
      adminName: currentUser.name,
      startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      rules: 'Standard FC 26 Competitive Rules.',
    };

    setTournaments([newTournament, ...tournaments]);
    setIsCreateTournamentModalOpen(false);
    setNewTourneyTitle('');
    setNotificationMsg(`Tournament "${newTournament.title}" created successfully and registration opened!`);
  };

  const disputedMatchesCount = matches.filter((m) => m.status === 'DISPUTED').length;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Banner Alert */}
      {notificationMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2.5 text-xs sm:text-sm text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Live Status:</span>
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Esports Header */}
      <header className="border-b border-slate-800/80 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#090e17] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Hostel FC Arena
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  FC 26
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                One Hostel. Many Players. One Champion.
              </p>
            </div>
          </div>

          {/* Quick Role Switcher (Essential for Pair Programming & Testing) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 flex items-center text-xs">
              <span className="text-[11px] font-semibold text-slate-400 px-2 hidden md:inline">Role:</span>
              <button
                onClick={() => {
                  setCurrentUser(CURRENT_USER_ADMIN);
                  setNotificationMsg('Switched to Admin Role (Marcus K.). You can resolve disputes, configure rules, and verify results.');
                }}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                👑 Admin
              </button>
              <button
                onClick={() => {
                  setCurrentUser(CURRENT_USER_PLAYER);
                  setNotificationMsg('Switched to Player Role (David Osei - Arsenal). You can report scores and confirm match results.');
                }}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentUser.role === 'PLAYER'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎮 Player
              </button>
              <button
                onClick={() => {
                  setCurrentUser(CURRENT_USER_SPECTATOR);
                  setNotificationMsg('Switched to Spectator Mode. Read-only live fixtures and leaderboard.');
                }}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentUser.role === 'SPECTATOR'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👁️ Spectator
              </button>
            </div>

            {/* Current user badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-300">
              <div className="text-right">
                <div className="font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-[11px] text-emerald-400">{currentUser.hostelBlock} • ELO {currentUser.eloRating}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="border-t border-slate-800/60 bg-[#090e18]/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
            <nav className="flex space-x-1 sm:space-x-2 py-2">
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Match Center</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {matches.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('standings')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'standings'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Standings & Tables</span>
              </button>

              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'tournaments'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Tournaments</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {tournaments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'leaderboard'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Rankings & Hall of Fame</span>
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('disputes')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === 'disputes'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Admin Disputes</span>
                  {disputedMatchesCount > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                      {disputedMatchesCount}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setIsCreateTournamentModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                New Tournament
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tournament Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1626] to-[#0a121f] border border-slate-800 p-6 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> LIVE COMPETITION
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-full">
                  Format: Group Stage → Knockout
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded-full">
                  Team Rule: Exclusive Selection
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hall 4 Winter FC 26 Championship
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                16 hostel players battle for supremacy on EA SPORTS FC 26. Group stages completed — Quarter-Finals now underway!
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-1">
                <div>🏆 Prize: <span className="text-amber-400 font-bold">$80 + Champion Trophy</span></div>
                <div>👥 Participants: <span className="text-slate-200">16 / 16 Confirmed</span></div>
                <div>📍 Venue: <span className="text-slate-200">Hall 4 Common Room PS5 Stations</span></div>
              </div>
            </div>

            {/* Stages Tracker */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 min-w-[280px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tournament Stage
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Group Stage</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>

                <div className="flex items-center justify-between text-emerald-300 pt-1">
                  <span className="font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Quarter-Finals
                  </span>
                  <span className="font-semibold text-emerald-400">In Progress (3/4)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-3/4" />
                </div>

                <div className="flex items-center justify-between text-slate-500 pt-1">
                  <span>Semi-Finals & Grand Final</span>
                  <span>Upcoming (Nov 21-22)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: MATCH CENTER */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  Quarter-Final Fixtures & Results
                </h2>
                <p className="text-xs text-slate-400">
                  Submit scores, confirm opponent submissions, or review disputed outcomes.
                </p>
              </div>
            </div>

            {/* Match Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => {
                const isPending = match.status === 'PENDING_VERIFICATION';
                const isDisputed = match.status === 'DISPUTED';
                const isCompleted = match.status === 'COMPLETED';
                const isScheduled = match.status === 'SCHEDULED';

                return (
                  <div
                    key={match.id}
                    className={`rounded-xl border p-5 transition-all shadow-md ${
                      isDisputed
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : isPending
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : isCompleted
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    {/* Header: Stage & Status Pill */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-slate-400">
                        {match.stage} • Match #{match.matchNumber ?? match.id}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Official Result
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> Opponent Verification Pending
                        </span>
                      )}
                      {isDisputed && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Disputed Match
                        </span>
                      )}
                      {isScheduled && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                          Scheduled: {match.scheduledTime}
                        </span>
                      )}
                    </div>

                    {/* Match Scoreboard */}
                    <div className="space-y-2 py-2">
                      {/* Home Player */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400">
                            {match.homeParticipant.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">
                              {match.homeParticipant.userName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {match.homeParticipant.teamName} • {match.homeParticipant.hostelInfo}
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-black text-white px-3">
                          {match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}
                        </div>
                      </div>

                      {/* Away Player */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                            {match.awayParticipant.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">
                              {match.awayParticipant.userName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {match.awayParticipant.teamName} • {match.awayParticipant.hostelInfo}
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-black text-white px-3">
                          {match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Notes / Submission Info */}
                    {match.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800/50 mt-2 italic">
                        &quot;{match.notes}&quot;
                      </p>
                    )}

                    {/* Disputes Info Box */}
                    {isDisputed && match.disputes && match.disputes.length > 0 && (
                      <div className="mt-3 p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Dispute raised by {match.disputes[0].raisedByUserName}
                        </div>
                        <p className="text-[11px] text-slate-300">{match.disputes[0].reason}</p>
                      </div>
                    )}

                    {/* Interactive Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        {match.playedAt ? `Played: ${match.playedAt}` : 'Venue: PS5 Console #1'}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Player / Admin: Submit Score */}
                        {isScheduled && (
                          <button
                            onClick={() => handleOpenSubmitModal(match)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit Score
                          </button>
                        )}

                        {/* Opponent / Admin: Confirm Result */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleConfirmMatch(match.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm Result
                            </button>
                            <button
                              onClick={() => handleOpenDisputeModal(match)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 text-rose-200 text-xs font-medium transition-all flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Dispute
                            </button>
                          </>
                        )}

                        {/* Admin Action for Disputed Matches */}
                        {isDisputed && currentUser.role === 'ADMIN' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleResolveDispute(match.id, 'UPHOLD')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                            >
                              Uphold Score
                            </button>
                            <button
                              onClick={() => handleResolveDispute(match.id, 'RESET')}
                              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                            >
                              Order Replay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STANDINGS & GROUPS */}
        {activeTab === 'standings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Group Stage Standings
                </h2>
                <p className="text-xs text-slate-400">
                  Automated calculations: Top 2 advance to Quarter-Finals. Tiebreakers: GD → GF → Head-to-Head.
                </p>
              </div>

              {/* Group Selector Toggle */}
              <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  onClick={() => setSelectedGroup('A')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedGroup === 'A'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Group A Table
                </button>
                <button
                  onClick={() => setSelectedGroup('B')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedGroup === 'B'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Group B Table
                </button>
              </div>
            </div>

            {/* League Table Component */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#0b101c] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 sm:px-4">Pos</th>
                    <th className="py-3 px-3 sm:px-4">Player & Club</th>
                    <th className="py-3 px-2 text-center">P</th>
                    <th className="py-3 px-2 text-center">W</th>
                    <th className="py-3 px-2 text-center">D</th>
                    <th className="py-3 px-2 text-center">L</th>
                    <th className="py-3 px-2 text-center">GF</th>
                    <th className="py-3 px-2 text-center">GA</th>
                    <th className="py-3 px-2 text-center">GD</th>
                    <th className="py-3 px-3 sm:px-4 text-center font-black text-emerald-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(selectedGroup === 'A' ? MOCK_STANDINGS_GROUP_A : MOCK_STANDINGS_GROUP_B).map(
                    (standing, idx) => {
                      const isQualifying = idx < 2;
                      return (
                        <tr
                          key={standing.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isQualifying ? 'bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="py-3 px-3 sm:px-4">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                isQualifying
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {standing.participantName}
                              {isQualifying && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20 font-semibold">
                                  Q
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{standing.teamName}</div>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.played}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.won}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.drawn}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.lost}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.goalsFor}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{standing.goalsAgainst}</td>
                          <td
                            className={`py-3 px-2 text-center font-bold ${
                              standing.goalDifference > 0
                                ? 'text-emerald-400'
                                : standing.goalDifference < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-center font-black text-sm text-emerald-400">
                            {standing.points}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
              <div className="p-3 bg-[#0b101c] border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500 inline-block" />
                <span>Positions 1-2 advance directly to Quarter-Finals stage</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOURNAMENTS HUB */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  All Hostel Tournaments
                </h2>
                <p className="text-xs text-slate-400">
                  Leagues, knockout cups, and weekend blitz tournaments across all hostel blocks.
                </p>
              </div>

              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setIsCreateTournamentModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Tournament
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.status === 'IN_PROGRESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'REGISTRATION_OPEN'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{t.format}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Team Selection:</span>
                        <span className="font-semibold text-slate-200">{t.teamSelectionRule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Participants:</span>
                        <span className="font-semibold text-slate-200">
                          {t.currentParticipantsCount} / {t.maxParticipants}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prize Pool:</span>
                        <span className="font-semibold text-amber-400">{t.prizePool ?? 'Trophy'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Admin: {t.adminName}</span>
                    <button
                      onClick={() => {
                        setActiveTab('matches');
                        setNotificationMsg(`Viewing matches for ${t.title}`);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      View Fixtures <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RANKINGS & HALL OF FAME */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                All-Time Hostel Player Rankings (ELO Rating)
              </h2>
              <p className="text-xs text-slate-400">
                Calculated across all sanctioned hostel tournaments and verified matches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                    🥇
                  </div>
                  <div>
                    <div className="text-xs text-amber-400 font-semibold uppercase">Current #1 Champion</div>
                    <div className="font-bold text-white text-base">Tariq Al-Mansoor</div>
                    <div className="text-xs text-slate-400">Hall 4 • ELO 1540 (4 Titles)</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-black">
                    🥈
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Runner Up</div>
                    <div className="font-bold text-white text-base">Marcus K.</div>
                    <div className="text-xs text-slate-400">Hall 4 • ELO 1480 (3 Titles)</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-800/40 bg-slate-900 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-700/40 flex items-center justify-center text-amber-600 font-black">
                    🥉
                  </div>
                  <div>
                    <div className="text-xs text-amber-600 font-semibold uppercase">3rd Place</div>
                    <div className="font-bold text-white text-base">David Osei</div>
                    <div className="text-xs text-slate-400">Hall 4 • ELO 1395 (1 Title)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#0b101c] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3">Hostel</th>
                    <th className="py-3 px-3 text-center">Played</th>
                    <th className="py-3 px-3 text-center">W / D / L</th>
                    <th className="py-3 px-3 text-center">Win %</th>
                    <th className="py-3 px-3 text-center">Trophies</th>
                    <th className="py-3 px-4 text-center font-black text-emerald-400">ELO Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {MOCK_LEADERBOARD_USERS.map((user, idx) => {
                    const winPercent = user.stats
                      ? Math.round((user.stats.wins / user.stats.matchesPlayed) * 100)
                      : 0;

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-300">#{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            {user.name}
                            {user.id === currentUser.id && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">@{user.username}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {user.hostelBlock} • {user.roomNumber}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300">
                          {user.stats?.matchesPlayed ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300">
                          {user.stats ? `${user.stats.wins} / ${user.stats.draws} / ${user.stats.losses}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                          {winPercent}%
                        </td>
                        <td className="py-3 px-3 text-center text-amber-400 font-bold">
                          🏆 {user.stats?.tournamentsWon ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm text-emerald-400">
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

        {/* TAB 5: ADMIN DISPUTES */}
        {activeTab === 'disputes' && currentUser.role === 'ADMIN' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Tournament Dispute Desk (Admin Only)
              </h2>
              <p className="text-xs text-slate-400">
                Review contested scores, analyze player statements, and issue official rulings.
              </p>
            </div>

            {disputedMatchesCount === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <div className="font-bold text-white">No active disputes!</div>
                <div className="text-xs">All matches are either verified or progressing smoothly.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) => m.status === 'DISPUTED')
                  .map((match) => (
                    <div
                      key={match.id}
                      className="rounded-xl border border-rose-500/40 bg-slate-900 p-5 space-y-4 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                            Match #{match.id} • {match.stage}
                          </div>
                          <div className="font-bold text-white text-base">
                            {match.homeParticipant.userName} ({match.homeParticipant.teamName}) vs{' '}
                            {match.awayParticipant.userName} ({match.awayParticipant.teamName})
                          </div>
                        </div>
                        <div className="text-sm font-black text-white bg-slate-950 px-3 py-1 rounded border border-slate-800">
                          Reported: {match.homeScore} - {match.awayScore}
                        </div>
                      </div>

                      {match.disputes?.map((d) => (
                        <div key={d.id} className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3 text-xs space-y-1">
                          <div className="font-bold text-rose-300">
                            Raised by {d.raisedByUserName} ({d.createdAt}):
                          </div>
                          <p className="text-slate-200 italic">&quot;{d.reason}&quot;</p>
                        </div>
                      ))}

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleResolveDispute(match.id, 'RESET')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          Reset & Order Rematch
                        </button>
                        <button
                          onClick={() => handleResolveDispute(match.id, 'UPHOLD')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                        >
                          Uphold Reported Score
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: Submit Score */}
      {isSubmitModalOpen && selectedMatchForSubmit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Submit Match Result</h3>
                <p className="text-xs text-slate-400">Match #{selectedMatchForSubmit.id} • {selectedMatchForSubmit.stage}</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmittedScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 truncate block">
                    {selectedMatchForSubmit.homeParticipant.userName}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={submitHomeScore}
                    onChange={(e) => setSubmitHomeScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 truncate block">
                    {selectedMatchForSubmit.awayParticipant.userName}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={submitAwayScore}
                    onChange={(e) => setSubmitAwayScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Proof Screenshot Link (Optional / Cloudinary)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={submitProofUrl}
                  onChange={(e) => setSubmitProofUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Notes / Extra Time Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Ended 2-2 in extra time, won 4-3 on penalties."
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Raise Dispute */}
      {isDisputeModalOpen && selectedMatchForDispute && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Flag Match Dispute
                </h3>
                <p className="text-xs text-slate-400">Match #{selectedMatchForDispute.id}</p>
              </div>
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  State the reason for this dispute:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g., Reported score was 3-1 but actual match ended 1-1, or controller disconnected..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
                >
                  Escalate to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Tournament (Admin) */}
      {isCreateTournamentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Create New Competition</h3>
                <p className="text-xs text-slate-400">Configure tournament format, restrictions, and rules.</p>
              </div>
              <button
                onClick={() => setIsCreateTournamentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hall 4 Spring Blitz Cup"
                  value={newTourneyTitle}
                  onChange={(e) => setNewTourneyTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Format</label>
                  <select
                    value={newTourneyFormat}
                    onChange={(e) => setNewTourneyFormat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GROUP_TO_KNOCKOUT">Group Stage → Knockout</option>
                    <option value="KNOCKOUT">Straight Knockout</option>
                    <option value="LEAGUE">Round-Robin League</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Team Selection Rule</label>
                  <select
                    value={newTourneyTeamRule}
                    onChange={(e) => setNewTourneyTeamRule(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="EXCLUSIVE">Exclusive (1 Player per Club)</option>
                    <option value="UNRESTRICTED">Unrestricted</option>
                    <option value="MATCH_BY_MATCH">Match-by-Match Pick</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Max Participants</label>
                  <input
                    type="number"
                    min="4"
                    max="64"
                    value={newTourneyMaxPlayers}
                    onChange={(e) => setNewTourneyMaxPlayers(parseInt(e.target.value) || 16)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Prize Pool</label>
                  <input
                    type="text"
                    value={newTourneyPrize}
                    onChange={(e) => setNewTourneyPrize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTournamentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Launch Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090e18] py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Hostel FC Arena &copy; 2026. Built with Next.js, TypeScript & Neon PostgreSQL.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Current Session: <span className="text-emerald-400 font-semibold">{currentUser.name}</span> ({currentUser.role})
          </div>
        </div>
      </footer>
    </div>
  );
}
