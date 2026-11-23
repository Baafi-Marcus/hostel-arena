'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Clock,
  AlertTriangle,
  UserCheck,
  PlusCircle,
  X,
} from 'lucide-react';
import { TournamentCreateModal } from '@/components/TournamentCreateModal';
import { TournamentEditModal } from '@/components/TournamentEditModal';
import { ApplicantReviewQueue } from '@/components/ApplicantReviewQueue';
import { TournamentManagerTab } from '@/components/TournamentManagerTab';
import { MatchesManagerTab } from '@/components/MatchesManagerTab';
import { Match, Tournament, User } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  // Authentication State (In-Memory ONLY - No localStorage)
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form states
  const [adminCode, setAdminCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Dashboard Workspace State
  const [sidebarTab, setSidebarTab] = useState<
    'overview' | 'disputes' | 'pending' | 'approvals' | 'tournaments' | 'fixtures'
  >('overview');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<number>(1);
  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Score Recording Modal State
  const [scoreModalMatch, setScoreModalMatch] = useState<any>(null);
  const [modalHomeScore, setModalHomeScore] = useState<number>(0);
  const [modalAwayScore, setModalAwayScore] = useState<number>(0);
  const [modalStatus, setModalStatus] = useState<string>('COMPLETED');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [savingScore, setSavingScore] = useState(false);

  // Check setup status on load
  const checkAdminStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setIsSetup(Boolean(data.isSetup));
    } catch (err: any) {
      setErrorMsg('Failed to check administrative security status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Fetch Live Data once admin is authenticated
  const fetchAdminData = async () => {
    try {
      const [tRes, mRes, uRes] = await Promise.all([
        fetch('/api/tournaments').then((r) => r.json()),
        fetch('/api/matches').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);

      if (tRes.tournaments) {
        setTournaments(tRes.tournaments);
        if (tRes.tournaments[0]?.id) setActiveTournamentId(tRes.tournaments[0].id);
      }
      if (mRes.matches) setMatches(mRes.matches);
      if (uRes.users) setUsersList(uRes.users);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
    }
  }, [adminUser]);

  // Handle First-Time Setup
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (adminCode.length < 4) {
      setErrorMsg('Admin security code must be at least 4 characters/digits.');
      return;
    }
    if (adminCode !== confirmCode) {
      setErrorMsg('Security codes do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup',
          adminCode,
          adminName: adminName.trim() || 'Tournament Director',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize admin security code.');

      setSuccessMsg('Master security code established. Entering Command Center...');
      setTimeout(() => {
        setAdminUser(data.admin);
        setIsSetup(true);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Security Code Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          adminCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid admin code.');

      setSuccessMsg('Access granted. Unlocking Command Center...');
      setTimeout(() => {
        setAdminUser(data.admin);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Opening Score Modal
  const handleOpenScoreModal = (match: any) => {
    if (!match) return;
    setScoreModalMatch(match);
    setModalHomeScore(match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : 0);
    setModalAwayScore(match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : 0);
    setModalStatus(match.status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED');
    setModalNotes(match.notes ?? '');
  };

  // Handle Admin Saving Score
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreModalMatch) return;
    setSavingScore(true);
    try {
      const res = await fetch(`/api/matches/${scoreModalMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: Number(modalHomeScore),
          awayScore: Number(modalAwayScore),
          status: modalStatus,
          notes: modalNotes || null,
        }),
      });
      if (res.ok) {
        setScoreModalMatch(null);
        await fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save score');
      }
    } catch (err: any) {
      alert(err.message || 'Error recording score');
    } finally {
      setSavingScore(false);
    }
  };

  const handleLockSession = () => {
    setAdminUser(null);
    setAdminCode('');
    setConfirmCode('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Helper counts
  const pendingApplicantsCount = tournaments.reduce(
    (acc, t: any) => acc + (t.pendingParticipantsCount || 0),
    0
  );
  const disputedMatches = matches.filter((m) => m.status === 'DISPUTED');
  const pendingMatches = matches.filter(
    (m) => (m.status as string) === 'PENDING_VERIFICATION' || (m.status as string) === 'AWAITING_CONFIRMATION'
  );

  // Loading spinner during check
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <div className="font-display text-lg tracking-wider uppercase text-foreground">
          Checking Security Status...
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: GATEWAY (SETUP OR PASSCODE LOGIN)
  // ==========================================
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Hostel Arena
        </Link>

        <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl tracking-wide uppercase">
              {isSetup ? 'Admin Security Gate' : 'Initialize First Admin'}
            </h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {isSetup
                ? 'Enter your private tournament director security passcode to unlock the command center.'
                : 'Welcome! As the first administrator, create your master security code for the domain.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: FIRST-TIME SETUP */}
          {!isSetup ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Director Name</label>
                <input
                  type="text"
                  placeholder="Enter your name or official title"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> Create Security Code / Passcode
                </label>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    required
                    placeholder="Enter new admin code (e.g. 7749 or secret password)"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 pr-9 text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Confirm Security Code</label>
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  placeholder="Re-enter security code to verify"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition shadow flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? 'Initializing Code...' : 'Establish Security Code & Enter'}
              </button>
            </form>
          ) : (
            /* FORM: PASSCODE LOGIN */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Admin Security Passcode
                </label>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter master admin code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 pr-9 text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Unlocking...' : 'Unlock Admin Command Center'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border/80 text-center">
            <span className="text-[11px] text-muted-foreground">
              Hostel FC Arena &middot; Private Administrative Portal
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED ADMIN COMMAND CENTER
  // ==========================================
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg tracking-wider uppercase">
                HOSTEL FC <span className="text-primary">ARENA</span>
              </span>
              <span className="ml-2 text-[10px] bg-primary/20 text-primary font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Admin Control Room
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition hidden sm:inline"
            >
              Public Arena Site
            </Link>
            <button
              onClick={handleLockSession}
              className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold hover:bg-secondary transition"
            >
              Lock &amp; Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="mx-auto max-w-7xl px-4 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-md bg-primary/20 text-primary grid place-items-center font-display text-lg">
                {adminUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-sm truncate">{adminUser.name}</div>
                <div className="text-[11px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" /> System Admin
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setSidebarTab('overview')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'overview'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </span>
              </button>

              <button
                onClick={() => setSidebarTab('disputes')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'disputes'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Contested Disputes
                </span>
                {disputedMatches.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
                    {disputedMatches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarTab('pending')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'pending'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending Scores
                </span>
                {pendingMatches.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                    {pendingMatches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarTab('approvals')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'approvals'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Applicant Reviews
                </span>
                {pendingApplicantsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-black">
                    {pendingApplicantsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarTab('tournaments')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'tournaments'
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
                onClick={() => setSidebarTab('fixtures')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  sidebarTab === 'fixtures'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Fixtures &amp; Matches
                </span>
                <span className="text-[10px] opacity-70">{matches.length}</span>
              </button>
            </nav>

            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2 rounded-md bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider hover:bg-accent/90 transition flex items-center justify-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4" /> Create Cup
              </button>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0 space-y-6">
          {sidebarTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs uppercase font-semibold text-muted-foreground">Competitors</div>
                  <div className="font-display text-3xl text-primary mt-1">{usersList.length}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs uppercase font-semibold text-muted-foreground">Tournaments</div>
                  <div className="font-display text-3xl text-foreground mt-1">{tournaments.length}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs uppercase font-semibold text-muted-foreground">Matches Total</div>
                  <div className="font-display text-3xl text-foreground mt-1">{matches.length}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs uppercase font-semibold text-muted-foreground">Pending Applicants</div>
                  <div className="font-display text-3xl text-amber-400 mt-1">{pendingApplicantsCount}</div>
                </div>
              </div>

              {/* Tournament Selector & Manager */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-xl uppercase tracking-wider mb-4">Active Competitions</h2>
                <TournamentManagerTab
                  tournaments={tournaments}
                  onOpenCreate={() => setIsCreateModalOpen(true)}
                  onOpenEdit={(t) => setEditingTournament(t)}
                  onOpenReview={(tId) => {
                    setActiveTournamentId(tId);
                    setSidebarTab('approvals');
                  }}
                  onSelectTournament={(t) => {
                    setActiveTournamentId(t.id);
                  }}
                  onDeleteTournament={async () => {
                    await fetchAdminData();
                  }}
                />
              </div>
            </div>
          )}

          {sidebarTab === 'approvals' && (
            <ApplicantReviewQueue
              tournaments={tournaments}
              activeTournamentId={activeTournamentId}
              onSelectTournament={(id) => setActiveTournamentId(id)}
              onFixturesGenerated={() => {
                fetchAdminData();
                setSidebarTab('fixtures');
              }}
            />
          )}

          {sidebarTab === 'tournaments' && (
            <TournamentManagerTab
              tournaments={tournaments}
              onOpenCreate={() => setIsCreateModalOpen(true)}
              onOpenEdit={(t) => setEditingTournament(t)}
              onOpenReview={(tId) => {
                setActiveTournamentId(tId);
                setSidebarTab('approvals');
              }}
              onSelectTournament={(t) => {
                setActiveTournamentId(t.id);
              }}
              onDeleteTournament={async () => {
                await fetchAdminData();
              }}
            />
          )}

          {sidebarTab === 'fixtures' && (
            <MatchesManagerTab
              matches={matches as any}
              tournaments={tournaments}
              activeTournamentId={activeTournamentId}
              onRefreshMatches={fetchAdminData}
              onOpenMatchModal={handleOpenScoreModal}
            />
          )}

          {sidebarTab === 'disputes' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Contested Disputes</h2>
              {disputedMatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No contested matches currently pending arbitration.
                </div>
              ) : (
                <MatchesManagerTab
                  matches={disputedMatches as any}
                  tournaments={tournaments}
                  activeTournamentId={activeTournamentId}
                  onRefreshMatches={fetchAdminData}
                  onOpenMatchModal={handleOpenScoreModal}
                />
              )}
            </div>
          )}

          {sidebarTab === 'pending' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Pending Match Verifications</h2>
              {pendingMatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  All match results are verified and up to date.
                </div>
              ) : (
                <MatchesManagerTab
                  matches={pendingMatches as any}
                  tournaments={tournaments}
                  activeTournamentId={activeTournamentId}
                  onRefreshMatches={fetchAdminData}
                  onOpenMatchModal={handleOpenScoreModal}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <TournamentCreateModal
        isOpen={isCreateModalOpen}
        currentUserId={adminUser?.id || 1}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchAdminData}
      />

      {editingTournament && (
        <TournamentEditModal
          tournament={editingTournament}
          isOpen={Boolean(editingTournament)}
          onClose={() => setEditingTournament(null)}
          onUpdated={fetchAdminData}
          onDeleted={() => {
            setEditingTournament(null);
            fetchAdminData();
          }}
        />
      )}

      {/* Admin Score Recording Modal */}
      {scoreModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Tournament Director Official Scoring
                  </span>
                </div>
                <h3 className="font-display text-2xl tracking-wide mt-1">
                  Record Match #{scoreModalMatch.id}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {scoreModalMatch.stage} {scoreModalMatch.groupName ? `· ${scoreModalMatch.groupName}` : ''}
                </p>
              </div>
              <button
                onClick={() => setScoreModalMatch(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-5">
              {/* Scoreline Box */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* Home */}
                  <div className="space-y-2 text-center">
                    <div className="font-bold text-sm truncate">
                      {scoreModalMatch.homeParticipant?.userName || 'Home Player'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {scoreModalMatch.homeParticipant?.teamName || 'Home Club'}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      required
                      value={modalHomeScore}
                      onChange={(e) => setModalHomeScore(parseInt(e.target.value) || 0)}
                      className="font-display h-14 w-20 mx-auto rounded-lg bg-card text-center text-3xl font-bold border border-border focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Divider */}
                  <div className="text-center font-display text-xl text-muted-foreground px-2">
                    VS
                  </div>

                  {/* Away */}
                  <div className="space-y-2 text-center">
                    <div className="font-bold text-sm truncate">
                      {scoreModalMatch.awayParticipant?.userName || 'Away Player'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {scoreModalMatch.awayParticipant?.teamName || 'Away Club'}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      required
                      value={modalAwayScore}
                      onChange={(e) => setModalAwayScore(parseInt(e.target.value) || 0)}
                      className="font-display h-14 w-20 mx-auto rounded-lg bg-card text-center text-3xl font-bold border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Match Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="COMPLETED">✅ COMPLETED (Official Result - Updates ELO & Standings)</option>
                  <option value="IN_PROGRESS">⏱️ IN_PROGRESS (Live Match On Console)</option>
                  <option value="SCHEDULED">📅 SCHEDULED (Pending Play)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Match Notes / Penalties (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2-2 FT, won 4-3 on penalties or Golden Goal"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setScoreModalMatch(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingScore ? 'Saving Score...' : 'Record & Finalize Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
