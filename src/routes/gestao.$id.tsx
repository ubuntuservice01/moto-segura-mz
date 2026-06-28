import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRightLeft, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { deleteMoto, getMotoById, updateMoto, type MotoInput } from "@/lib/motos.functions";
import { MotoForm } from "@/components/moto-form";
import { EstadoBadge } from "@/components/estado-badge";

export const Route = createFileRoute("/gestao/$id")({
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
