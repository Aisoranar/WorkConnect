<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalJobListing extends Model
{
    protected $fillable = [
        'title',
        'company',
        'location',
        'apply_url',
        'source',
        'skills',
        'summary',
        'week_key',
        'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'posted_at' => 'datetime',
        ];
    }
}
