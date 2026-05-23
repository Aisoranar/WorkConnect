<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Super administrador con acceso total a la plataforma (rol: admin).
 */
class AdminSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'password';

    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@workconnect.test'],
            [
                'name' => 'Admin WorkConnect',
                'username' => 'superadmin',
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => 'admin',
                'city' => 'Lima, Perú',
                'bio' => 'Cuenta de administración de la plataforma. Acceso a gestión global, usuarios y proyectos.',
                'rating' => 5.0,
                'verified' => true,
                'experience' => 'Superadmin · Operaciones WorkConnect',
            ],
        );

        // Admin secundario (soporte)
        User::query()->updateOrCreate(
            ['email' => 'soporte@workconnect.test'],
            [
                'name' => 'Equipo Soporte',
                'username' => 'soporte-wc',
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => 'admin',
                'city' => 'Remoto',
                'bio' => 'Moderación y soporte a usuarios.',
                'rating' => 5.0,
                'verified' => true,
            ],
        );
    }
}
