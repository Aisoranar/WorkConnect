import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, X, PlusCircle, Trash2, ExternalLink, Upload, Pencil } from "lucide-react";
import {
  fetchAllSkills,
  improveBio,
  updateProfile,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  uploadPortfolioImage,
  queryKeys,
} from "@/lib/api";
import type { PortfolioItem, UserProfile } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitHubImporter } from "@/components/GitHubImporter";
import { ProfileSkillAdvisor } from "@/components/ProfileSkillAdvisor";

type Props = {
  profile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
  pendingSkill?: string | null;
  onPendingSkillConsumed?: () => void;
  onSaved: () => void;
};

export function EditProfileSheet({
  profile,
  open,
  onOpenChange,
  defaultTab = "perfil",
  pendingSkill = null,
  onPendingSkillConsumed,
  onSaved,
}: Props) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>Editar perfil</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="habilidades">Skills</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="perfil" className="mt-0">
              <ProfileTab profile={profile} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="habilidades" className="mt-0">
              <SkillsTab
                profile={profile}
                onSaved={onSaved}
                pendingSkill={pendingSkill}
                onPendingSkillConsumed={onPendingSkillConsumed}
              />
            </TabsContent>
            <TabsContent value="portfolio" className="mt-0">
              <PortfolioTab profile={profile} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="github" className="mt-0">
              <GithubTab profile={profile} onSaved={onSaved} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: profile.name ?? "",
    city: profile.city ?? "",
    github: profile.github ?? "",
    linkedin: profile.linkedin ?? "",
    experience: profile.experience ?? "",
    bio: profile.bio ?? "",
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile(profile.id, {
        name: form.name.trim() || undefined,
        city: form.city.trim() || null,
        github: form.github.trim() || null,
        linkedin: form.linkedin.trim() || null,
        experience: form.experience.trim() || null,
        bio: form.bio.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Perfil actualizado.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bioMutation = useMutation({
    mutationFn: () => improveBio(form.bio),
    onSuccess: (improved) => {
      setForm((prev) => ({ ...prev, bio: improved }));
      toast.success("Bio mejorada con IA.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nombre</Label>
        <Input value={form.name} onChange={set("name")} placeholder="Tu nombre completo" />
      </div>

      <div className="space-y-1.5">
        <Label>Ciudad</Label>
        <Input value={form.city} onChange={set("city")} placeholder="Ej: Bogotá, Colombia" />
      </div>

      <div className="space-y-1.5">
        <Label>GitHub</Label>
        <Input value={form.github} onChange={set("github")} placeholder="https://github.com/usuario" />
      </div>

      <div className="space-y-1.5">
        <Label>LinkedIn</Label>
        <Input value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/usuario" />
      </div>

      <div className="space-y-1.5">
        <Label>Experiencia</Label>
        <Input value={form.experience} onChange={set("experience")} placeholder="Ej: 3 años en desarrollo web" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Bio profesional</Label>
          <button
            type="button"
            onClick={() => bioMutation.mutate()}
            disabled={bioMutation.isPending || !form.bio.trim()}
            className="flex items-center gap-1 text-xs text-primary-glow underline-offset-2 hover:underline disabled:opacity-40"
          >
            {bioMutation.isPending
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Sparkles className="h-3 w-3" />}
            Mejorar con IA
          </button>
        </div>
        <Textarea
          value={form.bio}
          onChange={set("bio")}
          placeholder="Cuéntanos sobre ti, tu experiencia y lo que ofreces…"
          className="min-h-[120px] resize-none"
        />
      </div>

      <Button
        className="w-full bg-gradient-primary shadow-glow"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  );
}

// ─── Tab: Habilidades ─────────────────────────────────────────────────────────

function SkillsTab({
  profile,
  onSaved,
  pendingSkill,
  onPendingSkillConsumed,
}: {
  profile: UserProfile;
  onSaved: () => void;
  pendingSkill?: string | null;
  onPendingSkillConsumed?: () => void;
}) {
  const [skills, setSkills] = useState<string[]>(profile.skills.map((s) => s.name));
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!pendingSkill?.trim()) return;
    const trimmed = pendingSkill.trim();
    if (!skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    onPendingSkillConsumed?.();
  }, [pendingSkill]);

  const { data: allSkills = [] } = useQuery({
    queryKey: ["all-skills"],
    queryFn: fetchAllSkills,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = input.trim()
    ? allSkills
        .filter(
          (s) =>
            s.name.toLowerCase().includes(input.toLowerCase()) &&
            !skills.includes(s.name),
        )
        .slice(0, 5)
    : [];

  function addSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setInput("");
  }

  function removeSkill(name: string) {
    setSkills((prev) => prev.filter((s) => s !== name));
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile(profile.id, { skill_names: skills }),
    onSuccess: () => {
      toast.success("Habilidades actualizadas.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isFreelancer = profile.role === "freelancer" || profile.role === "admin";

  return (
    <div className="space-y-4">
      {isFreelancer && (
        <ProfileSkillAdvisor
          variant="inline"
          excludeSkills={skills}
          onAddSkill={addSkill}
          enabled={isFreelancer}
        />
      )}

      <div className="space-y-1.5">
        <Label>Agregar habilidad</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill(input);
                }
              }}
              placeholder="Ej: React, Python, Figma…"
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface/60"
                      onClick={() => addSkill(s.name)}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="outline" onClick={() => addSkill(input)} disabled={!input.trim()}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s} variant="outline" className="gap-1.5 border-border pr-1 text-sm">
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="rounded-full hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin habilidades aún. Usa las recomendaciones de arriba, escribe una y pulsa Enter, o pulsa Agregar.
        </p>
      )}

      <Button
        className="w-full bg-gradient-primary shadow-glow"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar habilidades
      </Button>
    </div>
  );
}

