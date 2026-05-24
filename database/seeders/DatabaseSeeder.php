<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Datos demo WorkConnect (usuarios, proyectos, postulaciones, carrera).
     *
     * @see WorkConnectSeeder
     */
    public function run(): void
    {
        $this->call(WorkConnectSeeder::class);
    }
}
