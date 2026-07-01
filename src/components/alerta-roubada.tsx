import { AlertTriangle, Phone } from "lucide-react";

export function AlertaRoubada() {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-destructive bg-destructive/5 p-5">
      <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.58_0.22_27_/_0.06)_10px,oklch(0.58_0.22_27_/_0.06)_20px)]" />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-destructive">MOTA REPORTADA COMO ROUBADA</h3>
          <p className="mt-1 text-sm text-foreground">
            Esta mota consta como roubada no registo Ubuntu Service. Não compre nem use esta viatura.
            Se a viu ou tem informações, contacte de imediato a Polícia da República de Moçambique.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive">
            <Phone className="h-4 w-4" /> Linha PRM: 119
          </div>
        </div>
      </div>
    </div>
  );
}
