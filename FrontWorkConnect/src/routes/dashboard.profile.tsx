import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Star, Github, Linkedin, Sparkles, PlusCircle,
  Pencil, ExternalLink, Upload, CheckCircle2, AlertCircle,
} from "lucide-react";
import { fetchMe, fetchStats, queryKeys, uploadAvatar } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import type { UserProfile } from "@/lib/types";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState("perfil");

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
    enabled: !!profile,
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfile>(queryKeys.me, (old) =>
        old ? { ...old, avatar: data.avatar } : old,
      );
      toast.success("Foto de perfil actualizada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    e.target.value = "";
  }

  function openEditTab(tab: string) {
    setEditTab(tab);
    setEditOpen(true);
  }

  const initials = profile?.name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card-gradient relative overflow-hidden rounded-2xl border border-border p-6 shadow-card md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">

          {/* Avatar clickeable */}
          <div className="group relative shrink-0">
            <button
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary shadow-glow transition"
              onClick={() => fileRef.current?.click()}
              title="Cambiar foto"
            >
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-foreground">{isLoading ? "…" : initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                {avatarMutation.isPending
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Upload className="h-5 w-5 text-white" />}
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
                  <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {profile?.name ?? "—"}
                  </h1>
                </ApiState>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {profile?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {profile.city}
                    </span>
                  )}
                  {stats && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
                      {stats.rating} · {stats.projectsDone} proyecto{stats.projectsDone !== 1 ? "s" : ""}
                    </span>
                  )}
                  {profile?.verified && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-4 w-4" /> Verificado
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => openEditTab("perfil")}>
                <Pencil className="mr-2 h-4 w-4" /> Editar perfil
              </Button>
            </div>

            {profile?.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
            {!profile?.bio && !isLoading && (
              <button
                className="mt-3 text-sm text-primary-glow underline-offset-2 hover:underline"
                onClick={() => openEditTab("perfil")}
              >
                + Agregar bio profesional
              </button>
            )}

            <div className="mt-4 flex gap-2">
              {profile?.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="btn-icon-enterprise p-2">
                  <Github className="h-4 w-4" />
                </a>
              )}
              {profile?.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="btn-icon-enterprise p-2">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {!profile?.github && !isLoading && (
                <button
                  onClick={() => openEditTab("github")}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface/40 px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Github className="h-3.5 w-3.5" /> Conectar GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">

          {/* Portfolio */}
          <section className="card-gradient rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Portfolio</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditTab("github")}>
                  <Github className="mr-1.5 h-3.5 w-3.5" /> Importar GitHub
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditTab("portfolio")}>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
            </div>

            {!isLoading && (profile?.portfolio.length ?? 0) === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sin proyectos aún. Agrega tu trabajo o importa desde GitHub.</p>
                <Button size="sm" className="bg-gradient-primary" onClick={() => openEditTab("portfolio")}>
                  Agregar primer proyecto
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile?.portfolio.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-border">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="aspect-video w-full object-cover" />
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                    <div className="p-3">
                      <div className="truncate text-sm font-medium">{p.title}</div>
                      {p.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                      )}
                      {p.technologies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.technologies.slice(0, 3).map((t) => (
                            <span key={t} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs text-primary-glow hover:underline">
                          <ExternalLink className="h-3 w-3" /> Ver proyecto
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Habilidades */}
          <section className="card-gradient rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Habilidades</h2>
              <Button size="sm" variant="outline" onClick={() => openEditTab("habilidades")}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
            </div>
            {!isLoading && (profile?.skills.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Sin habilidades.{" "}
                <button className="text-primary-glow underline-offset-2 hover:underline" onClick={() => openEditTab("habilidades")}>
                  Agrega las tuyas
                </button>
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile?.skills.map((s) => (
                  <Badge key={s.id} variant="outline" className="border-border text-sm">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <AiScoreCard profile={profile} isLoading={isLoading} onImprove={() => openEditTab("perfil")} />

          <div className="card-gradient rounded-2xl border border-border p-6 shadow-card">
            <h3 className="text-sm font-semibold">Verificaciones</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Email</span>
                <span className="text-success">✓ Verificado</span>
              </li>
              <li className="flex justify-between">
                <span>GitHub</span>
                {profile?.github
                  ? <span className="text-success">✓ Conectado</span>
                  : <button className="text-primary-glow underline-offset-2 hover:underline" onClick={() => openEditTab("github")}>Conectar</button>}
              </li>
              <li className="flex justify-between">
                <span>LinkedIn</span>
                {profile?.linkedin
                  ? <span className="text-success">✓ Conectado</span>
                  : <span className="text-muted-foreground">Pendiente</span>}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {profile && (
        <EditProfileSheet
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
          defaultTab={editTab}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.me });
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── AI Score card ────────────────────────────────────────────────────────────

function AiScoreCard({
  profile,
  isLoading,
  onImprove,
}: {
  profile: UserProfile | undefined;
  isLoading: boolean;
  onImprove: () => void;
}) {
  const score = calculateLocalScore(profile);
  const tips = buildTips(profile);
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-primary-glow" : "text-warning";

  return (
    <div className="card-gradient rounded-2xl border border-border p-6 shadow-card">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary-glow">
        <Sparkles className="h-3 w-3" /> Score del perfil
      </div>
      <div className={`font-display text-5xl font-bold ${color}`}>
        {isLoading ? "—" : score}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">/100 puntos</p>
      {tips.length > 0 && (
        <ul className="mt-3 space-y-1">
          {tips.slice(0, 3).map((tip) => (
            <li key={tip} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
              {tip}
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" className="mt-4 w-full bg-gradient-primary shadow-glow" onClick={onImprove}>
        Mejorar perfil
      </Button>
    </div>
  );
}

function calculateLocalScore(profile: UserProfile | undefined): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.bio) score += 15;
  if (profile.city) score += 10;
  if (profile.avatar) score += 10;
  score += Math.min(25, profile.skills.length * 5);
  score += Math.min(20, profile.portfolio.length * 7);
  if (profile.github || profile.linkedin) score += 10;
  if (profile.experience) score += 10;
  return Math.min(100, score);
}

function buildTips(profile: UserProfile | undefined): string[] {
  if (!profile) return [];
  const tips: string[] = [];
  if (!profile.bio) tips.push("Añade una bio profesional.");
  if (!profile.avatar) tips.push("Sube una foto de perfil.");
  if (profile.skills.length < 3) tips.push("Agrega al menos 3 habilidades.");
  if (profile.portfolio.length < 2) tips.push("Sube proyectos a tu portfolio.");
  if (!profile.github) tips.push("Conecta tu GitHub para importar proyectos.");
  return tips;
}
