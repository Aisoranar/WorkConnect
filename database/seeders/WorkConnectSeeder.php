<?php

namespace Database\Seeders;

use App\Models\ChatMessage;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\PortfolioProject;
use App\Models\Review;
use App\Models\Skill;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WorkConnectSeeder extends Seeder
{
    public function run(): void
    {
        $skills = collect([
            ['name' => 'React', 'category' => 'Desarrollo'],
            ['name' => 'Laravel', 'category' => 'Desarrollo'],
            ['name' => 'Figma', 'category' => 'Diseño'],
            ['name' => 'Tailwind CSS', 'category' => 'Desarrollo'],
            ['name' => 'UI Design', 'category' => 'Diseño'],
            ['name' => 'TypeScript', 'category' => 'Desarrollo'],
            ['name' => 'MySQL', 'category' => 'Desarrollo'],
            ['name' => 'Premiere', 'category' => 'Video'],
        ])->map(fn ($s) => Skill::query()->firstOrCreate(['name' => $s['name']], $s));

        $maria = User::query()->updateOrCreate(
            ['email' => 'maria@workconnect.test'],
            [
                'name' => 'María Álvarez',
                'username' => 'maria-alvarez',
                'password' => Hash::make('password'),
                'role' => 'freelancer',
                'city' => 'Lima, PE',
                'bio' => 'Diseñadora UI y frontend. Especialista en SaaS y productos digitales.',
                'rating' => 4.9,
                'verified' => true,
                'github' => 'https://github.com/maria',
                'linkedin' => 'https://linkedin.com/in/maria',
                'experience' => '3 años creando interfaces para startups.',
            ],
        );

        $client = User::query()->updateOrCreate(
            ['email' => 'cliente@workconnect.test'],
            [
                'name' => 'Nimbus Studio',
                'username' => 'nimbus',
                'password' => Hash::make('password'),
                'role' => 'client',
                'city' => 'Lima, PE',
                'bio' => 'Agencia digital.',
                'rating' => 4.7,
                'verified' => true,
            ],
        );

        $maria->skills()->sync(
            $skills->whereIn('name', ['React', 'Figma', 'Tailwind CSS', 'UI Design', 'TypeScript', 'Laravel'])
                ->mapWithKeys(fn ($s) => [$s->id => ['level' => 'avanzado']])
                ->all(),
        );

        PortfolioProject::query()->updateOrCreate(
            ['user_id' => $maria->id, 'title' => 'Landing fintech Nimbus'],
            [
                'description' => 'Landing SaaS con glassmorphism.',
                'technologies' => ['Figma', 'React'],
                'url' => 'https://example.com',
            ],
        );

        $jobsData = [
            ['title' => 'Diseñador UI para landing SaaS', 'company' => 'Nimbus Studio', 'budget' => '$450', 'location' => 'Lima, PE', 'remote' => true, 'category' => 'Diseño', 'description' => 'Buscamos diseñador con experiencia en Figma para crear landing moderna estilo glassmorphism.', 'skills' => ['Figma', 'UI', 'Glassmorphism']],
            ['title' => 'Desarrollador React + Tailwind', 'company' => 'Flux Labs', 'budget' => '$1,200', 'location' => 'Remoto', 'remote' => true, 'category' => 'Desarrollo', 'description' => 'Implementar dashboard interactivo con animaciones suaves y dark mode.', 'skills' => ['React', 'Tailwind', 'TanStack Query']],
            ['title' => 'Editor de video para reels de marca', 'company' => 'Brava Co.', 'budget' => '$300', 'location' => 'Bogotá, CO', 'remote' => true, 'category' => 'Video', 'description' => 'Editar 10 reels mensuales para Instagram, estilo cinematográfico.', 'skills' => ['Premiere', 'After Effects', 'Color']],
            ['title' => 'Community manager bilingüe', 'company' => 'Orbit Agency', 'budget' => '$600/mes', 'location' => 'Remoto', 'remote' => true, 'category' => 'Marketing', 'description' => 'Manejo de redes para cliente fintech, inglés avanzado.', 'skills' => ['Copy', 'Meta Ads', 'Inglés']],
            ['title' => 'Backend Laravel + API REST', 'company' => 'Mercado Pulse', 'budget' => '$2,000', 'location' => 'CDMX, MX', 'remote' => false, 'category' => 'Desarrollo', 'description' => 'Construir API de e-commerce con Laravel y Sanctum.', 'skills' => ['Laravel', 'MySQL', 'Sanctum']],
            ['title' => 'Ilustrador estilo flat para app móvil', 'company' => 'Pingu Health', 'budget' => '$700', 'location' => 'Remoto', 'remote' => true, 'category' => 'Diseño', 'description' => '12 ilustraciones para onboarding de app de salud mental.', 'skills' => ['Illustrator', 'Flat Design', 'Branding']],
        ];

        foreach ($jobsData as $data) {
            WorkJob::query()->updateOrCreate(
                ['user_id' => $client->id, 'title' => $data['title']],
                [...$data, 'status' => 'open'],
            );
        }

        $firstJob = WorkJob::query()->first();

        JobApplication::query()->updateOrCreate(
            ['job_id' => $firstJob->id, 'user_id' => $maria->id],
            [
                'proposal' => 'Puedo entregar el diseño en 5 días con 2 rondas de revisión.',
                'price' => '$420',
                'delivery_time' => '5 días',
                'status' => 'en revisión',
            ],
        );

        $fluxJob = WorkJob::query()->where('title', 'like', '%React%')->first();
        if ($fluxJob) {
            JobApplication::query()->updateOrCreate(
                ['job_id' => $fluxJob->id, 'user_id' => $maria->id],
                [
                    'proposal' => 'Experiencia en dashboards con React y TanStack Query.',
                    'price' => '$1,100',
                    'delivery_time' => '10 días',
                    'status' => 'pendiente',
                ],
            );
        }

        ChatMessage::query()->updateOrCreate(
            ['sender_id' => $client->id, 'receiver_id' => $maria->id, 'message' => 'Perfecto, mañana enviamos el brief completo del proyecto.'],
            ['read_at' => null],
        );

        ChatMessage::query()->create([
            'sender_id' => $maria->id,
            'receiver_id' => $client->id,
            'message' => '¡Gracias! Quedo atenta al brief.',
            'read_at' => now(),
        ]);

        Review::query()->updateOrCreate(
            ['job_id' => $firstJob->id, 'reviewer_id' => $client->id, 'reviewed_id' => $maria->id],
            ['rating' => 5, 'comment' => 'Excelente trabajo y comunicación.'],
        );

        Notification::query()->create([
            'user_id' => $maria->id,
            'title' => 'Nueva postulación',
            'body' => 'Tu perfil tiene 3 nuevos matches hoy.',
            'read' => false,
        ]);
    }
}
