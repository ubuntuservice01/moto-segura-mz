import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ShieldCheck, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — MotoGest" },
      {
        name: "description",
        content:
          "Área reservada a municípios, técnicos, polícia e à Ubuntu Service na plataforma MotoGest.",
      },
      { property: "og:title", content: "Entrar — MotoGest Plataforma Nacional" },
      {
        property: "og:description",
        content: "Acesso reservado aos utilizadores da plataforma MotoGest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const entrar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Não foi possível iniciar a sessão.");

      const { data: profile, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("full_name, role, municipality_id, is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("A conta existe, mas ainda não tem um perfil MotoGest.");
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("O seu perfil MotoGest está desactivado.");
      }

      return profile;
    },
    onSuccess: (profile) => {
      toast.success(`Bem-vindo, ${profile.full_name}`);
      navigate({ to: profile.role === "super_admin" ? "/ubuntu" : "/gestao", replace: true });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
        <section className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-bold">MotoGest</p>
                <p className="text-xs text-slate-400">Gestão municipal de motociclos</p>
              </div>
            </div>
            <div className="mt-20 max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Acesso seguro</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">Gestão simples, controlo municipal.</h1>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Registe motociclos, consulte proprietários e acompanhe transferências do seu município.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">MotoGest · Ubuntu Service Lda</p>
        </section>

        <section className="flex min-h-[620px] items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <p className="text-2xl font-bold text-slate-950">MotoGest</p>
              <p className="text-sm text-slate-500">Gestão municipal</p>
            </div>
            <p className="text-sm font-semibold text-blue-600">Área reservada</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Entrar na plataforma</h2>
            <p className="mt-2 text-sm text-slate-500">Use o email e a palavra-passe da sua conta MotoGest.</p>

            <form className="mt-8 space-y-5" onSubmit={(event) => { event.preventDefault(); entrar.mutate(); }}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500">
                  <User className="ml-3 h-5 w-5 text-slate-400" />
                  <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@instituicao.gov.mz" className="h-12 w-full bg-transparent px-3 text-sm outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Palavra-passe</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500">
                  <Lock className="ml-3 h-5 w-5 text-slate-400" />
                  <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••" className="h-12 w-full bg-transparent px-3 text-sm outline-none" />
                </div>
              </label>
              <button type="submit" disabled={entrar.isPending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60">
                {entrar.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />A entrar...</> : "Entrar"}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              O acesso só é permitido quando existe um perfil MotoGest activo associado à conta.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

