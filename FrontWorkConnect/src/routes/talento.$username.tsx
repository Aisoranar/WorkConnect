import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Github, Linkedin, Briefcase, QrCode } from "lucide-react";
import { fetchTalentProfile, queryKeys } from "@/lib/api";
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
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/talento/${username}`
      : `/talento/${username}`;
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold">
            WorkConnect
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/register">Unirme como talento</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-12">
        <ApiState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {talent && (
            <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
              <div className="card-gradient rounded-2xl border border-border p-8 shadow-card">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-bold shadow-glow">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <h1 className="font-display text-3xl font-bold">{talent.name}</h1>
                    <p className="text-muted-foreground">@{talent.username}</p>
                    {talent.city && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {talent.city}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
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
                    <div className="mt-4 flex gap-3">
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

              <aside className="card-gradient h-fit rounded-2xl border border-border p-6 text-center shadow-card">
                <QrCode className="mx-auto h-8 w-8 text-primary-glow" />
                <p className="mt-2 text-sm font-medium">Escanea en feria o entrevista</p>
                <img src={qrSrc} alt="QR perfil WorkConnect" className="mx-auto mt-4 rounded-lg border border-border" width={200} height={200} />
                <p className="mt-3 break-all text-xs text-muted-foreground">{profileUrl}</p>
              </aside>
            </div>
          )}
        </ApiState>
      </main>
    </div>
  );
}
