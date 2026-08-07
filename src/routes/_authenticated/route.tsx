import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Se estiver a tentar aceder à raiz das rotas autenticadas ou a redireccionar
    if (location.pathname === "/_authenticated") {
      throw redirect({ to: "/gestao" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
