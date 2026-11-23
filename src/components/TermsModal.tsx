'use client';

import React from 'react';
import {
  X,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Gamepad2,
  Clock,
  Home,
  Award,
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header - Fixed */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide uppercase">
                Terms & Conditions and Tournament Regulations
              </h2>
              <p className="text-xs text-muted-foreground">
                Hostel FC Arena · Official Offline League Policy (Season 2026)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-muted-foreground leading-relaxed">
          {/* Intro Notice */}
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-foreground space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-primary text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Essential Competitive Notice
            </div>
            <p className="text-[11px] text-muted-foreground">
              By registering as a competitor on Hostel FC Arena, you enter into a binding agreement with tournament organizers, hosts, and fellow players. This league is played <strong>offline in person</strong> within campus hostels.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                1
              </span>
              Competitor Eligibility & Profile Authenticity
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>All competitors must be verified hostel residents or campus students.</li>
              <li>Each player is permitted exactly one competitive profile. Multi-accounting, smurfing, or playing under another student’s gamer tag will lead to disqualification.</li>
              <li>You must provide your real physical hostel name and room number so opponents and organizers can locate you for matches.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                2
              </span>
              Offline In-Person Console Play & Matchday Integrity
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Strict Pause Policy:</strong> Pausing during active open play, opponent attacks, or fast breaks is strictly prohibited. Tactical pauses are permitted ONLY when the ball is dead (throw-in, goal kick, corner kick, injury, or half-time). Maximum 3 pauses (30 seconds each) per player per match.
              </li>
              <li>
                <strong>Console & Power Security:</strong> Unplugging controllers, pulling power cords, or touching the console power button during a game results in an immediate 3-0 forfeit loss.
              </li>
              <li>
                <strong>Default Competitive Settings:</strong> All games must run on default competitive parameters: Tactical Defending only, normal game speed, default sliders, and agreed half length. Tampering with custom difficulty sliders is deemed cheating.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                3
              </span>
              Venue Host Room & Equipment Liability
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Zero Tolerance for Rage Damage:</strong> Competitors are guests in the host’s room or common lounge. Throwing controllers, slamming tables, or striking televisions will result in immediate police/hostel disciplinary reporting and a permanent lifetime ban from Hostel FC Arena.
              </li>
              <li>
                <strong>Financial Liability:</strong> Any physical damage to televisions, HDMI cords, controllers, or furniture must be fully reimbursed by the offending player prior to leaving the room.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                4
              </span>
              Punctuality, Walkovers & Rescheduling
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>15-Minute Grace Period:</strong> Players must report physically to the host room within 15 minutes of the scheduled fixture time.
              </li>
              <li>
                <strong>Walkover Forfeit:</strong> Unexcused absence beyond 15 minutes awards an official 3-0 walkover victory to the attending opponent.
              </li>
              <li>
                <strong>Rescheduling:</strong> Fixture adjustments must be submitted to the Tournament Admin at least 2 hours in advance of the original start time.
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                5
              </span>
              Referee Authority & Dispute Adjudication
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Official match scores are recorded by the match referee or Tournament Admin directly from the TV full-time whistle screen.</li>
              <li>In the event of console power failure or crash during play, the game is resumed with the remaining time and score maintained from the moment of interruption.</li>
              <li>All final decisions made by the Tournament Director / Admin regarding disputes, rematches, or disciplinary measures are conclusive and final.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                6
              </span>
              Sportsmanship & Prize Payouts
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Players must shake hands or bump fists at the end of every match, regardless of outcome.</li>
              <li>Prize pools, certificates, and trophies will be distributed by the Tournament Admin upon the conclusion of the grand final.</li>
            </ul>
          </div>
        </div>

        {/* Footer - Fixed Bottom */}
        <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-3 bg-secondary/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-secondary transition"
          >
            Close Document
          </button>

          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> I Understand & Accept Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
