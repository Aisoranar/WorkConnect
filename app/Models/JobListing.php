<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobListing extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'job_listings';

    protected $fillable = [
        'id',
        'title',
        'company',
        'budget',
        'location',
        'remote',
        'category',
        'description',
        'skills',
        'match',
        'posted_ago',
        'applicants',
    ];

    protected function casts(): array
    {
        return [
            'remote' => 'boolean',
            'skills' => 'array',
            'match' => 'integer',
            'applicants' => 'integer',
        ];
    }
}
