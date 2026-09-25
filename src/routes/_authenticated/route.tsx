import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles").select("is_active, role").eq("id", data.user.id).maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    if (location.pathname === "/_authenticated") {
      throw redirect({ to: profile.role === "super_admin" ? "/ubuntu" : "/gestao" });
    }

    return { user: data.user, profile };
  },
  component: () => <Outlet />,
});
