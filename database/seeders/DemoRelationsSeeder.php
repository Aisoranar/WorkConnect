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
 * Postulaciones, mensajes, reseñas y notificaciones — escenarios para dashboard, explorar y aplicaciones.
 */
class DemoRelationsSeeder extends Seeder
{
    public function run(): void
    {
        $demo = User::query()->where('email', 'demo@workconnect.test')->firstOrFail();
        $maria = User::query()->where('email', 'maria@workconnect.test')->firstOrFail();
        $alex = User::query()->where('email', 'alex@workconnect.test')->firstOrFail();
        $carlos = User::query()->where('email', 'carlos@workconnect.test')->firstOrFail();
        $sofia = User::query()->where('email', 'sofia@workconnect.test')->firstOrFail();

        $nimbus = User::query()->where('email', 'nimbus@workconnect.test')->firstOrFail();
        $flux = User::query()->where('email', 'flux@workconnect.test')->firstOrFail();
        $fintech = User::query()->where('email', 'fintech@workconnect.test')->firstOrFail();
        $brava = User::query()->where('email', 'brava@workconnect.test')->firstOrFail();
        $pyme = User::query()->where('email', 'pyme@workconnect.test')->firstOrFail();

        $uiLanding = WorkJob::query()->where('title', 'Diseñador UI para landing SaaS')->first();
        $landingSaas = WorkJob::query()->where('title', 'Landing page para SaaS de finanzas')->first();
        $reactJob = WorkJob::query()->where('title', 'Desarrollador React + Tailwind')->first();
        $videoJob = WorkJob::query()->where('title', 'Editor de video para reels de marca')->first();
        $laravelJob = WorkJob::query()->where('title', 'Backend Laravel + API REST')->first();
        $alimentosJob = WorkJob::query()->where('title', 'Landing page para Alimentos')->first();
        $catalogoJob = WorkJob::query()->where('title', 'Catálogo digital y contacto por WhatsApp')->first();

        if ($uiLanding) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $uiLanding->id, 'user_id' => $demo->id],
                [
                    'proposal' => 'Hola Nimbus Studio, tras revisar "Diseñador UI para landing SaaS" creo que soy una excelente opción. Puedo entregar en el plazo estimado con alta calidad.',
                    'price' => '$450',
                    'delivery_time' => '2 semanas',
                    'status' => 'pendiente',
                ],
            );

            JobApplication::query()->updateOrCreate(
                ['job_id' => $uiLanding->id, 'user_id' => $maria->id],
                [
                    'proposal' => 'Hola Nimbus, soy diseñadora UI con experiencia en SaaS y glassmorphism. Adjunto en mi perfil dos landings similares. Propongo 5 días para wireframe + UI alta fidelidad y 2 rondas de revisión.',
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
                    'proposal' => 'Hola Nimbus Studio, implementé landings fintech con React, Tailwind y Framer Motion. Puedo clonar el Figma con animaciones en hero y sección pricing.',
                    'price' => '$1,100',
                    'delivery_time' => '2 semanas',
                    'status' => 'pendiente',
                ],
            );

            JobApplication::query()->updateOrCreate(
                ['job_id' => $landingSaas->id, 'user_id' => $maria->id],
                [
                    'proposal' => 'Combino diseño en Figma e implementación front para una sola entrega coherente. Experiencia en conversión B2B.',
                    'price' => '$1,050',
                    'delivery_time' => '12 días',
                    'status' => 'pendiente',
                ],
            );

            JobApplication::query()->updateOrCreate(
                ['job_id' => $landingSaas->id, 'user_id' => $carlos->id],
                [
                    'proposal' => 'Estudiante con proyectos React en GitHub. Me gustaría crecer con un proyecto real de landing.',
                    'price' => '$900',
                    'delivery_time' => '3 semanas',
                    'status' => 'rechazada',
                ],
            );
        }

        if ($reactJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $reactJob->id, 'user_id' => $alex->id],
                [
                    'proposal' => 'Dashboards con TanStack Query, Recharts y dark mode en producción. Disponible para sync semanal.',
                    'price' => '$1,150',
                    'delivery_time' => '10 días',
                    'status' => 'en revisión',
                ],
            );

            JobApplication::query()->updateOrCreate(
                ['job_id' => $reactJob->id, 'user_id' => $carlos->id],
                [
                    'proposal' => 'He hecho CRUDs con React; quiero aplicar a un dashboard real con mentoría.',
                    'price' => '$950',
                    'delivery_time' => '2 semanas',
                    'status' => 'pendiente',
                ],
            );
        }

        if ($videoJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $videoJob->id, 'user_id' => $sofia->id],
                [
                    'proposal' => 'Edito reels cinematográficos en Premiere y motion en After Effects. Incluyo 2 revisiones por pieza.',
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
                    'proposal' => 'Laravel 13, Sanctum, políticas y OpenAPI en proyectos anteriores. Puedo empezar esta semana.',
                    'price' => '$1,900',
                    'delivery_time' => '3 semanas',
                    'status' => 'pendiente',
                ],
            );
        }

        if ($alimentosJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $alimentosJob->id, 'user_id' => $carlos->id],
                [
                    'proposal' => 'Puedo armar la landing con React + Tailwind y botón a WhatsApp. Entrego repo y README de deploy en Vercel.',
                    'price' => '$750',
                    'delivery_time' => '10 días',
                    'status' => 'pendiente',
                ],
            );
        }

        if ($catalogoJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $catalogoJob->id, 'user_id' => $carlos->id],
                [
                    'proposal' => 'Propuesta económica para La Canasta: catálogo mobile-first y enlace wa.me. Presupuesto ajustado a COP.',
                    'price' => '480.000 COP',
                    'delivery_time' => '8 días',
                    'status' => 'pendiente',
                ],
            );
        }

        $this->seedMessages($nimbus, $maria, $flux, $alex, $brava, $sofia);
        $this->seedReviews($uiLanding, $nimbus, $maria, $videoJob, $brava, $sofia);
        $this->seedNotifications($demo, $maria, $alex, $sofia, $carlos, $nimbus, $flux, $fintech, $pyme);
    }

    private function seedMessages(User $nimbus, User $maria, User $flux, User $alex, User $brava, User $sofia): void
    {
        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $nimbus->id,
                'receiver_id' => $maria->id,
                'message' => 'Hola María, vimos tu perfil y nos gustó tu portfolio Nimbus. ¿Puedes empezar el lunes?',
            ],
            ['read_at' => null],
        );

        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $maria->id,
                'receiver_id' => $nimbus->id,
                'message' => '¡Gracias! Sí, el lunes envío wireframes de la landing SaaS.',
            ],
            ['read_at' => now()],
        );

        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $flux->id,
                'receiver_id' => $alex->id,
                'message' => 'Alex, tu postulación al dashboard pasó a revisión técnica 🎉',
            ],
            ['read_at' => null],
        );

        ChatMessage::query()->firstOrCreate(
            [
                'sender_id' => $brava->id,
                'receiver_id' => $sofia->id,
                'message' => 'Sofía, ¡aceptada! Te comparto el Drive con el material del mes.',
            ],
            ['read_at' => null],
        );
    }

    private function seedReviews(?WorkJob $uiLanding, User $nimbus, User $maria, ?WorkJob $videoJob, User $brava, User $sofia): void
    {
        if ($uiLanding) {
            Review::query()->updateOrCreate(
                [
                    'job_id' => $uiLanding->id,
                    'reviewer_id' => $nimbus->id,
                    'reviewed_id' => $maria->id,
                ],
                ['rating' => 5, 'comment' => 'Entrega impecable, comunicación clara y dentro del plazo.'],
            );
        }

        if ($videoJob) {
            Review::query()->updateOrCreate(
                [
                    'job_id' => $videoJob->id,
                    'reviewer_id' => $brava->id,
                    'reviewed_id' => $sofia->id,
                ],
                ['rating' => 5, 'comment' => 'Reels con muy buen ritmo y estética de marca.'],
            );
        }
    }

    /**
     * @param  array<int, User>  $freelancers
     * @param  array<int, User>  $clients
     */
    private function seedNotifications(User $demo, User $maria, User $alex, User $sofia, User $carlos, User $nimbus, User $flux, User $fintech, User $pyme): void
    {
        foreach ([$demo, $maria, $alex, $sofia, $carlos] as $freelancer) {
            Notification::query()->firstOrCreate(
                [
                    'user_id' => $freelancer->id,
                    'title' => 'Proyectos compatibles hoy',
                    'body' => 'Hay nuevas vacantes en Explorar que encajan con tu perfil o te ayudan a subir match.',
                ],
                ['read' => false],
            );
        }

        Notification::query()->firstOrCreate(
            [
                'user_id' => $demo->id,
                'title' => 'Mejora tu match',
                'body' => 'Tu compatibilidad es baja en varios proyectos. Usa el coach IA en Explorar para ver qué skills aprender.',
            ],
            ['read' => false],
        );

        foreach ([$nimbus, $flux, $fintech, $pyme] as $client) {
            Notification::query()->firstOrCreate(
                [
                    'user_id' => $client->id,
                    'title' => 'Nueva postulación recibida',
                    'body' => 'Un freelancer envió propuesta a uno de tus proyectos abiertos.',
                ],
                ['read' => false],
            );
        }
    }
}
