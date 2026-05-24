<?php

namespace Database\Seeders\Concerns;

use App\Models\Skill;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

trait SeedsDemoAccounts
{
    public const DEMO_PASSWORD = 'password';

    protected function demoPassword(): string
    {
        return Hash::make(self::DEMO_PASSWORD);
    }

    /**
     * @param  array<string, string>  $skills  nombre => nivel (basico|intermedio|avanzado)
     */
    protected function syncUserSkills(User $user, array $skills): void
    {
        $sync = collect($skills)->mapWithKeys(function (string $level, string $name) {
            $skill = Skill::query()->where('name', $name)->first();

            return $skill ? [$skill->id => ['level' => $level]] : [];
        })->all();

        $user->skills()->sync($sync);
    }

    protected function printSeedBanner(): void
    {
        if (! $this->command) {
            return;
        }

        $this->command->newLine();
        $this->command->info('═══ WorkConnect · datos demo listos ═══');
        $this->command->table(
            ['Rol', 'Email', 'Contraseña', 'Notas'],
            [
                ['Admin', 'admin@workconnect.test', self::DEMO_PASSWORD, 'Gestión global'],
                ['Admin', 'soporte@workconnect.test', self::DEMO_PASSWORD, 'Soporte / moderación'],
                ['Freelancer', 'maria@workconnect.test', self::DEMO_PASSWORD, 'UI + React · match alto en diseño'],
                ['Freelancer', 'alex@workconnect.test', self::DEMO_PASSWORD, 'Fullstack + IA'],
                ['Freelancer', 'demo@workconnect.test', self::DEMO_PASSWORD, 'Sin skills · match ~8% (probar coach IA)'],
                ['Freelancer', 'carlos@workconnect.test', self::DEMO_PASSWORD, 'Junior React/Laravel'],
                ['Freelancer', 'sofia@workconnect.test', self::DEMO_PASSWORD, 'Video + diseño'],
                ['Cliente', 'nimbus@workconnect.test', self::DEMO_PASSWORD, 'Proyectos SaaS / Figma'],
                ['Cliente', 'flux@workconnect.test', self::DEMO_PASSWORD, 'Dashboard React'],
                ['Cliente', 'pyme@workconnect.test', self::DEMO_PASSWORD, 'La Canasta · PYME Colombia'],
            ],
        );
        $this->command->comment('Ejecuta: php artisan migrate:fresh --seed');
    }
}
