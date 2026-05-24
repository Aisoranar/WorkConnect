import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { fetchJobMatchCoach, learnSkillIntro } from "@/lib/api";
import { jobMatchCoachSteps } from "@/lib/ai-loading-messages";
import { AiLoadingPanel } from "@/components/AiLoadingPanel";
import type { Job, JobMatchCoachMissingSkill, LearnSkillResult } from "@/lib/types";
import { SkillLearnDialog } from "@/components/SkillLearnDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Props = {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JobMatchCoachDialog({ job, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnData, setLearnData] = useState<LearnSkillResult | null>(null);
  const [learningSkill, setLearningSkill] = useState<string | null>(null);

  const coachQuery = useQuery({
    queryKey: ["job-match-coach", job?.id],
    queryFn: () => fetchJobMatchCoach(job!.id),
    enabled: open && Boolean(job?.id),
    staleTime: 2 * 60 * 1000,
  });

  const learnMutation = useMutation({
    mutationFn: (skill: string) => learnSkillIntro(skill),
    onSuccess: (data) => {
      setLearnData(data);
      setLearnOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = coachQuery.data;
  const isLow = (data?.current_match ?? job?.match ?? 0) < 50;
  const loadingSteps = jobMatchCoachSteps(job?.title, job?.skills);

  function goToProfileSkills(skill?: string) {
    onOpenChange(false);
    setLearnOpen(false);
    void navigate({
      to: "/dashboard/profile",
      search: { edit: "skills", ...(skill ? { skill } : {}) },
    });
  }

  function handleLearn(skill: JobMatchCoachMissingSkill) {
    const name = skill.display_name || skill.skill;
    setLearningSkill(name);
    setLearnData(null);
    setLearnOpen(true);
    learnMutation.mutate(skill.skill || name);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6">
              {isLow ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              ) : (
                <Sparkles className="h-5 w-5 shrink-0 text-primary-glow" />
              )}
              Tu match con este proyecto
            </DialogTitle>
            <DialogDescription>
              {job?.title} · {job?.company}
            </DialogDescription>
          </DialogHeader>

          {coachQuery.isLoading && (
            <AiLoadingPanel messages={loadingSteps} active={coachQuery.isLoading} />
          )}

          {coachQuery.isError && (
            <p className="text-sm text-destructive">{(coachQuery.error as Error).message}</p>
          )}

          {data && (
            <div className="space-y-4 text-sm">
              <div
                className={
                  isLow
                    ? "rounded-xl border border-warning/40 bg-warning/10 p-4"
                    : "rounded-xl border border-trust/30 bg-trust/10 p-4"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-bold tabular-nums">{data.current_match}%</span>
                  {data.estimated_match_after > data.current_match && (
                    <span className="flex items-center gap-1 text-xs text-primary-glow">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Hasta ~{data.estimated_match_after}% si mejoras
                    </span>
                  )}
                </div>
                <p className="mt-2 font-medium text-foreground">{data.alert_message}</p>
                <p className="mt-1 text-muted-foreground">{data.summary}</p>
              </div>

              {data.matched_skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Ya tienes</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.matched_skills.map((s) => (
                      <Badge key={s} variant="outline" className="border-success/40 text-success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.missing_skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Aprende para postular
                  </p>
                  <ul className="mt-2 space-y-2">
                    {data.missing_skills.map((rec) => (
                      <li
                        key={rec.skill}
                        className="rounded-lg border border-border bg-card/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{rec.display_name}</span>
                          <Badge
                            variant="outline"
                            className={
                              rec.priority === "alta" ? "border-warning/50 text-warning" : ""
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{rec.why_learn}</p>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="h-8 bg-gradient-primary text-xs"
                            disabled={
                              learnMutation.isPending && learningSkill === rec.display_name
                            }
                            onClick={() => handleLearn(rec)}
                          >
                            {learnMutation.isPending && learningSkill === rec.display_name ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <BookOpen className="mr-1 h-3 w-3" />
                            )}
                            Estudiar y evaluación
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.profile_tips.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <UserCog className="h-3.5 w-3.5" />
                    Mejora tu perfil
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {data.profile_tips.slice(0, 3).map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs italic text-muted-foreground">{data.apply_advice}</p>

              {data.ready_to_apply ? (
                <Button className="w-full" onClick={() => onOpenChange(false)}>
                  Entendido — listo para postular
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-primary"
                  onClick={() => goToProfileSkills()}
                >
                  Ir a mejorar mi perfil
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SkillLearnDialog
        open={learnOpen}
        onOpenChange={setLearnOpen}
        skillLabel={learningSkill}
        intro={learnData}
        introLoading={learnMutation.isPending}
        description="Estudia, aprueba la evaluación y luego añade la skill para mejorar tu match en este proyecto."
        onAddSkillPassed={(skill) => goToProfileSkills(skill)}
        onGoProfile={(skill) => goToProfileSkills(skill)}
      />
    </>
  );
}
