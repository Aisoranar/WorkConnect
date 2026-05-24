<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceDeliverable extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'title',
        'description',
        'file_path',
        'file_name',
        'type',
        'url',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