// ─── Tab: Portfolio ───────────────────────────────────────────────────────────

type PortfolioForm = {
  title: string;
  description: string;
  url: string;
  technologies: string;
};

const emptyForm = (): PortfolioForm => ({ title: "", description: "", url: "", technologies: "" });

function PortfolioTab({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<PortfolioForm>(emptyForm());
  const imgRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  function setField(key: keyof PortfolioForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setAdding(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      url: item.url ?? "",
      technologies: item.technologies.join(", "),
    });
    setAdding(true);
  }

  function closeForm() {
    setAdding(false);
    setEditing(null);
    setForm(emptyForm());
  }

  const technologies = form.technologies
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: form.url.trim() || null,
        technologies,
      };
      return editing
        ? updatePortfolioProject(editing.id, payload)
        : createPortfolioProject(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Proyecto actualizado." : "Proyecto agregado.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      closeForm();
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePortfolioProject(id),
    onSuccess: () => {
      toast.success("Proyecto eliminado.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const imgMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadPortfolioImage(id, file),
    onSuccess: () => {
      toast.success("Imagen subida.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && uploadTarget !== null) imgMutation.mutate({ id: uploadTarget, file });
    e.target.value = "";
  }

  const items: PortfolioItem[] = profile.portfolio ?? [];

  return (
    <div className="space-y-4">
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

      {!adding && (
        <Button variant="outline" className="w-full" onClick={openAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar proyecto
        </Button>
      )}

      {adding && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">{editing ? "Editar proyecto" : "Nuevo proyecto"}</p>

          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={setField("title")} placeholder="Mi proyecto increíble" />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={setField("description")}
              placeholder="¿De qué se trata?"
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input value={form.url} onChange={setField("url")} placeholder="https://miproyecto.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Tecnologías (separadas por coma)</Label>
            <Input value={form.technologies} onChange={setField("technologies")} placeholder="React, Laravel, Tailwind" />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-primary"
              disabled={!form.title.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guardar" : "Agregar"}
            </Button>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin proyectos aún.</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-border">
            <div className="relative">
              {item.image ? (
                <img src={item.image} alt={item.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <button
                type="button"
                className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                onClick={() => {
                  setUploadTarget(item.id);
                  imgRef.current?.click();
                }}
                title="Cambiar imagen"
              >
                {imgMutation.isPending && uploadTarget === item.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Upload className="h-4 w-4" />}
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  )}
                  {item.technologies.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.technologies.map((t) => (
                        <span key={t} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-primary-glow hover:underline">
                      <ExternalLink className="h-3 w-3" /> Ver proyecto
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: GitHub + IA ─────────────────────────────────────────────────────────

function GithubTab({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: ({ bio, skills }: { bio: string; skills: string[] }) =>
      updateProfile(profile.id, {
        bio: bio || undefined,
        skill_names: skills.length > 0 ? skills : undefined,
      }),
    onSuccess: () => {
      toast.success("Perfil actualizado desde GitHub.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Importa tus repositorios públicos, selecciona los que quieras incluir y la IA generará tu bio y
        extraerá las tecnologías que usas.
      </p>

      {applyMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Aplicando perfil…
        </div>
      )}

      <GitHubImporter
        initialGithubUrl={profile.github}
        currentBio={profile.bio}
        onApply={(result) => applyMutation.mutate(result)}
      />
    </div>
  );
}
