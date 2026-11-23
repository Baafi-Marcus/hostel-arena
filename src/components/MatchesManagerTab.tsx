'use client';

import React, { useState } from 'react';
import { Swords, Plus, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, Check, Shield } from 'lucide-react';

interface MatchItem {
  id: number;
  tournamentId: number;
  stage: string;
  round: number;
  matchNumber: number | null;
  groupName: string | null;
  homeParticipantId: number;
  awayParticipantId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  notes?: string | null;
  homeParticipant?: any;
  awayParticipant?: any;
}

interface MatchesManagerTabProps {
  matches: MatchItem[];
  tournaments: any[];
  activeTournamentId: number;
  onRefreshMatches: () => void;
  onOpenMatchModal: (match: any) => void;
}

export function MatchesManagerTab({
  matches,
  tournaments,
  activeTournamentId,
  onRefreshMatches,
  onOpenMatchModal,
}: MatchesManagerTabProps) {
  const [filterStage, setFilterStage] = useState('ALL');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [quickScores, setQuickScores] = useState<Record<number, { home: string; away: string; saving?: boolean }>>({});

  const activeMatches = matches.filter((m) => m.tournamentId === activeTournamentId || !m.tournamentId);
  const stages = Array.from(new Set(activeMatches.map((m) => m.stage)));

  const filtered = activeMatches.filter((m) => {
    if (filterStage === 'ALL') return true;
    return m.stage === filterStage;
  });

  const getQuickScore = (m: MatchItem) => {
    const cur = quickScores[m.id];
    if (cur !== undefined) return cur;
    return {
      home: m.homeScore !== null && m.homeScore !== undefined ? String(m.homeScore) : '0',
      away: m.awayScore !== null && m.awayScore !== undefined ? String(m.awayScore) : '0',
    };
  };

  const handleQuickScoreChange = (matchId: number, side: 'home' | 'away', val: string) => {
    setQuickScores((prev) => ({
      ...prev,
      [matchId]: {
        home: side === 'home' ? val : prev[matchId]?.home ?? '0',
        away: side === 'away' ? val : prev[matchId]?.away ?? '0',
      },
    }));
  };

  const handleSaveQuickScore = async (matchId: number) => {
    const scoreState = quickScores[matchId];
    const match = activeMatches.find((m) => m.id === matchId);
    const homeVal = parseInt(scoreState?.home ?? (match?.homeScore !== null ? String(match?.homeScore) : '0'), 10) || 0;
    const awayVal = parseInt(scoreState?.away ?? (match?.awayScore !== null ? String(match?.awayScore) : '0'), 10) || 0;

    setQuickScores((prev) => ({
      ...prev,
      [matchId]: {
        home: String(homeVal),
        away: String(awayVal),
        saving: true,
      },
    }));

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: homeVal,
          awayScore: awayVal,
          status: 'COMPLETED',
        }),
      });
      if (res.ok) {
        onRefreshMatches();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save score');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating match score');
    } finally {
      setQuickScores((prev) => ({
        ...prev,
        [matchId]: {
          home: String(homeVal),
          away: String(awayVal),
          saving: false,
        },
      }));
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm(`Are you sure you want to delete Match #${matchId}?`)) return;
    setIsDeleting(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshMatches();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Official Match Scoring &amp; Fixtures
          </h2>
          <p className="text-xs text-muted-foreground">
            As Tournament Director, record official match results directly as games finish on console.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-primary/20 text-primary font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-primary/30">
            <Shield className="w-3.5 h-3.5" /> Admin Score Mode Active
          </span>
        </div>
      </div>

      {/* Stage Filters */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setFilterStage('ALL')}
          className={`px-3 py-1.5 rounded-md transition ${
            filterStage === 'ALL'
              ? 'bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Stages ({activeMatches.length})
        </button>
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
              filterStage === stage
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {stage} ({activeMatches.filter((m) => m.stage === stage).length})
          </button>
        ))}
      </div>

      {/* Matches Table / Cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((m) => {
            const isCompleted = m.status === 'COMPLETED';
            const isPending = m.status === 'PENDING_VERIFICATION';
            const isDisputed = m.status === 'DISPUTED';

            const homeName = m.homeParticipant?.userName || `Participant #${m.homeParticipantId}`;
            const awayName = m.awayParticipant?.userName || `Participant #${m.awayParticipantId}`;
            const homeTeam = m.homeParticipant?.teamName || 'Home';
            const awayTeam = m.awayParticipant?.teamName || 'Away';
            const qs = getQuickScore(m);

            return (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-primary/40 transition"
              >
                {/* Match Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="text-primary font-bold">Match #{m.id}</span>
                    <span>·</span>
                    <span>{m.stage}</span>
                    {m.groupName && <span>({m.groupName})</span>}
                    {m.notes && <span className="text-muted-foreground/80">· {m.notes}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                    <span className="text-foreground">
                      {homeName} <span className="text-xs text-muted-foreground">({homeTeam})</span>
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">vs</span>
                    <span className="text-foreground">
                      {awayName} <span className="text-xs text-muted-foreground">({awayTeam})</span>
                    </span>
                  </div>
                </div>

                {/* Score Entry & Actions */}
                <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto shrink-0">
                  {/* Quick Score Input */}
                  <div className="flex items-center gap-1.5 bg-secondary/60 p-1.5 rounded-lg border border-border">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground px-1">Score:</div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={qs.home}
                      onChange={(e) => handleQuickScoreChange(m.id, 'home', e.target.value)}
                      className="w-10 h-8 rounded bg-background text-center font-display text-base font-bold border border-input focus:border-primary focus:outline-none"
                      title="Home Score"
                    />
                    <span className="font-display text-muted-foreground">-</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={qs.away}
                      onChange={(e) => handleQuickScoreChange(m.id, 'away', e.target.value)}
                      className="w-10 h-8 rounded bg-background text-center font-display text-base font-bold border border-input focus:border-primary focus:outline-none"
                      title="Away Score"
                    />
                    <button
                      onClick={() => handleSaveQuickScore(m.id)}
                      disabled={qs.saving}
                      className="px-2.5 h-8 rounded bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition flex items-center gap-1 shadow cursor-pointer"
                      title="Save & Finalize Score"
                    >
                      {qs.saving ? '...' : <><Check className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>

                  {/* Status Badge */}
                  {isCompleted && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Official
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {isDisputed && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Contested
                    </span>
                  )}
                  {!isCompleted && !isPending && !isDisputed && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                      Scheduled
                    </span>
                  )}

                  {/* More Details / Full Score Modal */}
                  <button
                    onClick={() => onOpenMatchModal(m)}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3 h-3" /> Edit / Notes
                  </button>

                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    disabled={isDeleting === m.id}
                    className="p-1.5 rounded-lg border border-transparent hover:border-destructive/30 text-destructive hover:bg-destructive/10 text-xs transition"
                    title="Delete fixture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/40 space-y-2">
          <Swords className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <div className="font-semibold text-foreground">No fixtures found for this stage</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Review and approve your players in the Applicant Review tab, then click &quot;Generate Fixtures&quot; to auto-populate all matches!
          </p>
        </div>
      )}
    </div>
  );
}
