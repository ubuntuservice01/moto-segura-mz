import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogIn, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { criarPrimeiroSuperAdmin, estadoInstalacao } from "@/lib/plataforma.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — MotoGest Plataforma Nacional" },
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

  const instalacao = useQuery({
    queryKey: ["estado-instalacao"],
    queryFn: () => estadoInstalacao(),
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/gestao", replace: true });
    });
  }, [navigate]);

  const entrar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Sessão iniciada");
      navigate({ to: "/gestao", replace: true });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (instalacao.data && !instalacao.data.instalada) {
    return <Instalacao onPronto={() => instalacao.refetch()} />;
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border bg-card p-7 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Plataforma MotoGest</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Entrar na plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso reservado a municípios, técnicos, polícia e Ubuntu Service.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            entrar.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="nome@municipio.gov.mz"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Palavra-passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={entrar.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {entrar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Entrar
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Esqueceu a palavra-passe? Contacte o Administrador do seu Município.
      </p>
    </div>
  );
}

function Instalacao({ onPronto }: { onPronto: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const criar = useMutation({
    mutationFn: () =>
      criarPrimeiroSuperAdmin({ data: { nome, email: email.trim(), palavraPasse: password } }),
    onSuccess: () => {
      toast.success("Super Administrador criado. Já pode entrar.");
      onPronto();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border-2 border-secondary bg-card p-7 shadow-sm">
        <div className="flex items-center gap-2 text-secondary-foreground">
          <Sparkles className="h-5 w-5 text-secondary" />
          <span className="text-xs font-bold uppercase tracking-wider">Primeira instalação</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Criar Super Administrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta conta pertence à Ubuntu Service e gere toda a plataforma nacional. Só pode ser criada
          uma vez.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Nome completo</span>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Palavra-passe (mín. 8)</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={criar.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Criar conta Ubuntu Service
          </button>
        </form>
      </div>
    </div>
  );
}
