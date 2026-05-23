<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Empresas y emprendedores que publican proyectos (rol: client).
 */
class ClientSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'password';

    public function run(): void
    {
        $clients = [
            [
                'email' => 'nimbus@workconnect.test',
                'name' => 'Nimbus Studio',
                'username' => 'nimbus-studio',
                'city' => 'Lima, Perú',
                'bio' => 'Agencia digital especializada en productos SaaS y fintech.',
                'company' => 'Nimbus Studio',
                'jobs' => [
                    [
                        'title' => 'Diseñador UI para landing SaaS',
                        'budget' => '$450',
                        'location' => 'Lima, PE',
                        'remote' => true,
                        'category' => 'Diseño',
                        'description' => 'Buscamos diseñador con Figma para landing moderna estilo glassmorphism.',
                        'skills' => ['Figma', 'UI', 'Glassmorphism'],
                    ],
                    [
                        'title' => 'Landing page para SaaS de finanzas',
                        'budget' => '$1,200',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => 'Landing de conversión para producto fintech. React, animaciones y responsive.',
                        'skills' => ['React', 'Tailwind CSS', 'Framer Motion'],
                    ],
                ],
            ],
            [
                'email' => 'flux@workconnect.test',
                'name' => 'Flux Labs',
                'username' => 'flux-labs',
                'city' => 'Remoto',
                'bio' => 'Startup de analytics que necesita talento frontend y producto.',
                'company' => 'Flux Labs',
                'jobs' => [
                    [
                        'title' => 'Desarrollador React + Tailwind',
                        'budget' => '$1,200',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => 'Dashboard interactivo con animaciones suaves y dark mode.',
                        'skills' => ['React', 'Tailwind CSS', 'TypeScript'],
                    ],
                ],
            ],
            [
                'email' => 'fintech@workconnect.test',
                'name' => 'Fintech Co.',
                'username' => 'fintech-co',
                'city' => 'Ciudad de México, MX',
                'bio' => 'Empresa fintech buscando desarrollo de producto digital.',
                'company' => 'Fintech Co.',
                'jobs' => [
                    [
                        'title' => 'Backend Laravel + API REST',
                        'budget' => '$2,000',
                        'location' => 'CDMX, MX',
                        'remote' => false,
                        'category' => 'Desarrollo',
                        'description' => 'API de e-commerce con Laravel, Sanctum y documentación OpenAPI.',
                        'skills' => ['Laravel', 'MySQL', 'PostgreSQL'],
                    ],
                ],
            ],
            [
                'email' => 'brava@workconnect.test',
                'name' => 'Brava Co.',
                'username' => 'brava-co',
                'city' => 'Bogotá, CO',
                'bio' => 'Marca de lifestyle que contrata creativos para contenido digital.',
                'company' => 'Brava Co.',
                'jobs' => [
                    [
                        'title' => 'Editor de video para reels de marca',
                        'budget' => '$300 USD',
                        'location' => 'Bogotá, CO',
                        'remote' => true,
                        'category' => 'Video',
                        'description' => '10 reels mensuales para Instagram, estilo cinematográfico.',
                        'skills' => ['Premiere', 'After Effects'],
                    ],
                    [
                        'title' => 'Web sencilla con WhatsApp para distribución local',
                        'budget' => '800.000 COP',
                        'location' => 'Barranquilla, CO',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => 'PYME de alimentos necesita página clara: productos, zona de entrega y botón a WhatsApp. Sin e-commerce complejo.',
                        'skills' => ['HTML', 'CSS', 'JavaScript'],
                    ],
                ],
            ],
            [
                'email' => 'pyme@workconnect.test',
                'name' => 'Distribuidora La Canasta',
                'username' => 'la-canasta',
                'city' => 'Barranquilla, CO',
                'bio' => 'Distribución de víveres a barrios. Buscamos apoyo digital con presupuesto acotado.',
                'company' => 'La Canasta',
                'jobs' => [
                    [
                        'title' => 'Catálogo digital y contacto por WhatsApp',
                        'budget' => '500.000 COP',
                        'location' => 'Barranquilla, CO',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => 'Necesitamos que los clientes vean qué vendemos y nos escriban por WhatsApp. Ideal para estudiante o junior.',
                        'skills' => ['React', 'Tailwind CSS'],
                    ],
                    [
                        'title' => 'Logo y tarjetas para negocio de barrio',
                        'budget' => '350.000 COP',
                        'location' => 'Barranquilla, CO',
                        'remote' => true,
                        'category' => 'Diseño',
                        'description' => 'Marca sencilla para bolsas y redes. Entregables: logo, paleta y 3 piezas para Instagram.',
                        'skills' => ['Figma', 'UI Design'],
                    ],
                ],
            ],
            [
                'email' => 'orbit@workconnect.test',
                'name' => 'Orbit Agency',
                'username' => 'orbit-agency',
                'city' => 'Remoto',
                'bio' => 'Agencia de marketing digital para clientes B2B.',
                'company' => 'Orbit Agency',
                'jobs' => [
                    [
                        'title' => 'Community manager bilingüe',
                        'budget' => '$600/mes',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Marketing',
                        'description' => 'Manejo de redes para cliente fintech, inglés avanzado.',
                        'skills' => ['Copywriting', 'Meta Ads'],
                    ],
                ],
            ],
        ];

        foreach ($clients as $data) {
            $jobs = $data['jobs'];
            $company = $data['company'];
            unset($data['jobs'], $data['company']);

            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    ...$data,
                    'password' => Hash::make(self::DEFAULT_PASSWORD),
                    'role' => 'client',
                    'verified' => true,
                    'rating' => 4.6,
                ],
            );

            foreach ($jobs as $job) {
                WorkJob::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'title' => $job['title'],
                    ],
                    [
                        ...$job,
                        'company' => $company,
                        'status' => 'open',
                    ],
                );
            }
        }
    }
}
