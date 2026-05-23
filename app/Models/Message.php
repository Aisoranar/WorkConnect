<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'avatar',
        'preview',
        'time',
        'unread',
    ];

    protected function casts(): array
    {
        return [
            'unread' => 'integer',
        ];
    }
}
