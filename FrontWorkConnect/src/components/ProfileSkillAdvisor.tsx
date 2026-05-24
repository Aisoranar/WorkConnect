import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  TrendingUp,
  Loader2,
  BookOpen,
  RefreshCw,
  MousePointerClick,
} from "lucide-react";
import {
  fetchSkillRecommendations,
  learnSkillIntro,
  queryKeys,
} from "@/lib/api";
import { SKILL_MARKET_STEPS } from "@/lib/ai-loading-messages";
import { AiLoadingPanel } from "@/components/AiLoadingPanel";
import type { LearnSkillResult, SkillRecommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillLearnDialog } from "@/components/SkillLearnDialog";
import { toast } from "sonner";

type Props = {
  /** Añade la skill al estado local del perfil (pestaña Skills). */
  onAddSkill?: (skill: string) => void;
  /** Skills que el usuario ya tiene — no se recomiendan de nuevo. */
  excludeSkills?: string[];
  /** `page` = bloque en /profile; `inline` = dentro de Editar perfil → Skills */
  variant?: "page" | "inline";
  enabled?: boolean;
};

function skillKey(name: string): string {
  return name.toLowerCase().replace(/[\s.\-_]+/g, "");
}

function alreadyHas(exclude: string[], name: string): boolean {
  const key = skillKey(name);
  return exclude.some((s) => skillKey(s) === key || skillKey(s).includes(key) || key.includes(skillKey(s)));
}

export function ProfileSkillAdvisor({
  onAddSkill,
  excludeSkills = [],
  variant = "page",
  enabled = true,
}: Props) {
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnData, setLearnData] = useState<LearnSkillResult | null>(null);
  const [learningSkill, setLearningSkill] = useState<string | null>(null);

  const inline = variant === "inline";

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.skillRecommendations,
    queryFn: fetchSkillRecommendations,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const recommendations = useMemo(() => {
    if (!data?.recommendations) return [];
    return data.recommendations.filter(
      (rec) => !alreadyHas(excludeSkills, rec.skill) && !alreadyHas(excludeSkills, rec.display_name),
    );
  }, [data?.recommendations, excludeSkills]);

  const learnMutation = useMutation({
    mutationFn: (skill: string) => learnSkillIntro(skill),
    onSuccess: (result) => {
      setLearnData(result);
      setLearnOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleWantLearn(rec: SkillRecommendation) {
    const name = rec.display_name || rec.skill;
    setLearningSkill(name);
    setLearnData(null);
    setLearnOpen(true);
    learnMutation.mutate(rec.skill || rec.display_name);
  }

  function handleAddSkill(name: string) {
    if (!onAddSkill) return;
    onAddSkill(name);
    toast.success(`«${name}» añadida. Pulsa «Guardar habilidades» para confirmar.`);
  }

  const wrapperClass = inline
    ? "rounded-xl border border-primary/25 bg-primary/5 p-4"
    : "card-gradient rounded-2xl border border-border p-6 shadow-card";

  return (
    <>
      <section className={wrapperClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary-glow">
              <Sparkles className="h-3 w-3" /> IA · Mercado WorkConnect
            </div>
            <h2 className={`mt-2 font-semibold ${inline ? "text-sm" : "font-display text-lg"}`}>
              {inline ? "Habilidades más demandadas" : "Skills en demanda"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {inline
                ? "Estudia con IA, aprueba la evaluación y entonces podrás añadir la skill a tu perfil."
                : "Según proyectos abiertos y tu perfil actual."}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => void refetch()}
            disabled={isFetching}
            title="Actualizar análisis"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isLoading && (
          <AiLoadingPanel
            messages={SKILL_MARKET_STEPS}
            active={isLoading}
            className={inline ? "py-4" : "py-6"}
          />
        )}

        {isError && (
          <p className="mt-3 text-sm text-destructive">
            {(error as Error)?.message ?? "No se pudo cargar el análisis."}
          </p>
        )}

        {data && !isLoading && (
          <>
            <p className={`leading-relaxed text-muted-foreground ${inline ? "mt-3 text-xs" : "mt-4 text-sm"}`}>
              {data.market_summary}
            </p>

            {data.top_demanded.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.top_demanded.slice(0, 4).map((t) => (
                  <Badge key={t.skill} variant="secondary" className="text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {t.skill} · {t.count}
                  </Badge>
                ))}
              </div>
            )}

            {recommendations.length === 0 ? (
              <p className="mt-3 text-sm text-success">
                ¡Buen trabajo! Ya cubres las habilidades más pedidas en la plataforma.
              </p>
            ) : (
              <ul className={`space-y-2 ${inline ? "mt-3" : "mt-4 space-y-3"}`}>
                {recommendations.map((rec) => {
                  const label = rec.display_name || rec.skill;
                  const isLearning =
                    learnMutation.isPending &&
                    (learningSkill === label || learningSkill === rec.skill);

                  return (
                    <li
                      key={rec.skill}
                      className="rounded-lg border border-border bg-card/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        <Badge
                          variant="outline"
                          className={
                            rec.priority === "alta"
                              ? "border-success/50 text-success text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {rec.demand_percent}% demanda
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {rec.why_learn}
                      </p>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          className="h-8 bg-gradient-primary text-xs shadow-glow"
                          disabled={isLearning}
                          onClick={() => handleWantLearn(rec)}
                        >
                          {isLearning ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MousePointerClick className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Estudiar y hacer evaluación
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>

      <SkillLearnDialog
        open={learnOpen}
        onOpenChange={setLearnOpen}
        skillLabel={learningSkill}
        intro={learnData}
        introLoading={learnMutation.isPending}
        onAddSkillPassed={
          onAddSkill
            ? (skill) => {
                onAddSkill(skill);
                toast.success(`«${skill}» certificada. Pulsa «Guardar habilidades» para confirmar.`);
              }
            : undefined
        }
      />
    </>
  );
}
