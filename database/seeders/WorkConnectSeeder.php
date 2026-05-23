<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\DashboardStat;
use App\Models\JobListing;
use App\Models\Message;
use Illuminate\Database\Seeder;

class WorkConnectSeeder extends Seeder
{
    public function run(): void
    {
        $jobs = [
            ['id' => '1', 'title' => 'Diseñador UI para landing SaaS', 'company' => 'Nimbus Studio', 'budget' => '$450', 'location' => 'Lima, PE', 'remote' => true, 'category' => 'Diseño', 'description' => 'Buscamos diseñador con experiencia en Figma para crear landing moderna estilo glassmorphism.', 'skills' => ['Figma', 'UI', 'Glassmorphism'], 'match' => 96, 'posted_ago' => 'hace 2h', 'applicants' => 12],
            ['id' => '2', 'title' => 'Desarrollador React + Tailwind', 'company' => 'Flux Labs', 'budget' => '$1,200', 'location' => 'Remoto', 'remote' => true, 'category' => 'Desarrollo', 'description' => 'Implementar dashboard interactivo con animaciones suaves y dark mode.', 'skills' => ['React', 'Tailwind', 'TanStack Query'], 'match' => 92, 'posted_ago' => 'hace 5h', 'applicants' => 28],
            ['id' => '3', 'title' => 'Editor de video para reels de marca', 'company' => 'Brava Co.', 'budget' => '$300', 'location' => 'Bogotá, CO', 'remote' => true, 'category' => 'Video', 'description' => 'Editar 10 reels mensuales para Instagram, estilo cinematográfico.', 'skills' => ['Premiere', 'After Effects', 'Color'], 'match' => 88, 'posted_ago' => 'hace 1d', 'applicants' => 9],
            ['id' => '4', 'title' => 'Community manager bilingüe', 'company' => 'Orbit Agency', 'budget' => '$600/mes', 'location' => 'Remoto', 'remote' => true, 'category' => 'Marketing', 'description' => 'Manejo de redes para cliente fintech, inglés avanzado.', 'skills' => ['Copy', 'Meta Ads', 'Inglés'], 'match' => 84, 'posted_ago' => 'hace 1d', 'applicants' => 41],
            ['id' => '5', 'title' => 'Backend Laravel + API REST', 'company' => 'Mercado Pulse', 'budget' => '$2,000', 'location' => 'CDMX, MX', 'remote' => false, 'category' => 'Desarrollo', 'description' => 'Construir API de e-commerce con Laravel 12 y Sanctum.', 'skills' => ['Laravel', 'MySQL', 'Sanctum'], 'match' => 80, 'posted_ago' => 'hace 2d', 'applicants' => 17],
            ['id' => '6', 'title' => 'Ilustrador estilo flat para app móvil', 'company' => 'Pingu Health', 'budget' => '$700', 'location' => 'Remoto', 'remote' => true, 'category' => 'Diseño', 'description' => '12 ilustraciones para onboarding de app de salud mental.', 'skills' => ['Illustrator', 'Flat Design', 'Branding'], 'match' => 76, 'posted_ago' => 'hace 3d', 'applicants' => 22],
        ];

        foreach ($jobs as $job) {
            JobListing::query()->updateOrCreate(['id' => $job['id']], $job);
        }

        $applications = [
            ['id' => 'a1', 'job_title' => 'Diseñador UI para landing SaaS', 'company' => 'Nimbus Studio', 'price' => '$420', 'status' => 'en revisión', 'sent_ago' => 'hace 4h'],
            ['id' => 'a2', 'job_title' => 'Editor de video para reels', 'company' => 'Brava Co.', 'price' => '$280', 'status' => 'aceptada', 'sent_ago' => 'hace 1d'],
            ['id' => 'a3', 'job_title' => 'Frontend React', 'company' => 'Flux Labs', 'price' => '$1,100', 'status' => 'pendiente', 'sent_ago' => 'hace 2d'],
            ['id' => 'a4', 'job_title' => 'Logo para startup', 'company' => 'Kova', 'price' => '$150', 'status' => 'rechazada', 'sent_ago' => 'hace 5d'],
        ];

        foreach ($applications as $application) {
            Application::query()->updateOrCreate(['id' => $application['id']], $application);
        }

        $messages = [
            ['id' => 'm1', 'name' => 'Lucía Mendoza', 'avatar' => 'LM', 'preview' => 'Perfecto, mañana enviamos el brief completo del proyecto.', 'time' => '10:42', 'unread' => 2],
            ['id' => 'm2', 'name' => 'Daniel Soto', 'avatar' => 'DS', 'preview' => 'Me encantó tu portfolio. ¿Podemos agendar una llamada?', 'time' => '09:15', 'unread' => 1],
            ['id' => 'm3', 'name' => 'Andrea Rojas', 'avatar' => 'AR', 'preview' => 'Adjunto las referencias visuales que comentábamos.', 'time' => 'Ayer', 'unread' => 0],
            ['id' => 'm4', 'name' => 'Equipo Flux Labs', 'avatar' => 'FL', 'preview' => 'Tu postulación pasó a la siguiente fase 🎉', 'time' => 'Lun', 'unread' => 0],
        ];

        foreach ($messages as $message) {
            Message::query()->updateOrCreate(['id' => $message['id']], $message);
        }

        DashboardStat::query()->updateOrCreate(
            ['id' => 1],
            [
                'rating' => 4.9,
                'projects_done' => 23,
                'earnings' => '$8,420',
                'response_rate' => 98,
            ],
        );
    }
}
