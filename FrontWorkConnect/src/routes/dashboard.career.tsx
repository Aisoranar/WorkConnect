import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CareerAiLoadingModal } from "@/components/career/CareerAiLoadingModal";
import { CareerCvStudio } from "@/components/career/CareerCvStudio";
import { CAREER_LOADING_TASKS, type CareerLoadingTask } from "@/components/career/career-loading-tasks";
import { useCareerAiLoading } from "@/hooks/use-career-ai-loading";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  Target,
  Briefcase,
  GraduationCap,
  MessageCircleQuestion,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { guardRole } from "@/lib/auth-guard";
import {
  careerAnalyzeOffer,
  careerAnalyzeProfile,
  careerDiscoverAchievements,
  careerImproveCv,
  careerImproveLinkedIn,
  careerInterviewEvaluate,
  careerInterviewStart,
  careerReadiness,
  careerStudyPlan,
  careerTargetRole,
  fetchExternalJobs,
  fetchMe,
  queryKeys,
  type CareerCvResult,
  type CareerLinkedInResult,
  type CareerOfferAnalysis,
  type CareerProfileAnalysis,
  type CareerReadiness,
  type CareerStudyPlan,
  type CareerTargetRolePath,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/career")({
  beforeLoad: () => {
    guardRole("freelancer", "admin");
  },
  component: CareerAssistantPage,
});

function ResultBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
      <h3 className="text-sm font-semibold text-primary-glow">{title}</h3>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-inside list-disc space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function JobsListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <li key={i} className="animate-pulse rounded-xl border border-border p-4">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-3 h-12 w-full rounded bg-muted/70" />
        </li>
      ))}
    </ul>
  );
}

function resolveActiveLoadingTask(flags: {
  profile: boolean;
  achievements: boolean;
  cv: boolean;
  linkedin: boolean;
  offer: boolean;
  studyPlan: boolean;
  readiness: boolean;
  role: boolean;
  interviewStart: boolean;
  interviewEval: boolean;
}): CareerLoadingTask | null {
  if (flags.profile) return CAREER_LOADING_TASKS.profile;
  if (flags.achievements) return CAREER_LOADING_TASKS.achievements;
  if (flags.cv) return CAREER_LOADING_TASKS.cv;
  if (flags.linkedin) return CAREER_LOADING_TASKS.linkedin;
  if (flags.studyPlan) return CAREER_LOADING_TASKS.studyPlan;
  if (flags.readiness) return CAREER_LOADING_TASKS.readiness;
  if (flags.offer) return CAREER_LOADING_TASKS.offer;
  if (flags.role) return CAREER_LOADING_TASKS.role;
  if (flags.interviewEval) return CAREER_LOADING_TASKS.interviewEval;
  if (flags.interviewStart) return CAREER_LOADING_TASKS.interviewStart;
  return null;
}

