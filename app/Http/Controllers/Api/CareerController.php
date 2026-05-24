<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CareerSession;
use App\Models\ExternalJobListing;
use App\Models\WorkJob;
use App\Services\CareerAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CareerController extends Controller
{
    public function __construct(
        private readonly CareerAssistantService $career,
    ) {}

    public function externalJobs(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $week = now()->format('o-\WW');
        $jobs = ExternalJobListing::query()
            ->where('week_key', $week)
            ->orderByDesc('posted_at')
            ->limit(10)
            ->get();

        if ($jobs->isEmpty()) {
            $jobs = ExternalJobListing::query()
                ->orderByDesc('posted_at')
                ->limit(10)
                ->get();
        }

        return response()->json(['data' => $jobs]);
    }

    public function history(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $sessions = CareerSession::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(min(30, $request->integer('limit', 15)))
            ->get(['id', 'type', 'source', 'created_at']);

        return response()->json(['data' => $sessions]);
    }

    public function analyzeProfile(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        return response()->json([
            'data' => $this->career->analyzeProfileDeep($request->user()),
        ]);
    }

    public function discoverAchievements(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        return response()->json([
            'data' => $this->career->discoverAchievements(
                $request->user(),
                $request->input('notes'),
            ),
        ]);
    }

    public function improveCv(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        return response()->json([
            'data' => $this->career->improveCv($request->user()),
        ]);
    }

    public function improveLinkedin(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        return response()->json([
            'data' => $this->career->improveLinkedIn($request->user()),
        ]);
    }

    public function analyzeOffer(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'offer_text' => ['nullable', 'string', 'max:20000'],
            'file' => ['nullable', 'file', 'max:5120', 'mimes:txt,pdf,png,jpg,jpeg,webp'],
        ]);

        $text = $this->extractOfferText($request);
        if (trim($text) === '') {
            return response()->json(['message' => 'Proporciona texto de la oferta o un archivo.'], 422);
        }

        return response()->json([
            'data' => $this->career->analyzeJobOffer($request->user(), $text),
        ]);
    }

    public function studyPlan(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'offer_text' => ['required', 'string', 'max:20000'],
            'target_role' => ['nullable', 'string', 'max:200'],
        ]);

        return response()->json([
            'data' => $this->career->buildStudyPlan(
                $request->user(),
                $request->string('offer_text')->toString(),
                $request->input('target_role'),
            ),
        ]);
    }

    public function targetRole(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'target_role' => ['required', 'string', 'max:200'],
        ]);

        return response()->json([
            'data' => $this->career->targetRolePath(
                $request->user(),
                $request->string('target_role')->toString(),
            ),
        ]);
    }

    public function readiness(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'offer_text' => ['required', 'string', 'max:20000'],
        ]);

        return response()->json([
            'data' => $this->career->evaluateReadiness(
                $request->user(),
                $request->string('offer_text')->toString(),
            ),
        ]);
    }

    public function interviewStart(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'context' => ['required', 'string', 'max:20000'],
            'mode' => ['nullable', 'string', 'in:offer,target_role,general'],
        ]);

        return response()->json([
            'data' => $this->career->startInterview(
                $request->user(),
                $request->string('context')->toString(),
                $request->input('mode', 'offer'),
            ),
        ]);
    }

    public function interviewEvaluate(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'answer' => ['required', 'string', 'max:8000'],
            'context' => ['required', 'string', 'max:20000'],
        ]);

        return response()->json([
            'data' => $this->career->evaluateInterviewAnswer(
                $request->user(),
                $request->string('question')->toString(),
                $request->string('answer')->toString(),
                $request->string('context')->toString(),
            ),
        ]);
    }

    public function projectTips(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'job_id' => ['required', 'exists:work_jobs,id'],
        ]);

        $job = WorkJob::query()->findOrFail($request->integer('job_id'));

        return response()->json([
            'data' => $this->career->projectCoachingTips($request->user(), $job),
        ]);
    }

    private function ensureTalent(Request $request): void
    {
        $user = $request->user();
        if (! in_array($user->role, ['freelancer', 'admin'], true)) {
            abort(403, 'El asistente de carrera está disponible para talento joven.');
        }
    }

    private function extractOfferText(Request $request): string
    {
        if ($request->filled('offer_text')) {
            return $request->string('offer_text')->toString();
        }

        if (! $request->hasFile('file')) {
            return '';
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, ['txt', 'md'], true)) {
            return trim((string) file_get_contents($file->getRealPath()));
        }

        if ($ext === 'pdf') {
            $binary = file_get_contents($file->getRealPath());
            preg_match_all('/\(([^()\\\\]{4,120})\)/', $binary, $matches);
            $extracted = trim(implode(' ', array_slice($matches[1] ?? [], 0, 80)));

            return $extracted !== ''
                ? $extracted
                : 'PDF adjunto. Complementa pegando el texto de la oferta en el campo de texto.';
        }

        return 'Imagen de oferta adjunta. Pega el texto visible de la vacante en el campo de texto para un análisis completo con IA.';
    }
}
