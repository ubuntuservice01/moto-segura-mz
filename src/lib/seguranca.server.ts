import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Service-role client — server only. Never expose results without sanitizing. */
export function sbAdmin() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I,O,0,1

function bloco(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Gera um código de recuperação legível: MGT-8F4K-P92X */
export function gerarCodigoRecuperacao(): string {
  return `MGT-${bloco(4)}-${bloco(4)}`;
}

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/\s+/g, "");
}

/** SHA-256 do código normalizado (Web Crypto — compatível com o runtime edge). */
export async function hashCodigo(codigo: string): Promise<string> {
  const data = new TextEncoder().encode(normalizarCodigo(codigo));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function prefixoCodigo(codigo: string): string {
  const n = normalizarCodigo(codigo);
  return `${n.slice(0, 4)}••••-••${n.slice(-2)}`;
}

/** Comparação em tempo constante. */
export function equalsSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function mascararContacto(v: string | null): string | null {
  if (!v) return null;
  const s = v.replace(/\s+/g, "");
  if (s.length <= 4) return "••••";
  return `${s.slice(0, 3)}${"•".repeat(Math.max(0, s.length - 5))}${s.slice(-2)}`;
}
