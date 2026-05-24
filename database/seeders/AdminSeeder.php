<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkJob;
use Database\Seeders\Concerns\SeedsDemoAccounts;
use Illuminate\Database\Seeder;

/**
 * Administradores y un proyecto piloto publicado por la plataforma (PYME demo).
 */
class AdminSeeder extends Seeder
{
    use SeedsDemoAccounts;

    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@workconnect.test'],
            [
                'name' => 'Admin WorkConnect',
                'username' => 'superadmin',
                'password' => $this->demoPassword(),
                'role' => 'admin',
                'city' => 'Lima, Perú',
                'bio' => 'Cuenta de administración. Gestión global, moderación y proyectos piloto para talento joven.',
                'rating' => 5.0,
                'verified' => true,
                'experience' => 'Operaciones · Onboarding PYMEs · Programa piloto LATAM',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'soporte@workconnect.test'],
            [
                'name' => 'Equipo Soporte',
                'username' => 'soporte-wc',
                'password' => $this->demoPassword(),
                'role' => 'admin',
                'city' => 'Remoto',
                'bio' => 'Moderación, reportes y ayuda a freelancers y clientes.',
                'rating' => 5.0,
                'verified' => true,
            ],
        );

        WorkJob::query()->updateOrCreate(
            [
                'user_id' => $admin->id,
                'title' => 'Landing page para Alimentos',
            ],
            [
                'company' => 'PYME Piloto · WorkConnect',
                'budget' => '$800',
                'location' => 'Remoto',
                'remote' => true,
                'status' => 'open',
                'category' => 'Desarrollo',
                'description' => <<<'DESC'
Contexto del negocio: «Alimentos del Barrio» vende víveres y menús del día en Lima. Necesitan presencia web sencilla.

Necesidad del cliente:
- Que la gente los encuentre en Google y los contacte por WhatsApp.
- Mostrar productos destacados, horario y zona de reparto.

Entregables esperados:
- Sitio responsive (móvil primero) o landing de una sección.
- Código en repositorio Git con README de despliegue.
- Botón/flujo claro a WhatsApp Business.

Ideal para talento joven con React o stack similar. Proyecto acotado, mentoría disponible vía WorkConnect.
DESC,
                'skills' => ['React', 'Laravel', 'Tailwind CSS', 'JavaScript'],
            ],
        );
    }
}
