'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  Trophy,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Gamepad2,
  Lock,
  User,
  Home,
  Check,
  Flag,
  Eye,
  EyeOff,
  KeyRound,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { FC_TEAMS } from '@/lib/teams';
import { TermsModal } from '@/components/TermsModal';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'register',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regHostelName, setRegHostelName] = useState('');
  const [regRoomNumber, setRegRoomNumber] = useState('');
  const [regFavoriteTeam, setRegFavoriteTeam] = useState('Real Madrid');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isFullTermsModalOpen, setIsFullTermsModalOpen] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict validation
    if (!termsAccepted) {
      setErrorMsg('You must check the box to agree to the Terms & Conditions and Code of Conduct before joining.');
      return;
    }

    if (!regName.trim() || !regUsername.trim()) {
      setErrorMsg('Please enter your full name and gamer tag / username.');
      return;
    }

    if (!regPassword || regPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (!regHostelName.trim() || !regRoomNumber.trim()) {
      setErrorMsg('Please enter your hostel name and room number so opponents can locate you for matches.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          password: regPassword,
          hostelName: regHostelName,
          roomNumber: regRoomNumber,
          favoriteTeam: regFavoriteTeam,
          termsAccepted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setSuccessMsg(data.message || 'Account created successfully!');
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your Gamer Tag / Username.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      setSuccessMsg(`Welcome back, ${data.user.name}!`);
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header - Fixed Top */}
        <div className="p-4 sm:p-5 pb-3 border-b border-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide uppercase">
                {mode === 'register' ? 'Join Hostel FC Arena' : 'Sign In to Arena'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'register'
                  ? 'Create your competitor profile to enter tournaments and climb the rankings'
                  : 'Access your competitor dashboard, scheduled fixtures, and ELO rating'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher - Fixed */}
        <div className="px-4 sm:px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-secondary/60 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-md transition ${
                mode === 'register'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              New Competitor (Register)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-md transition ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Existing Player (Sign In)
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3.5">
          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Name & Gamer Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-primary" /> Gamer Tag / EA ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your gamer tag"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary" /> Password
                  </span>
                  <span className="text-[10px] text-muted-foreground">Min 4 characters</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Create a secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 pr-9 text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Hostel Name & Room Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-primary" /> Hostel Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall 4, Unity Hall, Atlantic..."
                    value={regHostelName}
                    onChange={(e) => setRegHostelName(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C-304 or B12"
                    value={regRoomNumber}
                    onChange={(e) => setRegRoomNumber(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Preferred Team (Clubs & National Teams) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-primary" /> Preferred Team (Club or National Team)
                </label>
                <select
                  value={regFavoriteTeam}
                  onChange={(e) => setRegFavoriteTeam(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
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
                <p className="text-[10px] text-muted-foreground">
                  Your profile&apos;s favorite team badge. You can pick a different team whenever you enter a specific tournament.
                </p>
              </div>

              {/* TERMS & CONDITIONS BOX - Collapsible Offline Console Rules */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Code of Conduct & Offline Console Rules
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsFullTermsModalOpen(true)}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      title="Read Full Official Document"
                    >
                      <FileText className="w-3.5 h-3.5" /> Full Agreement
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(!showTermsModal)}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showTermsModal ? (
                        <>
                          Hide <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Summary <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {showTermsModal ? (
                  /* Expanded Detailed Offline Rules */
                  <div className="text-[11px] text-muted-foreground leading-relaxed space-y-2 bg-background/60 rounded-lg p-3 border border-border/40 max-h-44 overflow-y-auto animate-in fade-in">
                    <div>
                      <strong className="text-foreground">1. In-Person Console Integrity & Fair Play:</strong>
                      <p className="mt-0.5 text-muted-foreground">
                        • Matches are played <strong>offline in person</strong> on a shared console.<br />
                        • <strong>No pausing during active open play</strong> or opponent attacks. Pauses are strictly permitted ONLY when the ball is out of play (throw-in, goal kick, corner kick, injury, or half-time). Max 3 pauses (30s) per match.<br />
                        • <strong>No touching the console power button</strong>, pulling cables, or unplugging controllers. Doing so results in an immediate default loss.<br />
                        • Default competitive settings apply (Tactical Defending only, normal game speed, default gameplay sliders).
                      </p>
                    </div>
                    <div>
                      <strong className="text-foreground">2. Hostel Room & Controller Respect:</strong>
                      <p className="mt-0.5 text-muted-foreground">
                        • Treat the host room, TV/monitor, console, and controllers with total respect.<br />
                        • Zero tolerance for throwing or slamming controllers, hitting furniture, or aggressive behavior. Any equipment damage must be replaced immediately, plus a permanent league ban.
                      </p>
                    </div>
                    <div>
                      <strong className="text-foreground">3. Punctuality & Physical Attendance:</strong>
                      <p className="mt-0.5 text-muted-foreground">
                        • Players must physically arrive at the scheduled room within <strong>15 minutes</strong> of kickoff.<br />
                        • Unexcused absence results in an automatic 3-0 walkover loss.
                      </p>
                    </div>
                    <div>
                      <strong className="text-foreground">4. Official Referee Score Recording:</strong>
                      <p className="mt-0.5 text-muted-foreground">
                        • The match referee / Tournament Admin will verify the final whistle stats screen on the TV and officially record the score. Admin rulings on disputes are final.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Summary */
                  <div className="text-[11px] text-muted-foreground bg-background/40 rounded-lg px-2.5 py-1.5 border border-border/40 flex items-center justify-between">
                    <span>Offline console rules: No pausing during active play, respect controllers/TV, and 15m arrival window.</span>
                  </div>
                )}

                {/* MANDATORY CHECKBOX */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        termsAccepted
                          ? 'bg-primary border-primary text-primary-foreground shadow'
                          : 'border-border bg-secondary group-hover:border-primary/50'
                      }`}
                    >
                      {termsAccepted && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFullTermsModalOpen(true);
                      }}
                      className="font-bold text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer inline"
                    >
                      Hostel FC Arena Terms & Conditions
                    </button>{' '}
                    and promise to abide by the Code of Conduct.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !termsAccepted}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2 ${
                  termsAccepted && !loading
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                {loading ? (
                  <span>Creating Competitor Profile...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Create Competitor Account
                  </>
                )}
              </button>
            </form>
          ) : (
            /* LOGIN FORM (Gamer Tag + Password) */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-primary" /> Gamer Tag / Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your gamer tag or username"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter your account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs rounded-lg bg-secondary border border-border px-3 py-2 pr-9 text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In to Arena
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Dedicated Terms & Conditions Document Modal */}
      <TermsModal
        isOpen={isFullTermsModalOpen}
        onClose={() => setIsFullTermsModalOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
        }}
      />
    </div>
  );
}
