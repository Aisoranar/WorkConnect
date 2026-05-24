<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\SeedsDemoAccounts;
use Illuminate\Database\Seeder;

/**
 * Orquestador principal — orden importa por dependencias entre modelos.
 */
class WorkConnectSeeder extends Seeder
{
    use SeedsDemoAccounts;

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

        $this->printSeedBanner();
    }
}
