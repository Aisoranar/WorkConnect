import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogoLink } from "@/components/Logo";
import { MapPin, Star, Github, Linkedin, Briefcase, QrCode, Sparkles } from "lucide-react";
import { fetchTalentProfile, queryKeys } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/talento/$username")({
  component: PublicTalentPage,
  head: ({ params }) => ({
    meta: [{ title: `Talento · ${params.username} · WorkConnect` }],
  }),
});

function PublicTalentPage() {
  const { username } = Route.useParams();
  const profileUrl = `${SITE_URL}/talento/${username}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;

  const query = useQuery({
    queryKey: queryKeys.talent(username),
    queryFn: () => fetchTalentProfile(username),
  });

  const talent = query.data?.data;
  const meta = query.data?.meta;
  const initials = talent?.name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
      <header className="relative border-b border-border glass">
        <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-40" />
        <div className="container relative mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <LogoLink size="lg" className="shrink-0" />
          <Button asChild size="sm" className="shrink-0">
            <Link to="/register">
              <span className="hidden sm:inline">Unirme como talento</span>
              <span className="sm:hidden">Unirme</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <ApiState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {talent && (
            <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,280px)] lg:gap-8">
              <div className="order-2 card-paper p-5 sm:p-8 lg:order-1">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                  <div className="logo-mark mx-auto h-16 w-16 shrink-0 rounded-organic-md text-xl font-bold sm:mx-0 sm:h-20 sm:w-20 sm:text-2xl">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h1 className="page-heading">
                  {talent.name.split(" ")[0]}{" "}
                  <span className="text-gradient-trust">{talent.name.split(" ").slice(1).join(" ") || ""}</span>
                </h1>
                    <p className="text-muted-foreground">@{talent.username}</p>
                    {talent.city && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {talent.city}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm sm:justify-start sm:gap-4">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
                        {talent.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        {meta?.projects_completed ?? 0} proyectos completados
                      </span>
                    </div>
                    {talent.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{talent.bio}</p>
                    )}
                    <div className="mt-4 flex justify-center gap-3 sm:justify-start">
                      {talent.github && (
                        <a href={talent.github} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {talent.linkedin && (
                        <a href={talent.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {talent.skills.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-sm font-medium uppercase text-muted-foreground">Habilidades</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {talent.skills.map((s) => (
                        <span key={s.id} className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary-glow">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {talent.portfolio.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-sm font-medium uppercase text-muted-foreground">Portafolio</h2>
                    <ul className="mt-3 space-y-3">
                      {talent.portfolio.map((p) => (
                        <li key={p.id} className="rounded-xl border border-border bg-surface/40 p-4">
                          <div className="font-medium">{p.title}</div>
                          {p.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <aside className="order-1 space-y-4 lg:order-2">
                <div className="card-note p-5 text-center sm:p-6">
                  <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Trust Score</div>
                  <div className="font-display text-4xl font-bold text-gradient-trust sm:text-5xl">
                    {Math.round(talent.rating * 20)}
                  </div>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-trust-glow">
                    <Sparkles className="h-3 w-3" />
                    Reputación verificada
                  </p>
                </div>

                <div className="card-gradient h-fit rounded-2xl border border-border p-5 text-center shadow-card sm:p-6">
                  <QrCode className="mx-auto h-8 w-8 text-primary-glow" />
                  <p className="mt-2 text-sm font-medium">Escanea en feria o entrevista</p>
                  <img
                    src={qrSrc}
                    alt="QR perfil WorkConnect"
                    className="mx-auto mt-4 max-w-full rounded-lg border border-border"
                    width={200}
                    height={200}
                  />
                  <p className="mt-3 break-all text-xs text-muted-foreground">{profileUrl}</p>
                </div>
              </aside>
            </div>
          )}
        </ApiState>
      </main>
    </div>
  );
}
