'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Shield,
  AlertTriangle,
  Play,
  Trash2,
  Edit2,
  CheckCircle2,
  Trophy,
  Users,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';

interface ParticipantItem {
  id: number;
  tournamentId: number;
  userId: number;
  teamName: string | null;
  seed: number | null;
  groupName: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    username: string;
    roomNumber: string | null;
    hostelBlock: string | null;
    eloRating: number;
    role: string;
  } | null;
}

interface ApplicantReviewQueueProps {
  tournaments: any[];
  activeTournamentId: number;
  onSelectTournament: (id: number) => void;
  onFixturesGenerated: (tournament: any, matches: any[]) => void;
}

export function ApplicantReviewQueue({
  tournaments,
  activeTournamentId,
  onSelectTournament,
  onFixturesGenerated,
}: ApplicantReviewQueueProps) {
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [editingParticipant, setEditingParticipant] = useState<ParticipantItem | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editSeed, setEditSeed] = useState<number | ''>('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedTournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0];

  const fetchParticipants = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants`);
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [selectedTournament?.id]);

  const handleApprove = async (participantId: number) => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        setMessage({ text: 'Player application approved!', type: 'success' });
        fetchParticipants();
      }
    } catch (e) {
      setMessage({ text: 'Error approving player', type: 'error' });
    }
  };

  const handleReject = async (participantId: number) => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      if (res.ok) {
        setMessage({ text: 'Player application rejected.', type: 'success' });
        fetchParticipants();
      }
    } catch (e) {
      setMessage({ text: 'Error rejecting player', type: 'error' });
    }
  };

  const handleRemove = async (participantId: number) => {
    if (!confirm('Remove this player from the tournament?')) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants/${participantId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage({ text: 'Participant removed.', type: 'success' });
        fetchParticipants();
      }
    } catch (e) {
      setMessage({ text: 'Error removing player', type: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingParticipant) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants/${editingParticipant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: editTeamName,
          seed: editSeed === '' ? null : Number(editSeed),
        }),
      });
      if (res.ok) {
        setMessage({ text: 'Participant details updated.', type: 'success' });
        setEditingParticipant(null);
        fetchParticipants();
      }
    } catch (e) {
      setMessage({ text: 'Failed to update participant', type: 'error' });
    }
  };

  const handleGenerateFixtures = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/generate-fixtures`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate fixtures');
      }

      setMessage({
        text: `Success! Generated ${data.matchesGenerated} official matches based on your tournament logic.`,
        type: 'success',
      });
      onFixturesGenerated(data.tournament, data.fixtures);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // Counts
  const pendingList = participants.filter((p) => p.status === 'PENDING_APPROVAL');
  const approvedList = participants.filter((p) => p.status === 'APPROVED' || p.status === 'CONFIRMED');
  const rejectedList = participants.filter((p) => p.status === 'REJECTED');

  const filteredParticipants = participants.filter((p) => {
    if (filter === 'PENDING') return p.status === 'PENDING_APPROVAL';
    if (filter === 'APPROVED') return p.status === 'APPROVED' || p.status === 'CONFIRMED';
    if (filter === 'REJECTED') return p.status === 'REJECTED';
    return true;
  });

  // Conflict detector: check if 2 approved/pending players requested the exact same team
  const teamUsageMap = new Map<string, number>();
  participants.forEach((p) => {
    if (p.teamName && (p.status === 'APPROVED' || p.status === 'PENDING_APPROVAL')) {
      const key = p.teamName.toLowerCase().trim();
      teamUsageMap.set(key, (teamUsageMap.get(key) || 0) + 1);
    }
  });

  // Parse custom tournament rules
  let parsedRules: any = {};
  if (selectedTournament?.rules) {
    try {
      parsedRules = typeof selectedTournament.rules === 'string'
        ? JSON.parse(selectedTournament.rules)
        : selectedTournament.rules;
    } catch (e) {}
  }

  const minRequired = selectedTournament?.minParticipants || 4;
  const maxCapacity = selectedTournament?.maxParticipants || 8;
  const canGenerate = approvedList.length >= minRequired;

  return (
    <div className="space-y-6">
      {/* Top Banner & Tournament Selector */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Gatekeeper Approval Desk
              </div>
              <h2 className="font-display text-2xl tracking-wide">
                Applicant Review & Roster Finalization
              </h2>
              <p className="text-xs text-muted-foreground">
                All players must be vetted and approved by the admin before they are admitted into active fixtures.
              </p>
            </div>
          </div>

          {/* Tournament selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Target Tournament:</span>
            <select
              value={selectedTournament?.id}
              onChange={(e) => onSelectTournament(Number(e.target.value))}
              className="text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none font-bold"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
            <button
              onClick={fetchParticipants}
              className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition"
              title="Refresh roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tournament Rules Summary Ribbon */}
        {selectedTournament && (
          <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Format: {selectedTournament.format}
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Team Rule: {selectedTournament.teamSelectionRule}
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Ties: {parsedRules.legs === 2 ? 'Two-Legged (Home & Away)' : 'Single Match (1 Leg)'}
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Half: {parsedRules.halfDurationMinutes || 6} mins
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Extra Time: {parsedRules.extraTime || 'CLASSIC'}
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary font-semibold text-foreground">
              Status: <span className="text-primary font-bold">{selectedTournament.status}</span>
            </span>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Roster Readiness & Launchpad */}
      <div className="p-5 rounded-xl border border-border bg-gradient-to-r from-card via-card to-secondary/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Roster Readiness Status
          </div>
          <div className="font-display text-xl">
            Approved: <span className="text-primary">{approvedList.length}</span> / {maxCapacity} Players
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Minimum required: {minRequired})
            </span>
          </div>
          <div className="w-full md:w-80 h-2 bg-secondary rounded-full overflow-hidden border border-border/80">
            <div
              className={`h-full transition-all duration-500 ${
                canGenerate ? 'bg-emerald-400' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, (approvedList.length / maxCapacity) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedTournament?.status === 'IN_PROGRESS' ? (
            <div className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Tournament Live & Fixtures Generated
            </div>
          ) : (
            <button
              onClick={handleGenerateFixtures}
              disabled={!canGenerate || generating}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow flex items-center gap-2 transition ${
                canGenerate
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed border border-border'
              }`}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating Logic on Neon...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Generate Fixtures & Launch Tournament
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex rounded-lg bg-secondary p-1 border border-border text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'ALL' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Applicants ({participants.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              filter === 'PENDING' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Review
            {pendingList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
                {pendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'APPROVED' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Approved ({approvedList.length})
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'REJECTED' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rejected ({rejectedList.length})
          </button>
        </div>
      </div>

      {/* Applicants List / Table */}
      {filteredParticipants.length > 0 ? (
        <div className="grid gap-3">
          {filteredParticipants.map((p) => {
            const isExclusiveConflict =
              selectedTournament?.teamSelectionRule === 'EXCLUSIVE' &&
              p.teamName &&
              (teamUsageMap.get(p.teamName.toLowerCase().trim()) || 0) > 1;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border bg-card transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  p.status === 'PENDING_APPROVAL'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : p.status === 'APPROVED' || p.status === 'CONFIRMED'
                    ? 'border-emerald-500/30'
                    : 'border-border opacity-70'
                }`}
              >
                {/* Player Profile & Team details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-sm shrink-0">
                    {p.user?.name ? p.user.name.charAt(0) : 'P'}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">
                        {p.user?.name || `Player #${p.userId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">(@{p.user?.username})</span>
                      {p.seed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                          Seed #{p.seed}
                        </span>
                      )}
                      {p.status === 'PENDING_APPROVAL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold uppercase tracking-wider">
                          Awaiting Admin Decision
                        </span>
                      )}
                      {(p.status === 'APPROVED' || p.status === 'CONFIRMED') && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Hostel: <strong className="text-foreground">{p.user?.hostelBlock || 'Unspecified'} ({p.user?.roomNumber || 'N/A'})</strong>
                      </span>
                      <span>·</span>
                      <span>
                        ELO Rating: <strong className="text-primary">{p.user?.eloRating || 1200}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Applied Club: <strong className="text-foreground font-semibold">{p.teamName || 'Unassigned'}</strong>
                      </span>
                    </div>

                    {isExclusiveConflict && (
                      <div className="pt-1 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Exclusive Rule Conflict: Multiple applicants selected &quot;{p.teamName}&quot;. Please edit one applicant&apos;s club before approval.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setEditingParticipant(p);
                      setEditTeamName(p.teamName || '');
                      setEditSeed(p.seed ?? '');
                    }}
                    className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1"
                    title="Edit team or seed"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {p.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleReject(p.id)}
                        className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs shadow hover:bg-emerald-400 transition flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    </>
                  )}

                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => handleReject(p.id)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold"
                    >
                      Revoke
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(p.id)}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-xs transition"
                    title="Remove participant"
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
          <Users className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <div className="font-semibold text-foreground">No participants found in this filter</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When players apply to register for this tournament, their applications will appear here for administrative vetting.
          </p>
        </div>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="font-display text-lg">Edit Player Assignment</h3>
              <button onClick={() => setEditingParticipant(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground">Player: </span>
                <strong className="text-foreground">{editingParticipant.user?.name}</strong> (@{editingParticipant.user?.username})
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-muted-foreground">Assigned FC 26 Club</label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="e.g. Real Madrid, Arsenal, Barcelona"
                  className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-muted-foreground">Bracket Seed Number</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={editSeed}
                  onChange={(e) => setEditSeed(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1 (Seed 1 plays Seed 8)"
                  className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingParticipant(null)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
