<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkJob extends Model
{
    protected $table = 'work_jobs';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'budget',
        'location',
        'remote',
        'status',
        'category',
        'deadline',
        'company',
        'skills',
    ];

    protected function casts(): array
    {
        return [
            'remote' => 'boolean',
            'skills' => 'array',
            'deadline' => 'date',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'job_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'job_id');
    }
}
