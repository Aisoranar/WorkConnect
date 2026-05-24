import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  Loader2,
  PlusCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { startSkillQuiz, submitSkillQuiz } from "@/lib/api";
import { SKILL_LESSON_STEPS, SKILL_QUIZ_STEPS } from "@/lib/ai-loading-messages";
import { AiLoadingPanel } from "@/components/AiLoadingPanel";
import type { LearnSkillResult, SkillQuizQuestion, SkillQuizResult, SkillQuizStart } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Phase = "intro" | "quiz" | "result";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillLabel: string | null;
  intro: LearnSkillResult | null;
  introLoading: boolean;
  description?: string;
  onAddSkillPassed?: (skill: string) => void;
  onGoProfile?: (skill: string) => void;
};

export function SkillLearnDialog({
  open,
  onOpenChange,
  skillLabel,
  intro,
  introLoading,
  description = "Estudia lo básico y aprueba la evaluación para añadir la skill a tu perfil.",
  onAddSkillPassed,
  onGoProfile,
}: Props) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("intro");
  const [quiz, setQuiz] = useState<SkillQuizStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SkillQuizResult | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("intro");
      setQuiz(null);
      setAnswers({});
      setResult(null);
    }
  }, [open]);

  const startQuizMutation = useMutation({
    mutationFn: (skill: string) => startSkillQuiz(skill),
    onSuccess: (data) => {
      setQuiz(data);
      setAnswers({});
      setResult(null);
      setPhase("quiz");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitQuizMutation = useMutation({
    mutationFn: () => {
      if (!quiz) throw new Error("No hay evaluación activa.");
      const payload = quiz.questions.map((q) => ({
        question_id: q.id,
        option_index: answers[q.id] ?? -1,
      }));
      return submitSkillQuiz(quiz.quiz_id, payload);
    },
    onSuccess: (data) => {
      setResult(data);
      setPhase("result");
      void queryClient.invalidateQueries({ queryKey: ["skill-certifications"] });
      if (data.passed) {
        toast.success(`¡Aprobaste ${data.skill}! Ya puedes añadirla a tu perfil.`);
      } else {
        toast.message("Sigue estudiando y vuelve a intentar la evaluación.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const skill = intro?.skill ?? quiz?.skill ?? skillLabel ?? "esta habilidad";
  const allAnswered = quiz?.questions.every((q) => answers[q.id] !== undefined) ?? false;

  function handleStartQuiz() {
    const name = intro?.skill ?? skillLabel;
    if (!name) return;
    startQuizMutation.mutate(name);
  }

  function handleRetryQuiz() {
    setResult(null);
    setPhase("intro");
    setQuiz(null);
    setAnswers({});
  }

  function handleAddPassed() {
    const name = result?.skill ?? intro?.skill;
    if (!name || !result?.passed) return;
    onAddSkillPassed?.(name);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-glow" />
            Aprende: {skill}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {introLoading && !intro && (
          <AiLoadingPanel messages={SKILL_LESSON_STEPS} active={introLoading} showStepList />
        )}

        {phase === "intro" && intro && startQuizMutation.isPending && (
          <AiLoadingPanel messages={SKILL_QUIZ_STEPS} active showStepList />
        )}

        {phase === "intro" && intro && !startQuizMutation.isPending && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
              <ClipboardCheck className="mb-1 inline h-4 w-4 text-primary-glow" /> Para añadir{" "}
              <strong className="text-foreground">{intro.skill}</strong> a tu perfil debes aprobar una
              evaluación básica ({quiz?.passing_score ?? 70}% mínimo).
            </div>

            <p className="leading-relaxed text-muted-foreground">{intro.overview}</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary-glow">Por qué para ti</p>
              <p className="mt-1 text-muted-foreground">{intro.why_for_you}</p>
            </div>

            <div>
              <h4 className="font-medium">Conceptos básicos</h4>
              <ul className="mt-2 space-y-2">
                {intro.basics.map((b) => (
                  <li key={b.concept} className="rounded-lg border border-border p-3">
                    <span className="font-medium">{b.concept}</span>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{b.explanation}</p>
                    {b.example && (
                      <p className="mt-2 rounded-md bg-surface/50 px-2 py-1.5 text-xs text-foreground/90">
                        <span className="font-medium text-primary-glow">Ejemplo: </span>
                        {b.example}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Primeros pasos</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                {intro.first_steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Práctica: </span>
              {intro.practice_idea}
            </p>

            <Button
              className="w-full bg-gradient-primary"
              disabled={startQuizMutation.isPending}
              onClick={handleStartQuiz}
            >
              {startQuizMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              Comenzar evaluación
            </Button>
          </div>
        )}

        {phase === "quiz" && quiz && submitQuizMutation.isPending && (
          <AiLoadingPanel messages={SKILL_QUIZ_STEPS} active showStepList={false} />
        )}

        {phase === "quiz" && quiz && !submitQuizMutation.isPending && (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              Responde las {quiz.questions.length} preguntas. Necesitas al menos {quiz.passing_score}%
              para certificar <strong>{quiz.skill}</strong>.
            </p>
            <QuizForm
              questions={quiz.questions}
              answers={answers}
              onSelect={(id, index) => setAnswers((prev) => ({ ...prev, [id]: index }))}
            />
            <Button
              className="w-full bg-gradient-primary"
              disabled={!allAnswered || submitQuizMutation.isPending}
              onClick={() => submitQuizMutation.mutate()}
            >
              {submitQuizMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              Enviar evaluación
            </Button>
          </div>
        )}

        {phase === "result" && result && (
          <div className="space-y-4 text-sm">
            <div
              className={
                result.passed
                  ? "rounded-xl border border-success/40 bg-success/10 p-4"
                  : "rounded-xl border border-warning/40 bg-warning/10 p-4"
              }
            >
              <div className="flex items-center gap-2 font-semibold">
                {result.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-warning" />
                )}
                {result.score}% — {result.correct_count}/{result.total}
              </div>
              <p className="mt-2 text-muted-foreground">{result.message}</p>
            </div>

            {!result.passed && result.study_tip && (
              <p className="text-xs text-muted-foreground">{result.study_tip}</p>
            )}

            {!result.passed && result.review.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Repasa con calma
                </h4>
                <ul className="mt-3 space-y-3">
                  {result.review.map((item, i) => (
                    <QuizReviewCard key={i} item={item} index={i} />
                  ))}
                </ul>
              </div>
            )}

            {result.passed ? (
              <div className="flex flex-col gap-2">
                {onAddSkillPassed && (
                  <Button className="w-full bg-gradient-primary" onClick={handleAddPassed}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir «{result.skill}» a mi perfil
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const certWindow = window.open("", "_blank");
                    if (!certWindow) {
                      toast.error("Permite ventanas emergentes para descargar el certificado");
                      return;
                    }
                    const date = new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(new Date());
                    certWindow.document.write(`<!DOCTYPE html>
<html><head><title>Certificado - ${result.skill}</title>
<style>
  @page { size: landscape; margin: 0; }
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #0f172a, #1e293b); font-family: 'Segoe UI', system-ui, sans-serif; color: #e2e8f0; }
  .cert { width: 900px; padding: 60px; border: 3px solid rgba(99,102,241,0.5); border-radius: 24px; text-align: center; background: rgba(15,23,42,0.9); }
  .logo { font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #818cf8; }
  h1 { font-size: 40px; margin: 20px 0 8px; background: linear-gradient(90deg, #818cf8, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { font-size: 16px; color: #94a3b8; }
  .skill { font-size: 28px; margin: 30px 0; color: #e2e8f0; }
  .score { font-size: 18px; color: #818cf8; margin-bottom: 30px; }
  .date { font-size: 13px; color: #64748b; margin-top: 40px; }
  .id { font-size: 10px; color: #475569; margin-top: 8px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="cert">
  <div class="logo">WorkConnect</div>
  <h1>Certificado de competencia</h1>
  <p class="subtitle">Otorgado por aprobar la evaluacion de habilidad</p>
  <div class="skill">${result.skill}</div>
  <div class="score">Puntuacion: ${result.score}% (${result.correct_count}/${result.total} correctas)</div>
  <p class="date">${date}</p>
  <p class="id">ID: WC-CERT-${Date.now().toString(36).toUpperCase()}</p>
</div>
</body></html>`);
                    certWindow.document.close();
                    certWindow.focus();
                    certWindow.print();
                  }}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Descargar certificado
                </Button>
                {onGoProfile && (
                  <Button variant="outline" className="w-full" onClick={() => onGoProfile(result.skill)}>
                    Ir a guardar en perfil
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={handleRetryQuiz}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Seguir estudiando y reintentar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuizReviewCard({ item, index }: { item: SkillQuizResult["review"][number]; index: number }) {
  return (
    <li className="overflow-hidden rounded-xl border border-border text-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface/40 px-3 py-2">
        <span className="font-medium text-foreground">Pregunta {index + 1}</span>
        {item.concept && (
          <Badge variant="outline" className="text-[10px]">
            {item.concept}
          </Badge>
        )}
      </div>
      <div className="space-y-2.5 p-3">
        <p className="text-sm font-medium leading-snug text-foreground">{item.question}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Lo que elegiste
            </p>
            <p className="mt-1 text-sm text-foreground">{item.your_answer}</p>
            {item.why_yours_was_wrong && (
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{item.why_yours_was_wrong}</p>
            )}
          </div>
          <div className="rounded-lg border border-success/30 bg-success/5 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-success">
              Respuesta correcta
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.correct_answer}</p>
          </div>
        </div>

        {item.explanation && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-glow">
              Por qué es la correcta
            </p>
            <p className="mt-1 leading-relaxed text-muted-foreground">{item.explanation}</p>
          </div>
        )}

        {item.example && (
          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
              Ejemplo práctico
            </p>
            <p className="mt-1 leading-relaxed text-muted-foreground">{item.example}</p>
          </div>
        )}
      </div>
    </li>
  );
}

function QuizForm({
  questions,
  answers,
  onSelect,
}: {
  questions: SkillQuizQuestion[];
  answers: Record<string, number>;
  onSelect: (questionId: string, optionIndex: number) => void;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <fieldset key={q.id} className="rounded-lg border border-border p-3">
          <legend className="mb-2 text-sm font-medium leading-snug">
            {qi + 1}. {q.question}
          </legend>
          <p className="mb-2 text-xs text-muted-foreground">Elige la opción que mejor encaja en un proyecto real.</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-surface/60 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === oi}
                  onChange={() => onSelect(q.id, oi)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
