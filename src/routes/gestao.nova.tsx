import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MotoForm } from "@/components/moto-form";
import { createMoto, type MotoInput } from "@/lib/motos.functions";

export const Route = createFileRoute("/gestao/nova")({
  component: NovaMota,
});

function NovaMota() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (input: MotoInput) => createMoto({ data: input }),
    onSuccess: (moto) => {
      toast.success("Mota registada com sucesso");
      qc.invalidateQueries({ queryKey: ["motos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      navigate({ to: "/gestao/$id", params: { id: moto.id } });
    },
    onError: (e) => toast.error(`Erro: ${(e as Error).message}`),
  });

  return (
    <div>
      <h2 className="text-xl font-bold">Registar nova mota</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O registo é imutável: cada alteração futura ficará no histórico.
      </p>
      <div className="mt-6">
        <MotoForm
          submitting={mut.isPending}
          onSubmit={(d) => mut.mutate(d)}
          submitLabel="Registar mota"
        />
      </div>
    </div>
  );
}
