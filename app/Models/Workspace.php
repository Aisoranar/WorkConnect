<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    protected $fillable = [
        'job_id',
        'freelancer_id',
        'client_id',
        'status',
        'notes',
        'delivered_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'delivered_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(WorkJob::class, 'job_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function deliverables(): HasMany
    {
        return $this->hasMany(WorkspaceDeliverable::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(WorkspaceTask::class)->orderBy('sort_order');
    }
}
