<?php

namespace Database\Seeders;

use App\Models\PortfolioProject;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Estudiantes y profesionales que postulan a proyectos (rol: freelancer).
 */
class FreelancerSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'password';

    public function run(): void
    {
        $freelancers = [
            [
                'email' => 'maria@workconnect.test',
                'name' => 'María Álvarez',
                'username' => 'maria-alvarez',
                'city' => 'Lima, Perú',
                'bio' => 'Diseñadora UI y frontend. Especialista en SaaS y productos digitales con foco en conversión.',
                'rating' => 4.9,
                'experience' => 'Diseñadora UI · Frontend Developer · 3 años en startups.',
                'github' => 'https://github.com/maria-alvarez',
                'linkedin' => 'https://linkedin.com/in/maria-alvarez',
                'skills' => [
                    'React' => 'avanzado',
                    'Figma' => 'avanzado',
                    'Tailwind CSS' => 'avanzado',
                    'UI Design' => 'avanzado',
                    'TypeScript' => 'intermedio',
                    'Laravel' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'Landing fintech Nimbus',
                        'description' => 'Landing SaaS con glassmorphism y alta conversión.',
                        'technologies' => ['Figma', 'React'],
                    ],
                    [
                        'title' => 'Dashboard Flux Labs',
                        'description' => 'Panel analítico con dark mode.',
                        'technologies' => ['React', 'Tailwind CSS'],
                    ],
                ],
            ],
            [
                'email' => 'alex@workconnect.test',
                'name' => 'Alex Romero',
                'username' => 'alex-romero',
                'city' => 'Lima, Perú',
                'bio' => 'Construyo productos con React, Laravel y modelos de lenguaje. Apasionado por la IA aplicada.',
                'rating' => 4.8,
                'experience' => 'Fullstack Developer · IA & Producto',
                'github' => 'https://github.com/alexromero',
                'linkedin' => 'https://linkedin.com/in/alexromero',
                'skills' => [
                    'React' => 'avanzado',
                    'Laravel' => 'avanzado',
                    'TypeScript' => 'avanzado',
                    'OpenAI API' => 'avanzado',
                    'PostgreSQL' => 'intermedio',
                    'MySQL' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'API WorkConnect MVP',
                        'description' => 'Backend Laravel + matching IA.',
                        'technologies' => ['Laravel', 'OpenAI API'],
                    ],
                ],
            ],
            [
                'email' => 'sofia@workconnect.test',
                'name' => 'Sofía Mendoza',
                'username' => 'sofia-mendoza',
                'city' => 'Arequipa, Perú',
                'bio' => 'Estudiante de diseño multimedia. Reels, branding y piezas para redes sociales.',
                'rating' => 4.2,
                'experience' => 'Estudiante · Editora de video & diseño',
                'skills' => [
                    'Premiere' => 'intermedio',
                    'Figma' => 'intermedio',
                    'Illustrator' => 'basico',
                    'Copywriting' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'Reels marca local',
                        'description' => 'Serie de 8 reels para cafetería.',
                        'technologies' => ['Premiere'],
                    ],
                ],
            ],
            [
                'email' => 'carlos@workconnect.test',
                'name' => 'Carlos Vega',
                'username' => 'carlos-vega',
                'city' => 'Trujillo, Perú',
                'bio' => 'Desarrollador junior enfocado en React y APIs. Busco mis primeros proyectos pagados.',
                'rating' => 3.9,
                'experience' => 'Estudiante de ingeniería · Desarrollo web',
                'skills' => [
                    'React' => 'intermedio',
                    'Laravel' => 'intermedio',
                    'Tailwind CSS' => 'intermedio',
                    'MySQL' => 'intermedio',
                ],
                'portfolio' => [],
            ],
        ];

        foreach ($freelancers as $data) {
            $skills = $data['skills'];
            $portfolio = $data['portfolio'];
            unset($data['skills'], $data['portfolio']);

            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    ...$data,
                    'password' => Hash::make(self::DEFAULT_PASSWORD),
                    'role' => 'freelancer',
                    'verified' => true,
                ],
            );

            $sync = collect($skills)->mapWithKeys(function ($level, $name) {
                $skill = Skill::query()->where('name', $name)->first();

                return $skill ? [$skill->id => ['level' => $level]] : [];
            })->all();

            $user->skills()->sync($sync);

            foreach ($portfolio as $project) {
                PortfolioProject::query()->updateOrCreate(
                    ['user_id' => $user->id, 'title' => $project['title']],
                    $project,
                );
            }
        }
    }
}
