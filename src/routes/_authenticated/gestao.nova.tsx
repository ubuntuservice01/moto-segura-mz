import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MotoForm } from "@/components/moto-form";
import { createMoto, type MotoInput } from "@/lib/motos.functions";

export const Route = createFileRoute("/_authenticated/gestao/nova")({
  component: NovaMota,
});

function NovaMota() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState<{ codigo: string; id: string } | null>(null);
  const mut = useMutation({
    mutationFn: (input: MotoInput) => createMoto({ data: input }),
    onSuccess: (res) => {
      toast.success("Mota registada com sucesso");
      qc.invalidateQueries({ queryKey: ["motos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setCodigo({ codigo: res.codigo_recuperacao, id: res.moto.id });
    },
    onError: (e) => toast.error(`Erro: ${(e as Error).message}`),
  });

  return (
    <div>
      <h2 className="text-xl font-bold">Registar nova mota</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O registo é imutável: cada alteração futura ficará no histórico.
      </p>
      {codigo && (
        <div className="mt-6 rounded-xl border-2 border-secondary bg-secondary/5 p-5">
          <h3 className="text-base font-bold text-secondary">Código de Recuperação gerado</h3>
          <p className="mt-1 text-sm">
            Entregue este código ao proprietário. Ele é necessário para reportar a mota como
            roubada e <strong>não voltará a ser mostrado</strong>.
          </p>
          <p className="mt-3 select-all rounded-lg bg-card px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest">
            {codigo.codigo}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void navigator.clipboard.writeText(codigo.codigo)}
              className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Copiar código
            </button>
            <button
              onClick={() => navigate({ to: "/gestao/$id", params: { id: codigo.id } })}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              Abrir ficha da mota
            </button>
          </div>
        </div>
      )}

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
