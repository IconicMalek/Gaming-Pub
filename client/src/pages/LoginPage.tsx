import { startLogin } from "@/const";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    startLogin();
  }, []);

  return (
    <main className="min-h-screen bg-ink text-slate-200 grid place-items-center px-5">
      <div className="glass-panel p-8 text-center max-w-md">
        <Loader2 className="w-6 h-6 mx-auto mb-4 animate-spin text-cyan-300" />
        <h1 className="font-display text-2xl text-white">Opening secure sign in…</h1>
        <p className="text-sm text-slate-500 mt-3">You are being redirected to the Gaming Pub account portal.</p>
        <button type="button" className="mt-6 text-sm text-cyan-300 hover:text-white" onClick={() => startLogin()}>
          Continue to sign in
        </button>
      </div>
    </main>
  );
}
