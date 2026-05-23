<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\LegacyApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function __construct(
        private readonly LegacyApiFormatter $legacy,
        private readonly NotificationService $notifications,
    ) {}

    /** Compatibilidad inbox (GET /api/messages). */
    public function legacyInbox(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user) {
            return response()->json(['data' => $this->demoInbox()]);
        }

        $contacts = ChatMessage::query()
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })
            ->with(['sender', 'receiver'])
            ->latest()
            ->get()
            ->groupBy(fn (ChatMessage $m) => $m->sender_id === $user->id ? $m->receiver_id : $m->sender_id);

        $data = $contacts->map(function ($messages, $contactId) use ($user) {
            $latest = $messages->first();
            $contact = $latest->sender_id === $user->id ? $latest->receiver : $latest->sender;
            $unread = $messages->where('receiver_id', $user->id)->whereNull('read_at')->count();

            return $this->legacy->inboxConversation(
                $contact,
                $latest->message,
                $unread,
                $latest->created_at,
            );
        })->values();

        return response()->json(['data' => $data]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $contactId = $request->integer('with');

        $messages = ChatMessage::query()
            ->where(function ($q) use ($user, $contactId) {
                $q->where('sender_id', $user->id)->where('receiver_id', $contactId);
            })
            ->orWhere(function ($q) use ($user, $contactId) {
                $q->where('sender_id', $contactId)->where('receiver_id', $user->id);
            })
            ->with(['sender', 'receiver'])
            ->oldest()
            ->get();

        ChatMessage::query()
            ->where('receiver_id', $user->id)
            ->where('sender_id', $contactId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => ChatMessageResource::collection($messages),
        ]);
    }

    public function store(StoreMessageRequest $request): JsonResponse
    {
        $message = ChatMessage::query()->create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->integer('receiver_id'),
            'message' => $request->string('message'),
        ]);

        $receiver = User::query()->findOrFail($request->integer('receiver_id'));
        $this->notifications->notify(
            $receiver,
            'Nuevo mensaje',
            $request->user()->name.': '.str($request->string('message'))->limit(80),
        );

        return response()->json([
            'message' => 'Mensaje enviado.',
            'data' => new ChatMessageResource($message->load(['sender', 'receiver'])),
        ], 201);
    }

    private function demoInbox(): array
    {
        return [
            ['id' => '1', 'name' => 'Lucía Mendoza', 'avatar' => 'LM', 'preview' => 'Perfecto, mañana enviamos el brief.', 'time' => '10:42', 'unread' => 2],
            ['id' => '2', 'name' => 'Daniel Soto', 'avatar' => 'DS', 'preview' => '¿Podemos agendar una llamada?', 'time' => '09:15', 'unread' => 1],
        ];
    }
}
