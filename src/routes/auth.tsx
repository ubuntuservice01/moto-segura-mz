import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — MotoCheck MZ" },
      { name: "description", content: "Acesso reservado à plataforma MotoCheck MZ." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const entrar = useMutation({
    mutationFn: async () => {
      const emailNormalizado = email.trim().toLowerCase();
      if (!emailNormalizado || !password) throw new Error("Preencha o email e a palavra-passe.");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password,
      });
      if (error) throw new Error("Email ou palavra-passe incorrectos.");
      if (!data.user) throw new Error("Não foi possível iniciar a sessão.");

      const { data: profile, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("full_name, role, municipality_id, is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error("Não foi possível validar o perfil. Tente novamente.");
      }
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("A conta existe, mas ainda não tem um perfil na plataforma.");
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("O seu acesso está desactivado. Contacte o administrador.");
      }

      return profile;
    },
    onSuccess: (profile) => {
      const nome = profile.full_name ? ", " + profile.full_name : "";
      toast.success("Bem-vindo" + nome + "!");
      navigate({ to: profile.role === "super_admin" ? "/ubuntu" : "/gestao", replace: true });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  function submeter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    entrar.mutate();
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-4 sm:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">MotoCheck MZ</p>
                  <p className="text-xs text-slate-400">Segurança para motas em Moçambique</p>
                </div>
              </div>
              <div className="mt-28 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">Área reservada</p>
                <h1 className="mt-4 text-4xl font-bold leading-tight xl:text-5xl">
                  Verifique. Confirme. Opere com segurança.
                </h1>
                <p className="mt-6 text-sm leading-7 text-slate-400">
                  Acesso seguro para equipas municipais, técnicos e agentes autorizados. Cada
                  utilizador vê apenas o que corresponde ao seu nível de acesso.
                </p>
              </div>
            </div>
            <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500">
              <span>MotoCheck MZ</span>
              <span>Ubuntu Service Lda</span>
            </div>
          </section>

          <section className="flex min-h-[680px] items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-10 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-950">MotoCheck MZ</p>
                    <p className="text-xs text-slate-500">Área reservada</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-600">Bem-vindo de volta</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Entrar na plataforma
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Introduza os dados da sua conta autorizada para continuar.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={submeter}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                  <div className="flex h-13 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-900/5">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nome@instituicao.gov.mz"
                      className="h-full w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Palavra-passe</span>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/recuperar-password" })}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Esqueci-me da palavra-passe
                    </button>
                  </div>
                  <div className="flex h-13 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-900/5">
                    <LockKeyhole className="h-5 w-5 text-slate-400" />
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Introduza a sua palavra-passe"
                      className="h-full w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      aria-label={mostrarPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                      onClick={() => setMostrarPassword((value) => !value)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={entrar.isPending}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {entrar.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A validar acesso...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-5 text-slate-600">
                    O acesso é reservado a utilizadores criados e autorizados pelo administrador
                    da plataforma.
                  </p>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400">
                Sistema protegido · MotoCheck MZ
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
