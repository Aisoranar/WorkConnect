import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Github, Loader2, Sparkles, Star, Check, RefreshCw } from "lucide-react";
import { fetchGithubRepos, generateProfileFromGithub, queryKeys } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GitHubGeneratedProfile, GitHubRepo } from "@/lib/types";

type Props = {
  initialGithubUrl?: string | null;
  currentBio?: string | null;
  onApply: (result: { bio: string; skills: string[] }) => void;
};

const MAX_REPOS_FOR_AI = 15;

function extractUsername(url: string): string {
  const m = url.match(/github\.com\/([^/\s]+)/);
  return m ? m[1] : url.trim();
}

function prepareRepoForApi(repo: GitHubRepo) {
  const desc = repo.description?.trim() ?? "";
  return {
    name: repo.name,
    description: desc.length > 500 ? `${desc.slice(0, 497)}…` : desc || null,
    language: repo.language,
    topics: (repo.topics ?? []).slice(0, 20),
  };
}

export function GitHubImporter({ initialGithubUrl, currentBio, onApply }: Props) {
  const [username, setUsername] = useState(() =>
    initialGithubUrl ? extractUsername(initialGithubUrl) : "",
  );
  const [searchInput, setSearchInput] = useState(username);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<GitHubGeneratedProfile | null>(null);
  const [filter, setFilter] = useState("");

  const reposQuery = useQuery({
    queryKey: queryKeys.githubRepos(username),
    queryFn: () => fetchGithubRepos(username),
    enabled: username.length > 0,
    retry: false,
  });

  const repos = reposQuery.data ?? [];
  const filtered = filter.trim()
    ? repos.filter((r) =>
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        (r.language ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : repos;

  const generateMutation = useMutation({
    mutationFn: () => {
      const selectedRepos = repos
        .filter((r) => selected.has(r.name))
        .slice(0, MAX_REPOS_FOR_AI)
        .map(prepareRepoForApi);
      return generateProfileFromGithub(selectedRepos, currentBio);
    },
    onSuccess: (data) => {
      setGenerated(data);
      toast.success("Perfil generado. Revisa y aplica los cambios.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleRepo(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        return next;
      }
      if (next.size >= MAX_REPOS_FOR_AI) {
        toast.message(`Máximo ${MAX_REPOS_FOR_AI} repositorios para la IA.`);
        return prev;
      }
      next.add(name);
      return next;
    });
  }

  function selectAllRepos() {
    const names = repos.slice(0, MAX_REPOS_FOR_AI).map((r) => r.name);
    setSelected(new Set(names));
    if (repos.length > MAX_REPOS_FOR_AI) {
      toast.message(`Se seleccionaron los primeros ${MAX_REPOS_FOR_AI} (límite de la IA).`);
    }
  }

  function handleLoad() {
    const u = searchInput.trim();
    if (!u) return;
    setUsername(extractUsername(u));
    setSelected(new Set());
    setGenerated(null);
  }

  return (
    <div className="space-y-5">
      {/* Username input */}
      <div className="space-y-2">
        <Label>Usuario de GitHub</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              placeholder="ej: johndoe"
              className="pl-9 border-border bg-surface/60"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleLoad}
            disabled={reposQuery.isFetching || !searchInput.trim()}
          >
            {reposQuery.isFetching
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Cargar repos</span>
          </Button>
        </div>
        {reposQuery.isError && (
          <p className="text-xs text-destructive">
            {(reposQuery.error as Error).message}
          </p>
        )}
      </div>

      {/* Repo list */}
      {repos.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {repos.length} repositorios · máx. {MAX_REPOS_FOR_AI} para IA
              {selected.size > 0 && (
                <span className="ml-2 text-primary-glow">
                  ({selected.size}/{MAX_REPOS_FOR_AI} seleccionados)
                </span>
              )}
            </p>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() =>
                selected.size > 0 && selected.size === Math.min(repos.length, MAX_REPOS_FOR_AI)
                  ? setSelected(new Set())
                  : selectAllRepos()
              }
            >
              {selected.size > 0 && selected.size === Math.min(repos.length, MAX_REPOS_FOR_AI)
                ? "Deseleccionar todos"
                : `Seleccionar hasta ${MAX_REPOS_FOR_AI}`}
            </button>
          </div>

          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por nombre o lenguaje…"
            className="border-border bg-surface/60"
          />

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {filtered.map((repo) => (
              <RepoCard
                key={repo.name}
                repo={repo}
                selected={selected.has(repo.name)}
                onToggle={() => toggleRepo(repo.name)}
              />
            ))}
          </div>

          <Button
            className="w-full bg-gradient-primary shadow-glow"
            disabled={selected.size === 0 || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Sparkles className="mr-2 h-4 w-4" />}
            Generar perfil con IA ({selected.size} repo{selected.size !== 1 ? "s" : ""})
          </Button>
        </div>
      )}

      {/* Generated result */}
      {generated && (
        <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-glow">
            <Sparkles className="h-4 w-4" />
            Perfil generado
            {generated.source === "local" && (
              <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">sin IA</span>
            )}
          </div>

          {generated.bio && (
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">Bio generada</p>
              <p className="text-sm leading-relaxed text-foreground">{generated.bio}</p>
            </div>
          )}

          {generated.skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Tecnologías detectadas ({generated.skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {generated.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-primary/30 bg-surface/80 px-3 py-1 text-xs font-medium text-primary-glow"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-primary"
            onClick={() =>
              onApply({
                bio: generated.bio,
                skills: generated.skills.slice(0, 30),
              })
            }
          >
            <Check className="mr-2 h-4 w-4" />
            Aplicar a mi perfil
          </Button>
        </div>
      )}
    </div>
  );
}

function RepoCard({
  repo,
  selected,
  onToggle,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-surface/40 hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}>
          {selected && <Check className="h-3 w-3" />}
        </div>
        <span className="truncate text-sm font-medium">{repo.name}</span>
        {repo.language && (
          <span className="ml-auto shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {repo.language}
          </span>
        )}
        {repo.stars > 0 && (
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
            <Star className="h-3 w-3" /> {repo.stars}
          </span>
        )}
      </div>
      {repo.description && (
        <p className="ml-6 mt-0.5 line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>
      )}
      {repo.topics.length > 0 && (
        <div className="ml-6 mt-1 flex flex-wrap gap-1">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary-glow">{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}
