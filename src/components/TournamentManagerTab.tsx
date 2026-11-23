'use client';

import React from 'react';
import {
  Trophy,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface TournamentManagerTabProps {
  tournaments: any[];
  onOpenCreate: () => void;
  onOpenEdit: (tournament: any) => void;
  onOpenReview: (tournamentId: number) => void;
  onSelectTournament: (tournament: any) => void;
  onDeleteTournament: (tournamentId: number) => void;
}

export function TournamentManagerTab({
  tournaments,
  onOpenCreate,
  onOpenEdit,
  onOpenReview,
  onSelectTournament,
  onDeleteTournament,
}: TournamentManagerTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider border border-primary/30">
            In Progress
          </span>
        );
      case 'REGISTRATION_OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
            Registration Open
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground uppercase tracking-wider border border-border">
            Draft
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider border border-amber-500/30">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Tournament Operations & CRUD Center
          </h2>
          <p className="text-xs text-muted-foreground">
            Create custom formats, edit active rules, manage applicant rosters, and archive past cups.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow hover:bg-primary/90 transition"
        >
          <PlusCircle className="w-4 h-4" /> Create New Tournament
        </button>
      </div>

      {/* Tournament Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => {
          let parsedRules: any = {};
          if (t.rules) {
            try {
              parsedRules = typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules;
            } catch (e) {}
          }

          return (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/50 transition shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Banner & Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {t.bannerUrl ? (
                      <img src={t.bannerUrl} alt="Trophy" className="w-10 h-10 object-contain shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold">
                        <Trophy className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display text-lg tracking-wide leading-tight line-clamp-1">{t.title}</h3>
                      <div className="text-[11px] text-muted-foreground mt-0.5">ID #{t.id}</div>
                    </div>
                  </div>
                  <div>{getStatusBadge(t.status)}</div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{t.description || 'No description provided.'}</p>

                {/* Details list */}
                <div className="text-xs space-y-1.5 p-3 rounded-lg bg-secondary/40 border border-border/70">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <strong className="text-foreground">{t.format}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roster:</span>
                    <strong className="text-primary">
                      {t.approvedParticipantsCount || t.currentParticipantsCount || 0} / {t.maxParticipants} Approved
                    </strong>
                  </div>
                  {t.pendingParticipantsCount > 0 && (
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Pending Review:</span>
                      <span>{t.pendingParticipantsCount} applicant(s)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match Legs:</span>
                    <span className="text-foreground font-semibold">
                      {parsedRules.legs === 2 ? 'Two-Legged (Home & Away)' : 'Single Match (1 Leg)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Half Duration:</span>
                    <span className="text-foreground font-semibold">{parsedRules.halfDurationMinutes || 6} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <span className="text-emerald-400 font-bold">{t.prizePool || '₦0'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenReview(t.id)}
                  className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Review Roster
                  {t.pendingParticipantsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
                      {t.pendingParticipantsCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEdit(t)}
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold"
                    title="Edit Tournament"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTournament(t.id)}
                    className="p-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-semibold"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
