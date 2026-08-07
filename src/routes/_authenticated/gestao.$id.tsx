import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRightLeft, Trash2, Eye, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { deleteMoto, getMotoById, updateMoto, type MotoInput } from "@/lib/motos.functions";
import { MotoForm } from "@/components/moto-form";
import { EstadoBadge } from "@/components/estado-badge";
import { regenerarCodigoRecuperacao, marcarComoRecuperada } from "@/lib/seguranca.functions";

export const Route = createFileRoute("/_authenticated/gestao/$id")({
  loader: async ({ params }) => {
    const moto = await getMotoById({ data: { id: params.id } });
    if (!moto) throw notFound();
    return moto;
  },
  errorComponent: ({ error }) => <p className="text-destructive">{error.message}</p>,
  notFoundComponent: () => (
    <p className="text-center text-muted-foreground">Mota não encontrada.</p>
  ),
  component: EditarMota,
});

function EditarMota() {
  const initial = Route.useLoaderData();
  const params = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState<string | null>(null);

  const { data: moto } = useQuery({
    queryKey: ["moto", params.id],
    queryFn: () => getMotoById({ data: { id: params.id } }),
    initialData: initial,
  });

  const updateMut = useMutation({
    mutationFn: (patch: MotoInput) => updateMoto({ data: { id: params.id, patch } }),
    onSuccess: () => {
      toast.success("Mota actualizada. Alterações registadas no histórico.");
      qc.invalidateQueries({ queryKey: ["moto", params.id] });
      qc.invalidateQueries({ queryKey: ["motos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteMoto({ data: { id: params.id } }),
    onSuccess: () => {
      toast.success("Mota removida.");
      qc.invalidateQueries({ queryKey: ["motos"] });
      navigate({ to: "/gestao" });
    },
  });

  const regenerarMut = useMutation({
    mutationFn: () => regenerarCodigoRecuperacao({ data: { id: params.id } }),
    onSuccess: (r) => {
      setNovoCodigo(r.codigo);
      toast.success("Novo código gerado. Entregue-o ao proprietário.");
      qc.invalidateQueries({ queryKey: ["moto", params.id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const recuperarMut = useMutation({
    mutationFn: (motivo: string) => marcarComoRecuperada({ data: { id: params.id, motivo } }),
    onSuccess: () => {
      toast.success("Mota marcada como recuperada.");
      qc.invalidateQueries({ queryKey: ["moto", params.id] });
      qc.invalidateQueries({ queryKey: ["motos"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!moto) return null;

  return (
    <div>
      <Link to="/gestao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{moto.marca} {moto.modelo}</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{moto.chassi}</p>
          <div className="mt-2"><EstadoBadge estado={moto.estado} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/verificar/$chassi"
            params={{ chassi: moto.chassi }}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            <Eye className="h-4 w-4" /> Ver ficha pública
          </Link>
          <Link
            to="/gestao/$id/transferir"
            params={{ id: moto.id }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <ArrowRightLeft className="h-4 w-4" /> Transferir
          </Link>
          <button
            onClick={() => (confirmDelete ? deleteMut.mutate() : setConfirmDelete(true))}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete ? "Confirmar?" : "Eliminar"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <KeyRound className="h-4 w-4" /> Código de Recuperação
        </h3>
        <p className="mt-2 text-sm">
          {moto.codigo_recuperacao_prefixo ? (
            <>
              Guardado de forma cifrada:{" "}
              <span className="font-mono font-semibold">{moto.codigo_recuperacao_prefixo}</span>
            </>
          ) : (
            "Esta mota ainda não tem código. Gere um e entregue-o ao proprietário."
          )}
        </p>
        {novoCodigo && (
          <p className="mt-3 select-all rounded-lg bg-secondary/10 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest">
            {novoCodigo}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => regenerarMut.mutate()}
            disabled={regenerarMut.isPending}
            className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {moto.codigo_recuperacao_prefixo ? "Gerar novo código" : "Gerar código"}
          </button>
          {moto.estado === "roubada" && (
            <button
              onClick={() => {
                const motivo = window.prompt("Motivo da recuperação (mín. 5 caracteres):");
                if (motivo && motivo.trim().length >= 5) recuperarMut.mutate(motivo.trim());
              }}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:opacity-90"
            >
              Marcar como recuperada
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <MotoForm
          initial={moto}
          submitting={updateMut.isPending}
          onSubmit={(d) => updateMut.mutate(d)}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
