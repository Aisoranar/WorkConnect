import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PlusCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { startSkillQuiz, submitSkillQuiz } from "@/lib/api";
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
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Preparando tu lección…
          </div>
        )}

        {phase === "intro" && intro && (
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
                    <p className="mt-1 text-xs text-muted-foreground">{b.explanation}</p>
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

        {phase === "quiz" && quiz && (
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
                <h4 className="font-medium">Repasa esto</h4>
                <ul className="mt-2 space-y-2">
                  {result.review.map((item, i) => (
                    <li key={i} className="rounded-lg border border-border p-3 text-xs">
                      <p className="font-medium">{item.question}</p>
                      <p className="mt-1 text-destructive">Tu respuesta: {item.your_answer}</p>
                      <p className="text-success">Correcta: {item.correct_answer}</p>
                      {item.explanation && (
                        <p className="mt-1 text-muted-foreground">{item.explanation}</p>
                      )}
                    </li>
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
          <legend className="mb-2 text-sm font-medium">
            {qi + 1}. {q.question}
          </legend>
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
