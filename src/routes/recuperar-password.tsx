import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Recuperar acesso — MotoCheck MZ" }] }),
  component: RecuperarPasswordPage,
});

function RecuperarPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const recuperar = useMutation({
    mutationFn: async () => {
      const emailNormalizado = email.trim().toLowerCase();
      if (!emailNormalizado) throw new Error("Introduza o email da sua conta.");
      const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado, {
        redirectTo: window.location.origin + "/redefinir-password",
      });
      if (error) throw new Error("Não foi possível enviar o email de recuperação.");
    },
    onSuccess: () => setEnviado(true),
    onError: (error) => toast.error((error as Error).message),
  });

  function submeter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    recuperar.mutate();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl sm:p-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/auth" })}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>

        {enviado ? (
          <div className="mt-7">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Verifique o seu email</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Se existir uma conta associada a este email, enviámos as instruções para redefinir a
              palavra-passe.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="mt-7 h-12 w-full rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            <p className="mt-7 text-sm font-bold text-emerald-600">Recuperação de acesso</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Esqueceu a palavra-passe?
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Introduza o email da sua conta. Vamos enviar um link seguro para redefinir a
              palavra-passe.
            </p>

            <form className="mt-8 space-y-5" onSubmit={submeter}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="flex h-13 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-900 focus-within:bg-white">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@instituicao.gov.mz"
                    className="h-full w-full bg-transparent px-3 text-sm outline-none"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={recuperar.isPending}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {recuperar.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> A enviar...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
