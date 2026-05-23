<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = Message::query()
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $message) => [
                'id' => $message->id,
                'name' => $message->name,
                'avatar' => $message->avatar,
                'preview' => $message->preview,
                'time' => $message->time,
                'unread' => $message->unread,
            ]);

        return response()->json(['data' => $messages]);
    }
}
