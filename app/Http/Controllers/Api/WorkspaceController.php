<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Workspace;
use App\Models\WorkspaceDeliverable;
use App\Models\WorkspaceTask;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkspaceController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function show(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccess($workspace, $user)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $workspace->load(['job', 'freelancer:id,name,username,avatar', 'client:id,name,avatar', 'deliverables.user:id,name', 'tasks']);

        return response()->json(['data' => $workspace]);
    }

    public function findByJob(Request $request, int $jobId): JsonResponse
    {
        $workspace = Workspace::query()
            ->where('job_id', $jobId)
            ->with(['job', 'freelancer:id,name,username,avatar', 'client:id,name,avatar', 'deliverables.user:id,name', 'tasks'])
            ->first();

        if (! $workspace) {
            return response()->json(['data' => null]);
        }

        if (! $this->canAccess($workspace, $request->user())) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json(['data' => $workspace]);
    }

    public function updateStatus(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccess($workspace, $user)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate(['status' => 'required|in:in_progress,delivered,revision,completed,paid']);

        $newStatus = $request->input('status');
        $workspace->update([
            'status' => $newStatus,
            'delivered_at' => $newStatus === 'delivered' ? now() : $workspace->delivered_at,
            'completed_at' => $newStatus === 'completed' ? now() : $workspace->completed_at,
        ]);

        $notifyUser = $user->id === $workspace->freelancer_id ? $workspace->client : $workspace->freelancer;
        $statusLabels = [
            'delivered' => 'entregado',
            'revision' => 'en revisión',
            'completed' => 'completado',
            'paid' => 'pagado',
        ];
        if (isset($statusLabels[$newStatus])) {
            $this->notifications->notify(
                $notifyUser,
                'Workspace actualizado',
                "El proyecto «{$workspace->job->title}» fue marcado como {$statusLabels[$newStatus]}.",
            );
        }

        return response()->json(['message' => 'Estado actualizado.', 'data' => $workspace->fresh()]);
    }

    public function addTask(Request $request, Workspace $workspace): JsonResponse
    {
        if (! $this->canAccess($workspace, $request->user())) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate(['title' => 'required|string|max:255']);

        $maxOrder = $workspace->tasks()->max('sort_order') ?? 0;

        $task = $workspace->tasks()->create([
            'title' => $request->input('title'),
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['data' => $task], 201);
    }

    public function toggleTask(Request $request, WorkspaceTask $task): JsonResponse
    {
        $workspace = $task->workspace;

        if (! $this->canAccess($workspace, $request->user())) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $task->update(['completed' => ! $task->completed]);

        return response()->json(['data' => $task]);
    }

    public function addDeliverable(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccess($workspace, $user)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'required|in:file,link,note',
            'url' => 'nullable|url|max:500',
            'file' => 'nullable|file|max:10240',
        ]);

        $filePath = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store("workspaces/{$workspace->id}", 'public');
        }

        $deliverable = $workspace->deliverables()->create([
            'user_id' => $user->id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'type' => $request->input('type'),
            'url' => $request->input('url'),
            'file_path' => $filePath,
            'file_name' => $fileName,
        ]);

        return response()->json(['data' => $deliverable->load('user:id,name')], 201);
    }

    public function deleteDeliverable(Request $request, WorkspaceDeliverable $deliverable): JsonResponse
    {
        $workspace = $deliverable->workspace;

        if (! $this->canAccess($workspace, $request->user())) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($deliverable->file_path) {
            Storage::disk('public')->delete($deliverable->file_path);
        }

        $deliverable->delete();

        return response()->json(['message' => 'Entregable eliminado.']);
    }

    public function registerPayment(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $workspace->client_id && ! $user->isAdmin()) {
            return response()->json(['message' => 'Solo el cliente puede registrar pagos.'], 403);
        }

        $request->validate([
            'amount' => 'required|string|max:50',
            'currency' => 'required|in:COP,USD',
            'method' => 'required|in:manual,transfer,platform',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $payment = Payment::query()->create([
            'workspace_id' => $workspace->id,
            'payer_id' => $workspace->client_id,
            'payee_id' => $workspace->freelancer_id,
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency'),
            'method' => $request->input('method'),
            'reference' => $request->input('reference'),
            'notes' => $request->input('notes'),
            'status' => 'confirmed',
        ]);

        $workspace->update(['status' => 'paid']);

        $this->notifications->notify(
            $workspace->freelancer,
            'Pago registrado',
            "El cliente registró un pago de {$payment->amount} {$payment->currency} por «{$workspace->job->title}».",
        );

        return response()->json(['message' => 'Pago registrado.', 'data' => $payment], 201);
    }

    public function payments(Request $request, Workspace $workspace): JsonResponse
    {
        if (! $this->canAccess($workspace, $request->user())) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $payments = Payment::query()
            ->where('workspace_id', $workspace->id)
            ->with(['payer:id,name', 'payee:id,name'])
            ->latest()
            ->get();

        return response()->json(['data' => $payments]);
    }

    private function canAccess(Workspace $workspace, $user): bool
    {
        return $user->id === $workspace->freelancer_id
            || $user->id === $workspace->client_id
            || $user->isAdmin();
    }
}
