"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { setupPassword } from "../actions/authActions";

interface LoginClientProps {
  isPasswordSet: boolean;
}

export default function LoginClient({ isPasswordSet }: LoginClientProps) {
  // Standard Login State
  const [password, setPassword] = useState("");
  
  // Setup State
  const [setupPass, setSetupPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Common State
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handles standard login
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid password. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles initial password setup
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!setupPass || setupPass.trim().length === 0) {
      setError("Password cannot be empty.");
      return;
    }

    if (setupPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await setupPassword(setupPass);

      if (!result.success) {
        setError(result.error || "Failed to set password.");
        setIsLoading(false);
        return;
      }

      // Automatically log the user in after setting the password
      const loginResult = await signIn("credentials", {
        password: setupPass,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Password configured successfully, but login failed. Please reload and try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during setup. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-sidebar p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-4 shadow-lg shadow-accent/20">
              ♡
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isPasswordSet ? "DonationTrack" : "DonationTrack Setup"}
            </h1>
            <p className="text-white/50 text-sm">
              {isPasswordSet ? "Secure Personal Ledger" : "Create Access Password"}
            </p>
          </div>

          {isPasswordSet ? (
            /* Standard Unlock Screen */
            <form className="space-y-6" onSubmit={handleUnlock}>
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1"
                >
                  Access Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border-white/5 bg-[#1e1e21] py-3 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-3 px-4 rounded-xl text-sm text-center font-medium animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl bg-accent hover:bg-yellow-500 text-black font-bold transition-all shadow-lg shadow-accent/10 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Unlock Application"
                )}
              </button>
            </form>
          ) : (
            /* First-Run Setup Wizard */
            <form className="space-y-6" onSubmit={handleSetup}>
              <div className="space-y-4">
                <p className="text-xs text-white/60 leading-relaxed text-center">
                  This application stores all your financial giving records locally on this computer. Set an access password to protect your database.
                </p>

                <div className="space-y-2">
                  <label 
                    htmlFor="setupPassword" 
                    className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1"
                  >
                    Choose Password
                  </label>
                  <input
                    id="setupPassword"
                    name="setupPassword"
                    type="password"
                    required
                    className="block w-full rounded-xl border-white/5 bg-[#1e1e21] py-3 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                    value={setupPass}
                    onChange={(e) => setSetupPass(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor="confirmPassword" 
                    className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="block w-full rounded-xl border-white/5 bg-[#1e1e21] py-3 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-3 px-4 rounded-xl text-sm text-center font-medium animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl bg-accent hover:bg-yellow-500 text-black font-bold transition-all shadow-lg shadow-accent/10 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Configuring...</span>
                  </div>
                ) : (
                  "Set Password & Unlock"
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-medium">
              Private Offline Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
