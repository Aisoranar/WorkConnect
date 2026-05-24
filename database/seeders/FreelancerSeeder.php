<?php

namespace Database\Seeders;

use App\Models\PortfolioProject;
use App\Models\User;
use Database\Seeders\Concerns\SeedsDemoAccounts;
use Illuminate\Database\Seeder;

/**
 * Talentos demo: perfiles variados para probar match, coach IA, evaluaciones y postulaciones.
 */
class FreelancerSeeder extends Seeder
{
    use SeedsDemoAccounts;

    public function run(): void
    {
        $freelancers = [
            [
                'email' => 'demo@workconnect.test',
                'name' => 'Usuario Demo',
                'username' => 'usuario-demo',
                'city' => 'Lima, Perú',
                'bio' => 'Cuenta vacía a propósito: prueba el coach de match, recomendaciones de skills y el flujo de certificación con IA.',
                'rating' => 0,
                'verified' => false,
                'experience' => 'Perfil nuevo · Completa skills y postula',
                'skills' => [],
                'portfolio' => [],
            ],
            [
                'email' => 'maria@workconnect.test',
                'name' => 'María Álvarez',
                'username' => 'maria-alvarez',
                'city' => 'Lima, Perú',
                'bio' => 'Diseñadora UI y frontend. Especialista en SaaS, fintech y landings de conversión con Figma + React.',
                'rating' => 4.9,
                'experience' => 'UI/UX · Frontend · 3 años en startups peruanas y remotas.',
                'github' => 'https://github.com/maria-alvarez',
                'linkedin' => 'https://linkedin.com/in/maria-alvarez',
                'skills' => [
                    'Figma' => 'avanzado',
                    'UI Design' => 'avanzado',
                    'React' => 'avanzado',
                    'Tailwind CSS' => 'avanzado',
                    'TypeScript' => 'intermedio',
                    'Framer Motion' => 'intermedio',
                    'Design systems' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'Landing fintech Nimbus',
                        'description' => 'Landing SaaS glassmorphism, +22% conversión en registro.',
                        'technologies' => ['Figma', 'React', 'Tailwind CSS'],
                    ],
                    [
                        'title' => 'Design system Flux',
                        'description' => 'Biblioteca de componentes y tokens para dashboard analytics.',
                        'technologies' => ['Figma', 'UI Design'],
                    ],
                ],
            ],
            [
                'email' => 'alex@workconnect.test',
                'name' => 'Alex Romero',
                'username' => 'alex-romero',
                'city' => 'Lima, Perú',
                'bio' => 'Fullstack React + Laravel. Integro IA en productos (propuestas, matching, automatización).',
                'rating' => 4.8,
                'experience' => 'Fullstack Developer · APIs REST · OpenAI',
                'github' => 'https://github.com/alexromero',
                'linkedin' => 'https://linkedin.com/in/alexromero',
                'skills' => [
                    'React' => 'avanzado',
                    'Laravel' => 'avanzado',
                    'TypeScript' => 'avanzado',
                    'Tailwind CSS' => 'avanzado',
                    'OpenAI API' => 'avanzado',
                    'MySQL' => 'avanzado',
                    'PostgreSQL' => 'intermedio',
                    'Framer Motion' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'API WorkConnect MVP',
                        'description' => 'Backend Laravel 13, Sanctum, matching por skills y asesor IA.',
                        'technologies' => ['Laravel', 'OpenAI API'],
                    ],
                ],
            ],
            [
                'email' => 'carlos@workconnect.test',
                'name' => 'Carlos Vega',
                'username' => 'carlos-vega',
                'city' => 'Trujillo, Perú',
                'bio' => 'Estudiante de ingeniería. Busco primeros proyectos pagados en front y APIs.',
                'rating' => 3.9,
                'experience' => 'Estudiante · Prácticas universitarias en web',
                'skills' => [
                    'React' => 'intermedio',
                    'Laravel' => 'intermedio',
                    'Tailwind CSS' => 'intermedio',
                    'MySQL' => 'intermedio',
                    'JavaScript' => 'intermedio',
                ],
                'portfolio' => [
                    [
                        'title' => 'CRUD académico inventario',
                        'description' => 'App Laravel + React para curso de ingeniería.',
                        'technologies' => ['Laravel', 'React'],
                    ],
                ],
            ],
            [
                'email' => 'sofia@workconnect.test',
                'name' => 'Sofía Mendoza',
                'username' => 'sofia-mendoza',
                'city' => 'Arequipa, Perú',
                'bio' => 'Editora y diseñadora multimedia. Reels, branding y piezas para Instagram/TikTok.',
                'rating' => 4.2,
                'experience' => 'Estudiante diseño · Freelance video & social',
                'skills' => [
                    'Premiere' => 'avanzado',
                    'After Effects' => 'intermedio',
                    'Figma' => 'intermedio',
                    'Copywriting' => 'intermedio',
                    'Illustrator' => 'basico',
                ],
                'portfolio' => [
                    [
                        'title' => 'Campaña reels cafetería',
                        'description' => '8 reels + 4 stories; +40% engagement en 30 días.',
                        'technologies' => ['Premiere', 'After Effects'],
                    ],
                ],
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
                    'password' => $this->demoPassword(),
                    'role' => 'freelancer',
                    'verified' => (bool) ($data['verified'] ?? true),
                ],
            );

            $this->syncUserSkills($user, $skills);

            foreach ($portfolio as $project) {
                PortfolioProject::query()->updateOrCreate(
                    ['user_id' => $user->id, 'title' => $project['title']],
                    $project,
                );
            }
        }
    }
}