function CareerAssistantPage() {
  const [offerText, setOfferText] = useState("");
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [achievementNotes, setAchievementNotes] = useState("");
  const [profile, setProfile] = useState<CareerProfileAnalysis | null>(null);
  const [offerAnalysis, setOfferAnalysis] = useState<CareerOfferAnalysis | null>(null);
  const [studyPlan, setStudyPlan] = useState<CareerStudyPlan | null>(null);
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [cvResult, setCvResult] = useState<CareerCvResult | null>(null);
  const [linkedinResult, setLinkedinResult] = useState<CareerLinkedInResult | null>(null);
  const [interviewQ, setInterviewQ] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);
  const [targetRoleResult, setTargetRoleResult] = useState<CareerTargetRolePath | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["career-external-jobs"],
    queryFn: fetchExternalJobs,
  });

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
  });

  const profileMut = useMutation({
    mutationFn: careerAnalyzeProfile,
    onSuccess: (d) => {
      setProfile(d);
      toast.success("Perfil analizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const achievementsMut = useMutation({
    mutationFn: () => careerDiscoverAchievements(achievementNotes || undefined),
    onSuccess: () => toast.success("Logros generados"),
    onError: (e: Error) => toast.error(e.message),
  });

  const cvMut = useMutation({
    mutationFn: careerImproveCv,
    onSuccess: (d) => {
      setCvResult(d);
      toast.success(`CV optimizado · ATS ${d.ats_score ?? 0}%`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkedinMut = useMutation({
    mutationFn: careerImproveLinkedIn,
    onSuccess: (d) => {
      setLinkedinResult(d);
      toast.success("LinkedIn alineado con tu CV");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const offerMut = useMutation({
    mutationFn: () => careerAnalyzeOffer(offerText, offerFile ?? undefined),
    onSuccess: (d) => {
      setOfferAnalysis(d);
      toast.success("Oferta analizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const planMut = useMutation({
    mutationFn: () => careerStudyPlan(offerText, targetRole || undefined),
    onSuccess: (d) => {
      setStudyPlan(d);
      toast.success("Plan de estudio listo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readinessMut = useMutation({
    mutationFn: () => careerReadiness(offerText),
    onSuccess: (d) => {
      setReadiness(d);
      toast.success("Evaluación completada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: () => careerTargetRole(targetRole),
    onSuccess: (d) => {
      setTargetRoleResult(d);
      toast.success("Ruta generada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const interviewStartMut = useMutation({
    mutationFn: () => careerInterviewStart(offerText || targetRole, offerText ? "offer" : "target_role"),
    onSuccess: (d) => {
      setInterviewQ(d.question);
      setInterviewFeedback(null);
      toast.success("Entrevista iniciada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const interviewEvalMut = useMutation({
    mutationFn: () =>
      careerInterviewEvaluate(interviewQ, interviewAnswer, offerText || targetRole),
    onSuccess: (d) => {
      setInterviewFeedback(d.feedback);
      if (d.follow_up_question) setInterviewQ(d.follow_up_question);
      toast.success(`Puntuación: ${d.score}/100`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const achievements = achievementsMut.data;

  const loadingFlags = useMemo(
    () => ({
      profile: profileMut.isPending,
      achievements: achievementsMut.isPending,
      cv: cvMut.isPending,
      linkedin: linkedinMut.isPending,
      offer: offerMut.isPending,
      studyPlan: planMut.isPending,
      readiness: readinessMut.isPending,
      role: roleMut.isPending,
      interviewStart: interviewStartMut.isPending,
      interviewEval: interviewEvalMut.isPending,
    }),
    [
      profileMut.isPending,
      achievementsMut.isPending,
      cvMut.isPending,
      linkedinMut.isPending,
      offerMut.isPending,
      planMut.isPending,
      readinessMut.isPending,
      roleMut.isPending,
      interviewStartMut.isPending,
      interviewEvalMut.isPending,
    ],
  );

  const activeTask = resolveActiveLoadingTask(loadingFlags);
  const isAiBusy = activeTask !== null;
  const aiLoading = useCareerAiLoading(activeTask);
  const uiLocked = aiLoading.open;

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-10" aria-busy={isAiBusy || aiLoading.open}>
      <CareerAiLoadingModal
        open={aiLoading.open}
        phase={aiLoading.phase}
        title={aiLoading.task?.title ?? "Procesando con IA"}
        subtitle={aiLoading.task?.subtitle}
        steps={aiLoading.task?.steps ?? []}
        progress={aiLoading.progress}
        currentStepIndex={aiLoading.stepIndex}
        isFinalizing={aiLoading.isFinalizing}
      />
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary-glow">
          <Sparkles className="h-3.5 w-3.5" />
          NVIDIA Developers · Mentor laboral con IA
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          <span className="text-gradient">Asistente de carrera</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Analiza tu perfil, mejora CV y LinkedIn, estudia para vacantes, simula entrevistas y encuentra empleos
          compatibles. No solo redacta bonito: te prepara para el mercado real.
        </p>
      </div>

      <Tabs
        defaultValue="profile"
        className={aiLoading.open ? "pointer-events-none w-full opacity-60" : "w-full"}
      >
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-surface/60 p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="offer" className="text-xs sm:text-sm">
            Oferta
          </TabsTrigger>
          <TabsTrigger value="role" className="text-xs sm:text-sm">
            Puesto
          </TabsTrigger>
          <TabsTrigger value="cv" className="text-xs sm:text-sm">
            CV con IA
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs sm:text-sm">
            Empleos
          </TabsTrigger>
          <TabsTrigger value="interview" className="text-xs sm:text-sm">
            Entrevista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="card-paper p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Target className="h-5 w-5 text-primary-glow" />
              Análisis de perfil profesional
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fortalezas, debilidades, tips ATS y acciones prioritarias.
            </p>
            <Button
              className="mt-4 bg-gradient-primary"
              disabled={uiLocked}
              onClick={() => profileMut.mutate()}
            >
              {profileMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {profileMut.isPending ? "Analizando perfil…" : "Analizar mi perfil"}
            </Button>
            {profile && (
              <ResultBox title={`Score ${profile.score}% · ${profile.source}`}>
                <p className="text-foreground/90">{profile.summary}</p>
                {profile.ai_summary && <p className="italic">{profile.ai_summary}</p>}
                <p className="font-medium text-foreground">Fortalezas</p>
                <BulletList items={profile.strengths} />
                <p className="font-medium text-foreground">A mejorar</p>
                <BulletList items={profile.weaknesses} />
                <p className="font-medium text-foreground">Potencial oculto</p>
                <BulletList items={profile.hidden_potential} />
                <p className="font-medium text-foreground">Acciones esta semana</p>
                <BulletList items={profile.priority_actions} />
              </ResultBox>
            )}
          </div>

          <div className="card-paper p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Trophy className="h-5 w-5 text-primary-glow" />
              ¿Cuáles son mis logros?
            </h2>
            <Label className="mt-3">Describe tareas en tus palabras (opcional)</Label>
            <Textarea
              className="mt-2"
              placeholder="Ej: revisaba alertas Linux, instalaba herramientas..."
              value={achievementNotes}
              onChange={(e) => setAchievementNotes(e.target.value)}
              rows={3}
              disabled={uiLocked}
            />
            <Button
              className="mt-3"
              variant="outline"
              disabled={uiLocked}
              onClick={() => achievementsMut.mutate()}
            >
              {achievementsMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {achievementsMut.isPending ? "Buscando logros…" : "Descubrir logros con IA"}
            </Button>
            {achievements && (
              <ul className="mt-4 space-y-3">
                {achievements.achievements.map((a, i) => (
                  <li key={i} className="rounded-lg border border-border p-3 text-sm">
                    <span className="text-destructive/80 line-through">{a.weak}</span>
                    <p className="mt-2 font-medium text-foreground">{a.strong}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="offer" className="mt-4 space-y-4">
          <div className="card-paper p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Briefcase className="h-5 w-5 text-primary-glow" />
              Quiero aplicar a esta oferta
            </h2>
            <Label className="mt-3">Pega el texto de la vacante</Label>
            <Textarea
              className="mt-2"
              rows={6}
              placeholder="Requisitos, responsabilidades, stack..."
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              disabled={uiLocked}
            />
            <Label className="mt-3">O adjunta TXT / PDF / imagen</Label>
            <Input
              className="mt-2"
              type="file"
              accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
              disabled={uiLocked}
              onChange={(e) => setOfferFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={uiLocked} onClick={() => offerMut.mutate()}>
                {offerMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {offerMut.isPending ? "Analizando…" : "Analizar oferta"}
              </Button>
              <Button variant="outline" disabled={uiLocked || !offerText.trim()} onClick={() => planMut.mutate()}>
                {planMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {planMut.isPending ? "Generando plan…" : "Plan de estudio"}
              </Button>
              <Button
                variant="outline"
                disabled={uiLocked || !offerText.trim()}
                onClick={() => readinessMut.mutate()}
              >
                {readinessMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {readinessMut.isPending ? "Evaluando…" : "¿Estoy preparado?"}
              </Button>
            </div>
            {offerAnalysis && (
              <ResultBox title={`Compatibilidad ${offerAnalysis.compatibility_percent}%`}>
                <p>{offerAnalysis.summary}</p>
                <p>
                  <strong>Recomendación:</strong> {offerAnalysis.apply_recommendation}
                </p>
                <p className="font-medium text-foreground">Skills que tienes</p>
                <BulletList items={offerAnalysis.matched_skills} />
                <p className="font-medium text-foreground">Te faltan</p>
                <BulletList items={offerAnalysis.missing_skills} />
              </ResultBox>
            )}
            {studyPlan && (
              <ResultBox title="Plan de estudio personalizado">
                {studyPlan.weeks.map((w) => (
                  <div key={w.week} className="mb-3">
                    <p className="font-medium text-foreground">
                      Semana {w.week}: {w.focus}
                    </p>
                    <BulletList items={w.tasks} />
                  </div>
                ))}
                <p className="font-medium text-foreground">Cursos gratuitos</p>
                <ul className="space-y-2">
                  {studyPlan.free_courses.map((c) => (
                    <li key={c.url}>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-primary-glow underline">
                        {c.title}
                      </a>{" "}
                      — {c.provider}
                    </li>
                  ))}
                </ul>
              </ResultBox>
            )}
            {readiness && (
              <ResultBox title={`Veredicto: ${readiness.verdict}`}>
                <p className="flex items-center gap-2">
                  {readiness.can_apply_now ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : null}
                  Confianza {readiness.confidence_percent}% —{" "}
                  {readiness.can_apply_now ? "Puedes aplicar" : "Prepara antes de aplicar"}
                </p>
                <BulletList items={readiness.improve_before_apply} />
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  disabled={uiLocked}
                  onClick={() => interviewStartMut.mutate()}
                >
                  <MessageCircleQuestion className="mr-2 h-4 w-4" />
                  Simular entrevista para esta oferta
                </Button>
              </ResultBox>
            )}

            {studyPlan && !readiness && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uiLocked || !offerText.trim()}
                  onClick={() => readinessMut.mutate()}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  ¿Ya estoy preparado?
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="role" className="mt-4">
          <div className="card-paper p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-5 w-5 text-primary-glow" />
              Puesto al que aspiro
            </h2>
            <Input
              className="mt-3"
              placeholder="Ej: Desarrollador Full Stack Junior"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={uiLocked}
            />
            <Button
              className="mt-4"
              disabled={!targetRole.trim() || uiLocked}
              onClick={() => roleMut.mutate()}
            >
              {roleMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {roleMut.isPending ? "Generando ruta…" : "Cómo aplicar y qué estudiar"}
            </Button>
            {targetRoleResult && (
              <ResultBox title="Ruta profesional">
                <p className="text-foreground/90">{targetRoleResult.market_summary}</p>
                {targetRoleResult.salary_range && (
                  <p className="font-medium text-primary-glow">Rango salarial: {targetRoleResult.salary_range}</p>
                )}
                <p className="font-medium text-foreground">Cómo aplicar</p>
                <BulletList items={targetRoleResult.how_to_apply ?? []} />
                <p className="font-medium text-foreground">Brecha actual</p>
                <BulletList items={targetRoleResult.current_gap_analysis ?? []} />
                {targetRoleResult.skills_to_learn?.length > 0 && (
                  <>
                    <p className="font-medium text-foreground">Skills a aprender</p>
                    <div className="flex flex-wrap gap-1">
                      {targetRoleResult.skills_to_learn.map((s) => (
                        <span key={s} className="chip chip-primary text-[10px]">{s}</span>
                      ))}
                    </div>
                  </>
                )}
                {targetRoleResult.roadmap?.length > 0 && (
                  <>
                    <p className="font-medium text-foreground">Roadmap</p>
                    <BulletList items={targetRoleResult.roadmap} />
                  </>
                )}
                {targetRoleResult.free_courses?.length > 0 && (
                  <>
                    <p className="font-medium text-foreground">Cursos gratuitos recomendados</p>
                    <ul className="space-y-1">
                      {targetRoleResult.free_courses.map((c) => (
                        <li key={c.url}>
                          <a href={c.url} target="_blank" rel="noreferrer" className="text-primary-glow underline text-xs">
                            {c.title}
                          </a>{" "}
                          <span className="text-[10px] text-muted-foreground">— {c.provider}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </ResultBox>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cv" className="mt-4">
          <CareerCvStudio
            uiLocked={uiLocked}
            cvLoading={cvMut.isPending}
            linkedinLoading={linkedinMut.isPending}
            cvResult={cvResult}
            linkedinResult={linkedinResult}
            candidateName={meQuery.data?.name}
            profileLinkedIn={meQuery.data?.linkedin}
            onGenerateCv={(payload) => cvMut.mutate(payload)}
            onImproveLinkedIn={(payload) => linkedinMut.mutate(payload)}
          />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="card-paper p-4 sm:p-6">
            <h2 className="font-semibold">Empleos de la semana (5+)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Listado curado compatible con tu perfil. Te redirige a la fuente para postular.
            </p>
            {jobsQuery.isLoading && <JobsListSkeleton />}
            {jobsQuery.isError && (
              <p className="mt-4 text-sm text-destructive">
                No se pudieron cargar empleos. {(jobsQuery.error as Error)?.message}
              </p>
            )}
            {!jobsQuery.isLoading && (
            <ul className="mt-4 space-y-3">
              {(jobsQuery.data ?? []).map((job) => (
                <li key={job.id} className="rounded-xl border border-border p-4">
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {job.company} · {job.location}
                  </div>
                  <p className="mt-2 text-sm">{job.summary}</p>
                  {job.skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills.map((s) => (
                        <span key={s} className="chip chip-primary text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button asChild size="sm" className="mt-3" variant="outline">
                    <a href={job.apply_url} target="_blank" rel="noreferrer">
                      Postular <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interview" className="mt-4">
          <div className="card-paper p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageCircleQuestion className="h-5 w-5 text-primary-glow" />
              Simulación técnica
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa una oferta o puesto en las otras pestañas como contexto, luego inicia la entrevista.
            </p>
            <Button className="mt-4" disabled={uiLocked} onClick={() => interviewStartMut.mutate()}>
              {interviewStartMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {interviewStartMut.isPending ? "Preparando…" : "Iniciar simulación"}
            </Button>
            {interviewQ && (
              <>
                <p className="mt-4 font-medium text-foreground">Pregunta: {interviewQ}</p>
                <Textarea
                  className="mt-2"
                  rows={4}
                  placeholder="Tu respuesta..."
                  value={interviewAnswer}
                  onChange={(e) => setInterviewAnswer(e.target.value)}
                  disabled={uiLocked}
                />
                <Button
                  className="mt-3"
                  disabled={uiLocked || !interviewAnswer.trim()}
                  onClick={() => interviewEvalMut.mutate()}
                >
                  {interviewEvalMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {interviewEvalMut.isPending ? "Evaluando…" : "Evaluar respuesta"}
                </Button>
              </>
            )}
            {interviewFeedback && (
              <ResultBox title="Feedback">
                <p>{interviewFeedback}</p>
              </ResultBox>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
