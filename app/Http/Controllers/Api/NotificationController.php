<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(30);

        return NotificationResource::collection($notifications)->response();
    }

    public function markRead(Request $request, int $notification): JsonResponse
    {
        $item = $request->user()->notifications()->findOrFail($notification);
        $item->update(['read' => true]);

        return response()->json(['message' => 'Notificación marcada como leída.']);
    }
}
