<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function notify(User $user, string $title, string $body): Notification
    {
        return Notification::query()->create([
            'user_id' => $user->id,
            'title' => $title,
            'body' => $body,
            'read' => false,
        ]);
    }
}
