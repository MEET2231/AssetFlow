import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';
import { Field, ErrorBanner, Icon, ICONS } from '../components/ui';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code + new password, 3 = done
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [shownCode, setShownCode] = useState('');
  const [userName, setUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setShownCode(res.reset_code);
      setUserName(res.user_name);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPw) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { email: email.trim(), code: resetCode, new_password: newPassword },
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      {step === 1 && (
        <>
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4">
              <Icon path={ICONS.arrowLeft} className="h-3.5 w-3.5" /> Back to sign in
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot password?</h1>
            <p className="text-sm text-slate-400 mt-1">Enter your email and we'll generate a reset code.</p>
          </div>

          <form onSubmit={requestCode} className="space-y-4">
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            <Field label="Email" required>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </Field>

            <button className="btn w-full !py-2.5" disabled={busy}>
              {busy ? 'Sending…' : 'Get Reset Code'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h1>
            <p className="text-sm text-slate-400 mt-1">
              Hi <span className="font-semibold text-slate-600">{userName}</span>, enter the code below and choose a new password.
            </p>
          </div>

          {/* Show the code — in production this would be emailed */}
          <div className="mb-5 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon path={ICONS.info} className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Your Reset Code</span>
            </div>
            <div className="text-3xl font-bold tracking-[0.3em] text-indigo-600 text-center py-2 font-mono">
              {shownCode}
            </div>
            <p className="text-[11px] text-indigo-500 text-center mt-1">
              In production, this code would be sent to your email. Expires in 15 minutes.
            </p>
          </div>

          <form onSubmit={resetPassword} className="space-y-4">
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            <Field label="Reset code" required>
              <input
                className="input font-mono text-center text-lg tracking-[0.2em]"
                placeholder="000000"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
              />
            </Field>

            <Field label="New password" required hint="Minimum 6 characters">
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Field>

            <Field label="Confirm new password" required>
              <input
                className={`input ${confirmPw && confirmPw !== newPassword ? '!border-rose-300 focus:!ring-rose-400/60' : ''}`}
                type="password"
                placeholder="••••••••"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
              />
              {confirmPw && confirmPw !== newPassword && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords don't match.</p>
              )}
            </Field>

            <button className="btn w-full !py-2.5" disabled={busy || (confirmPw && confirmPw !== newPassword)}>
              {busy ? 'Resetting…' : 'Reset Password'}
            </button>

            <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn-secondary w-full">
              Start over
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <Icon path={ICONS.checkCircle} className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Password reset!</h1>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <button onClick={() => navigate('/login')} className="btn w-full !py-2.5">
            Go to Sign in
          </button>
        </div>
      )}
    </AuthShell>
  );
}
