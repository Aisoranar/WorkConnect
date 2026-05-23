<?php

namespace Database\Seeders;

use App\Models\ChatMessage;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Database\Seeder;

/**
 * Postulaciones, mensajes, reseñas y notificaciones de ejemplo entre roles.
 */
class DemoRelationsSeeder extends Seeder
{
    public function run(): void
    {
        $maria = User::query()->where('email', 'maria@workconnect.test')->firstOrFail();
        $alex = User::query()->where('email', 'alex@workconnect.test')->firstOrFail();
        $sofia = User::query()->where('email', 'sofia@workconnect.test')->firstOrFail();
        $nimbus = User::query()->where('email', 'nimbus@workconnect.test')->firstOrFail();
        $flux = User::query()->where('email', 'flux@workconnect.test')->firstOrFail();
        $fintech = User::query()->where('email', 'fintech@workconnect.test')->firstOrFail();

        $landingSaas = WorkJob::query()->where('title', 'Landing page para SaaS de finanzas')->first();
        $uiLanding = WorkJob::query()->where('title', 'Diseñador UI para landing SaaS')->first();
        $reactJob = WorkJob::query()->where('title', 'like', '%React + Tailwind%')->first();
        $videoJob = WorkJob::query()->where('title', 'like', '%video%')->first();
        $laravelJob = WorkJob::query()->where('title', 'like', '%Laravel%')->first();

        if ($uiLanding) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $uiLanding->id, 'user_id' => $maria->id],
                [
                    'proposal' => 'Puedo entregar el diseño en 5 días con 2 rondas de revisión incluidas.',
                    'price' => '$420',
                    'delivery_time' => '5 días',
                    'status' => 'en revisión',
                ],
            );
        }

        if ($landingSaas) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $landingSaas->id, 'user_id' => $alex->id],
                [
                    'proposal' => 'Hola Fintech Co., tengo experiencia con React, Tailwind y Framer Motion en landings SaaS.',
                    'price' => '$1,100',
                    'delivery_time' => '2 semanas',
                    'status' => 'pendiente',
                ],
            );

            JobApplication::query()->updateOrCreate(
                ['job_id' => $landingSaas->id, 'user_id' => $maria->id],
                [
                    'proposal' => 'Combino diseño UI y desarrollo frontend para landings de alta conversión.',
                    'price' => '$1,050',
                    'delivery_time' => '12 días',
                    'status' => 'pendiente',
                ],
            );
        }

        if ($reactJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $reactJob->id, 'user_id' => $alex->id],
                [
                    'proposal' => 'He implementado dashboards similares con TanStack Query y animaciones.',
                    'price' => '$1,150',
                    'delivery_time' => '10 días',
                    'status' => 'en revisión',
                ],
            );
        }

        if ($videoJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $videoJob->id, 'user_id' => $sofia->id],
                [
                    'proposal' => 'Edito reels con estilo cinematográfico. Incluyo 2 revisiones por pieza.',
                    'price' => '$280',
                    'delivery_time' => '1 semana',
                    'status' => 'aceptada',
                ],
            );
        }

        if ($laravelJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $laravelJob->id, 'user_id' => $alex->id],
                [
                    'proposal' => 'Especialista en Laravel 12/13, Sanctum y APIs documentadas.',
                    'price' => '$1,900',
                    'delivery_time' => '3 semanas',
                    'status' => 'pendiente',
                ],
            );
        }

        ChatMessage::query()->updateOrCreate(
            [
                'sender_id' => $nimbus->id,
                'receiver_id' => $maria->id,
                'message' => 'Perfecto, mañana enviamos el brief completo del proyecto.',
            ],
            ['read_at' => null],
        );

        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $maria->id,
                'receiver_id' => $nimbus->id,
                'message' => '¡Gracias! Quedo atenta al brief.',
            ],
            ['read_at' => now()],
        );

        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $flux->id,
                'receiver_id' => $alex->id,
                'message' => 'Tu postulación pasó a la siguiente fase 🎉',
            ],
            ['read_at' => null],
        );

        if ($uiLanding) {
            Review::query()->updateOrCreate(
                [
                    'job_id' => $uiLanding->id,
                    'reviewer_id' => $nimbus->id,
                    'reviewed_id' => $maria->id,
                ],
                ['rating' => 5, 'comment' => 'Excelente trabajo y comunicación.'],
            );
        }

        foreach ([$maria, $alex, $sofia] as $freelancer) {
            Notification::query()->firstOrCreate(
                [
                    'user_id' => $freelancer->id,
                    'title' => 'Nuevos matches',
                    'body' => 'Tienes proyectos compatibles con tu perfil hoy.',
                ],
                ['read' => false],
            );
        }

        foreach ([$nimbus, $flux, $fintech] as $client) {
            Notification::query()->firstOrCreate(
                [
                    'user_id' => $client->id,
                    'title' => 'Nueva postulación',
                    'body' => 'Un freelancer postuló a uno de tus proyectos.',
                ],
                ['read' => false],
            );
        }
    }
}
