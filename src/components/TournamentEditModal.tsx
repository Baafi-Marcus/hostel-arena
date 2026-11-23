'use client';

import React, { useState } from 'react';
import { X, Trophy, Save, Trash2, AlertCircle } from 'lucide-react';

interface TournamentEditModalProps {
  tournament: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTournament: any) => void;
  onDeleted: (tournamentId: number) => void;
}

export function TournamentEditModal({
  tournament,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: TournamentEditModalProps) {
  if (!isOpen || !tournament) return null;

  const [title, setTitle] = useState(tournament.title || '');
  const [description, setDescription] = useState(tournament.description || '');
  const [status, setStatus] = useState(tournament.status || 'DRAFT');
  const [teamSelectionRule, setTeamSelectionRule] = useState(tournament.teamSelectionRule || 'EXCLUSIVE');
  const [entryFee, setEntryFee] = useState(tournament.entryFee || 'Free');
  const [prizePool, setPrizePool] = useState(tournament.prizePool || '₦0');
  const [maxParticipants, setMaxParticipants] = useState(tournament.maxParticipants || 8);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status,
          teamSelectionRule,
          entryFee,
          prizePool,
          maxParticipants,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tournament');

      onUpdated(data.tournament);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${tournament.title}"? All registered participants and fixtures will be erased from Neon.`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tournament');

      onDeleted(tournament.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display text-lg tracking-wide">Edit Tournament Settings</h2>
              <p className="text-xs text-muted-foreground">Modify lifecycle status, registration rules, or prizes.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tournament Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-lg bg-secondary border border-border px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none font-semibold"
              >
                <option value="DRAFT">DRAFT (Admin Setup)</option>
                <option value="REGISTRATION_OPEN">REGISTRATION_OPEN (Players can apply)</option>
                <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED (Reviewing roster)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Active Fixtures)</option>
                <option value="COMPLETED">COMPLETED (Season Finished)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Selection</label>
              <select
                value={teamSelectionRule}
                onChange={(e) => setTeamSelectionRule(e.target.value)}
                className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              >
                <option value="EXCLUSIVE">EXCLUSIVE (1 player per club)</option>
                <option value="OPEN">OPEN (Clubs can duplicate)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</label>
              <input
                type="number"
                min="2"
                max="64"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry Fee</label>
              <input
                type="text"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prize Pool</label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg bg-secondary border border-border p-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete Tournament'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-border hover:bg-secondary text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
