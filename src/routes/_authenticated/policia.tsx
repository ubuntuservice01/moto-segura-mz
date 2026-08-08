import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";

export const Route = createFileRoute("/_authenticated/policia")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Painel Polícia — MotoGest Nacional" },
      {
        name: "description",
        content: "Painel de operações policiais e fiscalização de motorizadas.",
      },
    ],
  }),
  component: PoliciaLayout,
});

function PoliciaLayout() {
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
