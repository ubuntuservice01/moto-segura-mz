import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ubuntu/municipios")({
  ssr:false,
  head:()=>({meta:[{title:"Municípios — MotoGest"}]}),
  component:Municipios,
});

const PROVINCIAS=["Cabo Delgado","Gaza","Inhambane","Manica","Maputo","Nampula","Niassa","Sofala","Tete","Zambézia","Cidade de Maputo"];
const EMPTY={name:"",code:"",province:"Niassa",district:"",address:"",phone:"",email:"",logo_url:""};

function Municipios(){
  const qc=useQueryClient();
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const [form,setForm]=useState(EMPTY);
  const {data=[],isLoading}=useQuery({queryKey:["municipalities"],queryFn:async()=>{
    const {data,error}=await (supabase as any).from("municipalities").select("*").order("name");
    if(error)throw error; return data||[];
  }});

  const save=useMutation({mutationFn:async()=>{
    const payload={name:form.name.trim(),code:form.code.trim().toUpperCase(),province:form.province||null,district:form.district||null,address:form.address||null,phone:form.phone||null,email:form.email||null,logo_url:form.logo_url||null};
    if(!payload.name||!/^[A-Z0-9]{2,10}$/.test(payload.code)) throw new Error("Nome e código são obrigatórios. O código deve ter 2 a 10 caracteres.");
    const result=edit?await (supabase as any).from("municipalities").update(payload).eq("id",edit.id):await (supabase as any).from("municipalities").insert(payload);
    if(result.error)throw result.error;
  },onSuccess:()=>{qc.invalidateQueries({queryKey:["municipalities"]});qc.invalidateQueries({queryKey:["national-dashboard"]});toast.success(edit?"Município actualizado.":"Município criado.");close();},onError:e=>toast.error(e instanceof Error?e.message:"Não foi possível guardar.")});

  const toggle=useMutation({mutationFn:async(m:any)=>{const {error}=await (supabase as any).from("municipalities").update({is_active:!m.is_active}).eq("id",m.id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["municipalities"]});qc.invalidateQueries({queryKey:["national-dashboard"]});toast.success("Estado actualizado.")},onError:e=>toast.error(e instanceof Error?e.message:"Erro.")});
  const remove=useMutation({mutationFn:async(id:string)=>{const {error}=await (supabase as any).from("municipalities").delete().eq("id",id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["municipalities"]});qc.invalidateQueries({queryKey:["national-dashboard"]});toast.success("Município eliminado.")},onError:e=>toast.error(e instanceof Error?e.message:"Não foi possível eliminar. Pode ter registos associados.")});

  function close(){setOpen(false);setEdit(null);setForm(EMPTY)}
  function editItem(m:any){setEdit(m);setForm({name:m.name,code:m.code,province:m.province||"Niassa",district:m.district||"",address:m.address||"",phone:m.phone||"",email:m.email||"",logo_url:m.logo_url||""});setOpen(true)}

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Administração nacional</p><h1 className="mt-1 text-3xl font-bold">Municípios</h1><p className="mt-2 text-sm text-muted-foreground">Gestão dos tenants municipais do MotoGest.</p></div><button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/>Novo município</button></header>
    <div className="overflow-hidden rounded-2xl border bg-card">{isLoading?<div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin"/></div>:data.length===0?<div className="p-12 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 font-medium">Nenhum município criado</p><p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro município para começar.</p></div>:<div className="divide-y">{data.map((m:any)=><div key={m.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{m.name[0]?.toUpperCase()}</div><div><p className="font-semibold">{m.name}</p><p className="text-xs text-muted-foreground">{m.code} · {m.province||"—"}{m.district?" · "+m.district:""}</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">{m.is_active?"Activo":"Inactivo"}</span><button onClick={()=>editItem(m)} className="rounded-lg border p-2 hover:bg-muted"><Pencil className="h-4 w-4"/></button><button onClick={()=>toggle.mutate(m)} className="rounded-lg border p-2 hover:bg-muted">{m.is_active?<ToggleRight className="h-4 w-4"/>:<ToggleLeft className="h-4 w-4"/>}</button><button onClick={()=>{if(confirm("Eliminar "+m.name+"? Só será possível se não houver registos associados."))remove.mutate(m.id)}} className="rounded-lg border p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></button></div></div>)}</div>}</div>
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{edit?"Editar município":"Novo município"}</h2><p className="mt-1 text-sm text-muted-foreground">Dados do tenant municipal.</p></div><button onClick={close} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5"/></button></div><form className="mt-6 space-y-4" onSubmit={e=>{e.preventDefault();save.mutate()}}><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome *"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={INPUT} placeholder="Município de Lichinga"/></Field>
      <Field label="Código *"><input required maxLength={10} value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className={INPUT} placeholder="LIC"/><p className="mt-1 text-[11px] text-muted-foreground">Ex.: LIC-000001.</p></Field>
      <Field label="Província"><select value={form.province} onChange={e=>setForm({...form,province:e.target.value})} className={INPUT}>{PROVINCIAS.map(p=><option key={p}>{p}</option>)}</select></Field>
      <Field label="Distrito"><input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} className={INPUT}/></Field>
      <Field label="Endereço"><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className={INPUT}/></Field>
      <Field label="Telefone"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={INPUT}/></Field>
      <Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={INPUT}/></Field>
      <Field label="Logótipo (URL)"><input value={form.logo_url} onChange={e=>setForm({...form,logo_url:e.target.value})} className={INPUT}/></Field>
    </div><div className="flex justify-end gap-2"><button type="button" onClick={close} className={BTN_GHOST}>Cancelar</button><button type="submit" disabled={save.isPending} className={BTN_PRIMARY}>{save.isPending?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>}{edit?"Guardar alterações":"Criar município"}</button></div></form></div></div>}
  </div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>}
const INPUT="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const BTN_PRIMARY="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const BTN_GHOST="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted";
