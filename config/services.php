<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'nvidia' => [
        'key'        => env('NVIDIA_API_KEY'),
        'url'        => env('NVIDIA_API_URL', 'https://integrate.api.nvidia.com/v1'),
        'model'      => env('NVIDIA_DEFAULT_MODEL', 'meta/llama-3.3-70b-instruct'),
        'fast_model' => env('NVIDIA_FAST_MODEL', 'meta/llama-3.1-8b-instruct'),
    ],

    'gemini' => [
        'key'   => env('GEMINI_API_KEY'),
        'url'   => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta'),
        'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.0-flash'),
    ],

    'openai' => [
        'key'   => env('OPENAI_API_KEY'),
        'url'   => env('OPENAI_API_URL', 'https://api.openai.com/v1'),
        'model' => env('OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),
    ],

];
