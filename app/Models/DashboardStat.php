<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardStat extends Model
{
    protected $table = 'dashboard_stats';

    protected $fillable = [
        'rating',
        'projects_done',
        'earnings',
        'response_rate',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'projects_done' => 'integer',
            'response_rate' => 'integer',
        ];
    }
}
