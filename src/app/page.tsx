'use client';

import React, { useState } from 'react';
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
  ChevronRight,
  Shield,
  PlusCircle,
  TrendingUp,
  UserCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  CURRENT_USER_ADMIN,
  CURRENT_USER_PLAYER,
  CURRENT_USER_SPECTATOR,
  MOCK_LEADERBOARD_USERS,
  MOCK_TOURNAMENTS,
  MOCK_STANDINGS_GROUP_A,
  MOCK_MATCHES,
  MOCK_ANNOUNCEMENTS,
} from '@/lib/mock-data';
import { Match, Tournament, User } from '@/types';
import { cn } from '@/lib/utils';

// Exact status mappings from the Lovable prototype
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
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER_ADMIN);
  const [currentView, setCurrentView] = useState<'home' | 'tournaments' | 'leaderboard' | 'hall-of-fame' | 'head-to-head'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tournament and match state
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);

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

  // Latest champion calculation
  const latestChampion = {
    username: 'Tariq Al-Mansoor',
    tournamentName: 'Hostel Weekend Premier League Season 1',
  };

  // Match filters
  const completedMatches = matches.filter(
    (m) => m.status === 'COMPLETED' || (m.homeScore !== null && m.status !== 'PENDING_VERIFICATION' && m.status !== 'DISPUTED')
  );
  const upcomingMatches = matches.filter(
    (m) => m.status === 'SCHEDULED' || m.status === 'PENDING_VERIFICATION' || m.status === 'DISPUTED'
  );

  const handleOpenMatch = (match: Match) => {
    setActiveMatchModal(match);
    setModalHomeScore(match.homeScore ?? 0);
    setModalAwayScore(match.awayScore ?? 0);
    setModalProofUrl(match.proofScreenshotUrl ?? '');
    setModalNotes(match.notes ?? '');
    setIsDisputing(false);
    setDisputeInput('');
  };

  const handleConfirmResult = (matchId: number) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'COMPLETED' } : m))
    );
    if (activeMatchModal?.id === matchId) {
      setActiveMatchModal((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
    }
  };

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchModal) return;

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Demo Bar: Quick Role Switcher for Pair-Programming */}
      <div className="bg-secondary/70 border-b border-border/80 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Viewing as:</span>
          <span className="font-bold text-primary">{currentUser.name}</span>
          <span className="text-[11px] text-muted-foreground">({currentUser.role})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Switch Role:</span>
          <button
            onClick={() => setCurrentUser(CURRENT_USER_ADMIN)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-semibold transition',
              currentUser.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Admin
          </button>
          <button
            onClick={() => setCurrentUser(CURRENT_USER_PLAYER)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-semibold transition',
              currentUser.role === 'PLAYER' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Player
          </button>
          <button
            onClick={() => setCurrentUser(CURRENT_USER_SPECTATOR)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-semibold transition',
              currentUser.role === 'SPECTATOR' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Spectator
          </button>
        </div>
      </div>

      {/* Lovable Exact Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          {/* Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-left group"
          >
            <span className="grid h-9 w-9 place-items-center rounded bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="font-display text-xl tracking-wide">
              Hostel FC <span className="text-primary">Arena</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            <button
              onClick={() => setCurrentView('tournaments')}
              className={cn(
                'text-sm font-semibold uppercase tracking-wide transition-colors',
                currentView === 'tournaments' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tournaments
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={cn(
                'text-sm font-semibold uppercase tracking-wide transition-colors',
                currentView === 'leaderboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Rankings
            </button>
            <button
              onClick={() => setCurrentView('hall-of-fame')}
              className={cn(
                'text-sm font-semibold uppercase tracking-wide transition-colors',
                currentView === 'hall-of-fame' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Hall of Fame
            </button>
            <button
              onClick={() => setCurrentView('head-to-head')}
              className={cn(
                'text-sm font-semibold uppercase tracking-wide transition-colors',
                currentView === 'head-to-head' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Head-to-head
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-sm font-semibold uppercase tracking-wide text-accent hover:text-accent/80 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Cup
              </button>
            )}
          </nav>

          {/* User Status / Action Pill */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-sm font-semibold sm:block">
              <span className="text-foreground">{currentUser.username}</span>{' '}
              <span className="font-display text-primary">{currentUser.eloRating}</span>
            </div>

            <button
              onClick={() => {
                if (currentUser.role === 'ADMIN') setCurrentUser(CURRENT_USER_PLAYER);
                else setCurrentUser(CURRENT_USER_ADMIN);
              }}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {currentUser.role === 'SPECTATOR' ? 'Sign in' : 'Switch account'}
            </button>

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
          </nav>
        )}
      </header>

      {/* VIEW: HOME (The Exact Lovable Landing Experience) */}
      {currentView === 'home' && (
        <div className="flex-1">
          {/* Lovable Hero Section */}
          <section className="bg-pitch relative overflow-hidden border-b border-border">
            <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                FC 26 · Hostel League
              </div>
              <h1 className="font-display mt-4 max-w-4xl text-6xl leading-[0.95] md:text-8xl">
                One hostel.
                <br />
                Many players.
                <br />
                <span className="text-primary">One champion.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Join tournaments, pick your club, report results and settle once and for all who runs the hostel.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('tournaments')}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground shadow-glow transition hover:bg-primary/90"
                >
                  Browse tournaments
                </button>
                <button
                  onClick={() => setCurrentView('leaderboard')}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background/50 px-8 text-sm font-semibold text-foreground transition hover:bg-accent/10 hover:border-accent"
                >
                  See rankings
                </button>
              </div>
            </div>
          </section>

          {/* Lovable Main Content Grid: 2 cols left, 1 col right */}
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-3">
            {/* Left 2 Columns */}
            <div className="space-y-8 lg:col-span-2">
              {/* Matchday Centre */}
              <section>
                <h2 className="font-display mb-4 flex items-center gap-2 text-2xl tracking-wide">
                  <Swords className="h-5 w-5 text-primary" />
                  Matchday centre
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
                  <h2 className="font-display text-2xl tracking-wide">Active competitions</h2>
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
                        {FORMAT_LABELS[t.format] || t.format} · Season 1
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <span>{t.currentParticipantsCount} / {t.maxParticipants} players</span>
                        <span>6 min halves</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="space-y-8">
              {/* Latest Champion Card */}
              <div className="rounded-md border border-accent/40 bg-accent/10 p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                  <Crown className="h-4 w-4" />
                  Latest champion
                </div>
                <div className="font-display mt-2 text-3xl tracking-wide">
                  {latestChampion.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  {latestChampion.tournamentName}
                </div>
              </div>

              {/* Top of the Hostel (Leaderboard summary) */}
              <div className="rounded-md border border-border bg-card p-5">
                <div className="font-display mb-3 text-xl tracking-wide flex items-center justify-between">
                  <span>Top of the hostel</span>
                  <button
                    onClick={() => setCurrentView('leaderboard')}
                    className="text-xs font-sans font-semibold text-primary hover:underline"
                  >
                    Full table
                  </button>
                </div>
                <ol className="space-y-2.5">
                  {MOCK_LEADERBOARD_USERS.slice(0, 5).map((user, idx) => (
                    <li key={user.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-4 text-right">
                          {idx + 1}
                        </span>
                        <span className="font-semibold hover:text-primary transition-colors cursor-pointer">
                          {user.username}
                        </span>
                      </div>
                      <span className="font-display text-primary text-base">
                        {user.eloRating}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Announcements Card */}
              <div className="rounded-md border border-border bg-card p-5">
                <div className="font-display mb-3 flex items-center gap-2 text-xl tracking-wide">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Announcements
                </div>
                <div className="space-y-4">
                  {MOCK_ANNOUNCEMENTS.map((a) => (
                    <div key={a.id} className="space-y-1">
                      <div className="font-semibold text-sm text-foreground">{a.title}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                    </div>
                  ))}
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
                      className="rounded-md border border-border bg-card p-5 transition hover:border-primary/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display text-2xl tracking-wide">{t.title}</div>
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
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Standings Table for Active Tournament */}
          <section className="mt-12 pt-8 border-t border-border space-y-4">
            <h2 className="font-display text-3xl tracking-wide">
              Hall 4 Championship · Group A Table
            </h2>
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 border-b border-border text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Player & Club</th>
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
                  {MOCK_STANDINGS_GROUP_A.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
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
          </section>
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
                {MOCK_LEADERBOARD_USERS.map((user, idx) => {
                  const rate = user.stats
                    ? Math.round((user.stats.wins / user.stats.matchesPlayed) * 100)
                    : 0;

                  return (
                    <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {user.name}{' '}
                        {user.id === currentUser.id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold ml-1">
                            YOU
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground font-normal">@{user.username}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.hostelBlock} • {user.roomNumber}
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
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Hostel History
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">Hall of Fame</h1>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 pt-4">
            <div className="rounded-md border border-accent/40 bg-accent/10 p-6 space-y-2">
              <Crown className="w-8 h-8 text-accent mb-2" />
              <div className="text-xs uppercase font-bold tracking-wider text-accent">Season 1 Champion</div>
              <div className="font-display text-2xl text-foreground">Tariq Al-Mansoor</div>
              <p className="text-xs text-muted-foreground">Hostel Weekend Premier League Season 1</p>
            </div>
            <div className="rounded-md border border-border bg-card p-6 space-y-2">
              <Trophy className="w-8 h-8 text-primary mb-2" />
              <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Blitz Cup Winner</div>
              <div className="font-display text-2xl text-foreground">Marcus K.</div>
              <p className="text-xs text-muted-foreground">Block B Lightning Knockout 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: HEAD TO HEAD */}
      {currentView === 'head-to-head' && (
        <div className="mx-auto max-w-7xl px-4 py-12 flex-1 w-full space-y-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Rivalries
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">Head-to-head</h1>
          <div className="rounded-md border border-border bg-card p-8 text-center max-w-2xl mx-auto space-y-4">
            <Swords className="w-12 h-12 text-primary mx-auto" />
            <h3 className="font-display text-2xl">Compare Any Two Hostel Players</h3>
            <p className="text-sm text-muted-foreground">
              Select two hostel players to view all-time head-to-head records, goal differentials, and tournament showdowns.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <div className="p-3 bg-secondary rounded border border-border text-sm font-semibold">
                Tariq Al-Mansoor
              </div>
              <div className="p-3 bg-secondary rounded border border-border text-sm font-semibold">
                Marcus K.
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground">
              Head-to-head record: <span className="font-bold text-foreground">3 Wins Tariq</span> · <span className="font-bold text-foreground">2 Draws</span> · <span className="font-bold text-foreground">2 Wins Marcus</span>
            </div>
          </div>
        </div>
      )}

      {/* Lovable Exact Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-background">
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

            {/* Score Input Form */}
            {activeMatchModal.status === 'SCHEDULED' && (
              <form onSubmit={handleSubmitScore} className="space-y-4">
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
                    placeholder="e.g. 2-2 FT, won on penalties"
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
                    Submit Score
                  </button>
                </div>
              </form>
            )}

            {/* Verification / Dispute Actions */}
            {activeMatchModal.status === 'PENDING_VERIFICATION' && !isDisputing && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Score was submitted. Opponent confirmation required before standings update.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDisputing(true)}
                    className="px-4 py-2 rounded text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    Raise Dispute
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmResult(activeMatchModal.id)}
                    className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Confirm Result
                  </button>
                </div>
              </div>
            )}

            {/* Dispute Input Field */}
            {isDisputing && (
              <form onSubmit={handleRaiseDispute} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-destructive">Dispute Reason</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain why this reported score is contested..."
                    value={disputeInput}
                    onChange={(e) => setDisputeInput(e.target.value)}
                    className="w-full text-xs rounded bg-secondary border border-destructive/40 p-2.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDisputing(false)}
                    className="px-3 py-1.5 rounded text-xs font-semibold border border-border"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-xs font-bold bg-destructive text-destructive-foreground shadow hover:bg-destructive/90"
                  >
                    Submit to Admin
                  </button>
                </div>
              </form>
            )}

            {activeMatchModal.status === 'COMPLETED' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveMatchModal(null)}
                  className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Create New Tournament */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl tracking-wide">Create Tournament</h3>
                <p className="text-xs text-muted-foreground">Setup a new hostel competition.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block C Champions Cup"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="group_knockout">Groups + Knockout</option>
                    <option value="knockout">Knockout cup</option>
                    <option value="league">League</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Max Players</label>
                  <input
                    type="number"
                    min="4"
                    max="64"
                    value={newMaxPlayers}
                    onChange={(e) => setNewMaxPlayers(parseInt(e.target.value) || 16)}
                    className="w-full text-xs rounded bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
