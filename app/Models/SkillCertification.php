<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkillCertification extends Model
{
    protected $fillable = [
        'user_id',
        'skill_name',
        'score',
        'passed',
        'correct_count',
        'total',
        'certificate_id',
        'attempted_at',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'score' => 'integer',
        'correct_count' => 'integer',
        'total' => 'integer',
        'attempted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
