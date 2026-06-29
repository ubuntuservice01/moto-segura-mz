import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que procura não existe ou foi removido.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo correu mal. Tente novamente.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a href="/" className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MotoVerify MZ — Verificação e mercado de motas em Moçambique" },
      {
        name: "description",
        content:
          "Plataforma pública de verificação de propriedade e mercado de motas em Moçambique. Ubuntu Link.",
      },
      { property: "og:title", content: "MotoVerify MZ — Verificação e mercado de motas em Moçambique" },
      {
        property: "og:description",
        content: "Verifique qualquer mota pelo chassi. Marketplace de motas verificadas em Moçambique.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "MotoVerify MZ — Verificação e mercado de motas em Moçambique" },
      { name: "description", content: "MotoSure MZ is a platform for verifying motorcycle ownership and a marketplace for buying and selling motorcycles in Mozambique." },
      { property: "og:description", content: "MotoSure MZ is a platform for verifying motorcycle ownership and a marketplace for buying and selling motorcycles in Mozambique." },
      { name: "twitter:description", content: "MotoSure MZ is a platform for verifying motorcycle ownership and a marketplace for buying and selling motorcycles in Mozambique." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2932c8ed-7b61-462e-a190-d3f67e7a9657/id-preview-0b56f131--13721f4e-bd7b-4928-9b39-0de077589e12.lovable.app-1782710169172.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2932c8ed-7b61-462e-a190-d3f67e7a9657/id-preview-0b56f131--13721f4e-bd7b-4928-9b39-0de077589e12.lovable.app-1782710169172.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-MZ">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
