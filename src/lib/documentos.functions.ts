import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const BUCKET = "moto-documentos";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const safePathSchema = z
  .string()
  .min(1)
  .max(500)
  .regex(/^motos\/[A-Za-z0-9._-]+\/[A-Za-z0-9._\-\/]+$/, "Caminho inválido");

export const createDocUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        chassi: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[A-Za-z0-9_-]+$/, "Chassi inválido"),
        tipo: z.enum(["bi", "carta_conducao", "livrete", "factura", "seguro", "outro"]),
        filename: z.string().trim().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const path = `motos/${data.chassi}/${data.tipo}-${Date.now()}-${safeName}`;
    const { data: signed, error } = await admin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Falha ao criar URL de upload");
    return { path: signed.path, token: signed.token };
  });

export const createDocReadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ path: safePathSchema }).parse(d))
  .handler(async ({ data }) => {
    const { data: signed, error } = await admin()
      .storage.from(BUCKET)
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Falha ao gerar URL");
    return { signedUrl: signed.signedUrl };
  });

export const removeDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ path: safePathSchema }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await admin().storage.from(BUCKET).remove([data.path]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
