import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileText,
  ImagePlus,
  MessageCircleQuestion,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  careerInterviewEvaluate,
  careerInterviewStart,
  type CareerInterviewEval,
  type CareerInterviewStart,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type InterviewAiTask = "interviewStart" | "interviewEval";

type Props = {
  uiLocked: boolean;
  defaultOfferText?: string;
  defaultTargetRole?: string;
  onAiTaskChange?: (task: InterviewAiTask | null) => void;
};

function BulletList({ items, title }: { items: string[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div>
      {title && <p className="mb-1 text-xs font-semibold text-primary-glow">{title}</p>}
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function CareerInterviewPanel({
  uiLocked,
  defaultOfferText = "",
  defaultTargetRole = "",
  onAiTaskChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [offerText, setOfferText] = useState(defaultOfferText);
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sessionContext, setSessionContext] = useState("");
  const [startResult, setStartResult] = useState<CareerInterviewStart | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evalResult, setEvalResult] = useState<CareerInterviewEval | null>(null);

  const startMut = useMutation({
    mutationFn: () =>
      careerInterviewStart({
        offerText,
        targetRole,
        notes,
        files,
        mode: offerText.trim() ? "offer" : targetRole.trim() ? "target_role" : "general",
      }),
    onMutate: () => onAiTaskChange?.("interviewStart"),
    onSettled: () => onAiTaskChange?.(null),
    onSuccess: (data) => {
      setStartResult(data);
      setSessionContext(data.context_used ?? "");
      setQuestion(data.question);
      setEvalResult(null);
      setAnswer("");
      toast.success("Simulación lista — lee los tips y responde la primera pregunta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const evalMut = useMutation({
    mutationFn: () =>
      careerInterviewEvaluate({
        question,
        answer,
        context: sessionContext,
        offerText,
        targetRole,
        notes,
      }),
    onMutate: () => onAiTaskChange?.("interviewEval"),
    onSettled: () => onAiTaskChange?.(null),
    onSuccess: (data) => {
      setEvalResult(data);
      if (data.follow_up_question) setQuestion(data.follow_up_question);
      toast.success(`Puntuación: ${data.score}/100`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onFilesChange(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 5);
    setFiles(next);
  }

  const canStart =
    offerText.trim().length > 0 ||
    targetRole.trim().length > 0 ||
    notes.trim().length > 0 ||
    files.length > 0;

  const panelBusy = uiLocked || startMut.isPending || evalMut.isPending;

  return (
    <div className="card-paper space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageCircleQuestion className="h-5 w-5 text-primary-glow" />
          Coach de entrevista con IA
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube capturas de la oferta, tu CV o notas en texto. La IA analiza el material, te da tips y
          simula preguntas reales.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="interview-role">Puesto al que aspiras</Label>
          <Input
            id="interview-role"
            placeholder="Ej: Desarrollador React junior, Diseñador UI…"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            disabled={panelBusy}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="interview-offer">Texto de la oferta (opcional)</Label>
          <Textarea
            id="interview-offer"
            rows={4}
            placeholder="Pega la vacante o descripción del rol…"
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            disabled={panelBusy}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="interview-notes">Notas o contexto extra</Label>
          <Textarea
            id="interview-notes"
            rows={2}
            placeholder="Ej: es mi primera entrevista en inglés, me nervia hablar de experiencia…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={panelBusy}
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4">
        <Label className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Archivos (CV, oferta, capturas)
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, TXT, Word (.docx), imágenes PNG/JPG/WebP — máx. 5 archivos, 5 MB c/u. Las imágenes se
          leen con IA.
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.webp,image/*"
          onChange={(e) => {
            onFilesChange(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={uiLocked || files.length >= 5}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Adjuntar archivos
        </Button>
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary-glow" />
                  {f.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        className="w-full bg-gradient-primary sm:w-auto"
        disabled={panelBusy || !canStart}
        onClick={() => startMut.mutate()}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Iniciar simulación
      </Button>

      {!canStart && (
        <p className="text-xs text-warning">
          Escribe el puesto, pega una oferta, añade notas o sube al menos un archivo para empezar.
        </p>
      )}

      {startResult && (
        <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
          {startResult.materials_summary && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Material analizado: </span>
              {startResult.materials_summary}
            </p>
          )}
          {startResult.files_received && startResult.files_received.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Archivos: {startResult.files_received.map((f) => f.name).join(", ")}
            </p>
          )}
          <BulletList items={startResult.prep_tips ?? []} title="Tips antes de responder" />
          <BulletList items={startResult.practice_focus ?? []} title="Repasa hoy" />
          <div className="rounded-lg border border-border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">
              {startResult.interview_type} · {startResult.topic} · {startResult.difficulty}
            </p>
            <p className="mt-2 font-medium text-foreground">Pregunta: {question}</p>
            <BulletList items={startResult.tips ?? []} title="Pistas" />
          </div>
        </div>
      )}

      {question && startResult && (
        <div className="space-y-3">
          <Label htmlFor="interview-answer">Tu respuesta</Label>
          <Textarea
            id="interview-answer"
            rows={5}
            placeholder="Responde como en una entrevista real (método STAR si aplica)…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={panelBusy}
          />
          <Button
            disabled={panelBusy || !answer.trim()}
            onClick={() => evalMut.mutate()}
          >
            Evaluar respuesta
          </Button>
        </div>
      )}

      {evalResult && (
        <div className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-lg font-semibold tabular-nums">
            Puntuación: <span className="text-primary-glow">{evalResult.score}/100</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{evalResult.feedback}</p>
          <BulletList items={evalResult.strengths} title="Fortalezas" />
          <BulletList items={evalResult.improvements} title="Mejorar" />
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <p className="text-xs font-semibold text-primary-glow">Cómo podrías responder mejor</p>
            <p className="mt-1 text-muted-foreground">{evalResult.model_answer_hint}</p>
          </div>
          <BulletList items={evalResult.answer_tips ?? []} title="Tip para la siguiente" />
          {evalResult.follow_up_question && (
            <p className="text-sm font-medium text-foreground">
              Siguiente pregunta: {evalResult.follow_up_question}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
