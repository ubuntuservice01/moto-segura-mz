import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Bike, Users, Activity, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ubuntu/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel Nacional — MotoGest" }] }),
  component: Dashboard,
});

async function getStats() {
  const [m, ma, bikes, owners, users, transfers] = await Promise.all([
    (supabase as any).from("municipalities").select("id,name,code,province,is_active").order("name"),
    (supabase as any).from("municipalities").select("id", { count: "exact", head: true }).eq("is_active", true),
    (supabase as any).from("motorcycles").select("id,status", { count: "exact" }),
    (supabase as any).from("owners").select("id", { count: "exact", head: true }),
    (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
    (supabase as any).from("ownership_transfers").select("id", { count: "exact", head: true }),
  ]);
  const error = [m,ma,bikes,owners,users,transfers].map(x=>x.error).find(Boolean);
  if (error) throw error;
  const rows = bikes.data || [];
  return {
    municipalities: m.data || [],
    total: m.count ?? (m.data || []).length,
    active: ma.count ?? 0,
    bikes: bikes.count ?? rows.length,
    owners: owners.count ?? 0,
    users: users.count ?? 0,
    transfers: transfers.count ?? 0,
    activeBikes: rows.filter(x=>x.status === "activa").length,
    stolen: rows.filter(x=>x.status === "roubada").length,
    sale: rows.filter(x=>x.status === "a_venda").length,
    seized: rows.filter(x=>x.status === "apreendida").length,
  };
}

function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey:["national-dashboard"], queryFn:getStats, refetchInterval:60000 });
  if (isLoading) return <div className="p-12 text-center">A carregar painel…</div>;
  if (error || !data) return <div className="rounded-xl border p-8 text-center"><p className="font-semibold">Não foi possível carregar o painel.</p><button onClick={()=>refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Tentar novamente</button></div>;

  const cards = [
    ["Municípios",data.total,Building2],["Activos",data.active,Activity],["Motorizadas",data.bikes,Bike],
    ["Proprietários",data.owners,Users],["Utilizadores",data.users,Users],["Transferências",data.transfers,ArrowRightLeft]
  ];

  return <div className="space-y-8">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">MotoGest</p><h1 className="mt-1 text-3xl font-bold">Painel Nacional</h1><p className="mt-2 text-sm text-muted-foreground">Visão geral da plataforma.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label,value,Icon]:any)=><div key={label} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><p className="text-3xl font-bold">{Number(value).toLocaleString("pt-MZ")}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-semibold">Municípios</h2></div><div className="divide-y">
        {data.municipalities.length===0?<p className="p-10 text-center text-sm text-muted-foreground">Nenhum município criado.</p>:data.municipalities.map((m:any)=><div key={m.id} className="flex items-center justify-between px-5 py-4"><div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.province || "—"} · {m.code}</p></div><span className="text-xs font-semibold">{m.is_active?"Activo":"Inactivo"}</span></div>)}
      </div></div>
      <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Estado das motorizadas</h2><div className="mt-5 space-y-4">
        {[["Activas",data.activeBikes],["Roubadas",data.stolen],["À venda",data.sale],["Apreendidas",data.seized]].map(([label,value]:any)=><div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:data.bikes ? (value/data.bikes*100)+"%" : "0%"}}/></div></div>)}
      </div></div>
    </div>
  </div>;
}
