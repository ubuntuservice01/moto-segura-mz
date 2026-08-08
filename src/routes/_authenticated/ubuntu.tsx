import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";

export const Route = createFileRoute("/_authenticated/ubuntu")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Ubuntu Service — MotoGest Plataforma Nacional" },
      { name: "description", content: "Painel de administração nacional da plataforma MotoGest." },
    ],
  }),
  component: UbuntuLayout,
});

function UbuntuLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
