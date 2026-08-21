import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { Mascot } from "../components/Mascot";

export function Login() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const { dispatch } = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function google() {
    setBusy(true);
    setErr(null);
    const { error } = await signInWithGoogle();
    if (error) setErr(error);
    setBusy(false);
  }

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErr("Enter a valid email");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await signInWithEmail(email);
    if (error) setErr(error);
    else setSent(true);
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-snow flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md w-full mx-auto">
        <div className="animate-float">
          <Mascot size={150} mood="wink" />
        </div>
        <h1 className="text-4xl font-black text-center mt-2 leading-tight">
          Learn a word.
          <br />
          <span className="text-feather">Keep it for life.</span>
        </h1>
        <p className="text-wolf font-bold text-center mt-3">
          Bite-sized sessions, AI tutor practice and smart spaced repetition.
        </p>

        {sent ? (
          <div className="card mt-8 w-full text-center animate-pop border-mask">
            <div className="text-3xl">📬</div>
            <p className="font-extrabold mt-2">Check your inbox!</p>
            <p className="text-wolf font-bold text-sm mt-1">
              We sent a magic sign-in link to <b>{email}</b>. Click it to continue.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={google}
              disabled={busy}
              className="w-full mt-10 py-4 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all font-extrabold uppercase tracking-wide bg-snow border-swan text-eel hover:bg-polar flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 w-full my-5">
              <div className="h-0.5 flex-1 bg-swan rounded" />
              <span className="text-hare font-extrabold text-xs">OR</span>
              <div className="h-0.5 flex-1 bg-swan rounded" />
            </div>

            <form onSubmit={magic} className="w-full space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-2 border-swan rounded-2xl px-5 py-4 font-bold outline-none focus:border-macaw"
              />
              <button type="submit" disabled={busy} className="btn-blue w-full py-4 text-lg">
                Email me a magic link
              </button>
            </form>
          </>
        )}

        {err && (
          <p className="text-cardinal font-bold text-sm mt-4 animate-shake">{err}</p>
        )}

        <button
          onClick={() => dispatch({ type: "setDemoMode", enabled: true })}
          className="mt-10 text-macaw font-extrabold underline underline-offset-4 hover:text-macawDark"
        >
          Just exploring? Try the live demo →
        </button>
      </main>
      <footer className="pb-6 text-center text-xs text-hare font-bold">
        Your progress syncs securely to your account · Data protected by row-level security
      </footer>
    </div>
  );
}
