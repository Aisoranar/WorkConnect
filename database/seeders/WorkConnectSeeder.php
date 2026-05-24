<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Orquestador principal de datos demo WorkConnect.
 */
class WorkConnectSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SkillsSeeder::class,
            AdminSeeder::class,
            FreelancerSeeder::class,
            ClientSeeder::class,
            DemoRelationsSeeder::class,
            ExternalJobListingSeeder::class,
        ]);
    }
}
