'use client';

import React, { useState } from 'react';
import { X, Trophy, Settings, Shield, Award, Users, Clock, AlertCircle } from 'lucide-react';

interface TournamentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTournament: any) => void;
  currentUserId: number;
}

const AVAILABLE_TROPHIES = [
  { label: 'Champions Cup', url: '/UEFA-Champions-League-Trophy-Cup-44187.png' },
  { label: 'Ballon d\'Or Trophy', url: '/Ballon-dOr-Trophy-78415.png' },
  { label: 'Golden Crown', url: '/Kings-League-Golden-Crown-7845498.png' },
  { label: 'Gold Cup', url: '/CONCACAF-Gold-Cup-Trophy-77.png' },
  { label: 'Asian Cup', url: '/AFC-Asian-Cup-Trophy-61.png' },
];

export function TournamentCreateModal({
  isOpen,
  onClose,
  onCreated,
  currentUserId,
}: TournamentCreateModalProps) {
  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTrophy, setSelectedTrophy] = useState(AVAILABLE_TROPHIES[0].url);
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [minParticipants, setMinParticipants] = useState(4);
  const [teamSelectionRule, setTeamSelectionRule] = useState('EXCLUSIVE');
  const [entryFee, setEntryFee] = useState('₦2,500');
  const [prizePool, setPrizePool] = useState('₦150,000');

  // Custom Admin Rules Logic Engine
  const [legs, setLegs] = useState<1 | 2>(1);
  const [groupCount, setGroupCount] = useState(2);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);
  const [halfDuration, setHalfDuration] = useState(6);
  const [extraTime, setExtraTime] = useState<'NONE' | 'CLASSIC' | 'GOLDEN_GOAL'>('CLASSIC');
  const [penaltiesEnabled, setPenaltiesEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState('LEGENDARY');
  const [gameSpeed, setGameSpeed] = useState('NORMAL');
  const [customNotes, setCustomNotes] = useState('3 tactical pauses max. Disconnect within first 10 mins restarts match.');

  const [activeTab, setActiveTab] = useState<'basics' | 'rules' | 'prizes'>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Tournament title is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const rulesObject = {
      legs,
      groupCount: format === 'GROUP_TO_KNOCKOUT' ? groupCount : undefined,
      advancePerGroup: format === 'GROUP_TO_KNOCKOUT' ? advancePerGroup : undefined,
      halfDurationMinutes: halfDuration,
      extraTime,
      penaltiesEnabled,
      difficulty,
      gameSpeed,
      customNotes,
    };

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          bannerUrl: selectedTrophy,
          format,
          maxParticipants,
          minParticipants,
          teamSelectionRule,
          entryFee,
          prizePool,
          adminId: currentUserId,
          rules: rulesObject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tournament');
      }

      onCreated(data.tournament);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">Tournament Logic & Rules Studio</h2>
              <p className="text-xs text-muted-foreground">
                Define custom match rules, format mechanics, and applicant review settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border px-5 bg-card/60 gap-4 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'basics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            1. Competition Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'rules'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            2. Match & Tie Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prizes')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'prizes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            3. Entry & Prize Pool
          </button>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inter-Hostel Champions Cup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm rounded-lg bg-secondary border border-border px-3.5 py-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Official FC 26 tournament details, location, match consoles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border p-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tournament Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none font-medium"
                  >
                    <option value="SINGLE_ELIMINATION">Single Elimination (Knockout Cup)</option>
                    <option value="GROUP_TO_KNOCKOUT">Group Stage + Knockout Bracket</option>
                    <option value="ROUND_ROBIN">Round Robin League (Everyone plays everyone)</option>
                    <option value="DOUBLE_ELIMINATION">Double Elimination (Winners & Losers Bracket)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Club Selection Rule
                  </label>
                  <select
                    value={teamSelectionRule}
                    onChange={(e) => setTeamSelectionRule(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none font-medium"
                  >
                    <option value="EXCLUSIVE">Exclusive (Only 1 player per real club)</option>
                    <option value="OPEN">Open (Multiple players can pick same club)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Player Capacity
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none font-medium"
                  >
                    <option value={4}>4 Players (Semi-Finals & Final)</option>
                    <option value={8}>8 Players (Quarter-Finals)</option>
                    <option value={16}>16 Players (Round of 16)</option>
                    <option value={32}>32 Players (Full Championship)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Min Required to Launch
                  </label>
                  <select
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(Number(e.target.value))}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none font-medium"
                  >
                    <option value={2}>2 Players</option>
                    <option value={4}>4 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                  </select>
                </div>
              </div>

              {/* Trophy Artwork Picker */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Official Trophy Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_TROPHIES.map((trophy) => (
                    <button
                      key={trophy.url}
                      type="button"
                      onClick={() => setSelectedTrophy(trophy.url)}
                      className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition ${
                        selectedTrophy === trophy.url
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <img src={trophy.url} alt={trophy.label} className="w-8 h-8 object-contain" />
                      <span className="text-[10px] font-semibold text-center truncate w-full">{trophy.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Admin Freedom Engine: The system will automatically generate bracket fixtures, standings tables, and tie-breakers matching whatever mechanics you select below.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Match Tie Rules (Legs)
                  </label>
                  <select
                    value={legs}
                    onChange={(e) => setLegs(Number(e.target.value) as 1 | 2)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={1}>Single Match Tie (1 Leg)</option>
                    <option value={2}>Two-Legged (Home & Away, Aggregate Score)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Half Duration
                  </label>
                  <select
                    value={halfDuration}
                    onChange={(e) => setHalfDuration(Number(e.target.value))}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={4}>4 Minutes (Quick Cup)</option>
                    <option value={6}>6 Minutes (Tournament Standard)</option>
                    <option value={8}>8 Minutes (Competitive)</option>
                    <option value={10}>10 Minutes (Finals Format)</option>
                  </select>
                </div>
              </div>

              {format === 'GROUP_TO_KNOCKOUT' && (
                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Number of Groups
                    </label>
                    <select
                      value={groupCount}
                      onChange={(e) => setGroupCount(Number(e.target.value))}
                      className="w-full text-xs rounded bg-card border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value={2}>2 Groups (Group A & B)</option>
                      <option value={4}>4 Groups (Group A, B, C, D)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Advancing per Group
                    </label>
                    <select
                      value={advancePerGroup}
                      onChange={(e) => setAdvancePerGroup(Number(e.target.value))}
                      className="w-full text-xs rounded bg-card border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value={1}>Top 1 Advances (Group Winners only)</option>
                      <option value={2}>Top 2 Advance (Winner & Runner-up)</option>
                      <option value={3}>Top 3 Advance</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Extra Time
                  </label>
                  <select
                    value={extraTime}
                    onChange={(e) => setExtraTime(e.target.value as any)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="CLASSIC">Classic (2x15m Extra Time)</option>
                    <option value="GOLDEN_GOAL">Golden Goal (First to score)</option>
                    <option value="NONE">None (Direct to penalties or draw)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Penalty Shootouts
                  </label>
                  <select
                    value={penaltiesEnabled ? 'yes' : 'no'}
                    onChange={(e) => setPenaltiesEnabled(e.target.value === 'yes')}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="yes">Enabled (Shootout if tied)</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Difficulty / Engine
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="LEGENDARY">Legendary / Competitive</option>
                    <option value="WORLD_CLASS">World Class</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Custom Special Rules & Pause Guidelines
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border p-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PRIZES */}
          {activeTab === 'prizes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Entry Fee
                  </label>
                  <input
                    type="text"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="e.g. Free or ₦2,500"
                    className="w-full text-sm rounded-lg bg-secondary border border-border px-3.5 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Prize Pool
                  </label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="e.g. ₦150,000"
                    className="w-full text-sm rounded-lg bg-secondary border border-border px-3.5 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/40 border border-border space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Recommended Prize Distribution
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded bg-card border border-border/80 text-center">
                    <div className="font-bold text-amber-400">1st Place (Champion)</div>
                    <div className="text-base font-display mt-0.5">70%</div>
                  </div>
                  <div className="p-2.5 rounded bg-card border border-border/80 text-center">
                    <div className="font-bold text-slate-300">2nd Place (Finalist)</div>
                    <div className="text-base font-display mt-0.5">20%</div>
                  </div>
                  <div className="p-2.5 rounded bg-card border border-border/80 text-center">
                    <div className="font-bold text-amber-700">3rd Place</div>
                    <div className="text-base font-display mt-0.5">10%</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/60 text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Once created, the tournament begins in <strong>DRAFT</strong> mode. You can open player registration whenever you are ready.
                </span>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-border hover:bg-secondary text-muted-foreground transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'basics' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'prizes' ? 'rules' : 'basics')}
                  className="px-4 py-2 rounded-lg text-xs font-bold border border-border hover:bg-secondary transition"
                >
                  Previous
                </button>
              )}

              {activeTab !== 'prizes' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'basics' ? 'rules' : 'prizes')}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving to Neon...' : 'Create Tournament on Neon'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
