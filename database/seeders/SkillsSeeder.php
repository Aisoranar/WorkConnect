<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillsSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            ['name' => 'React', 'category' => 'Desarrollo'],
            ['name' => 'Laravel', 'category' => 'Desarrollo'],
            ['name' => 'Figma', 'category' => 'Diseño'],
            ['name' => 'Tailwind CSS', 'category' => 'Desarrollo'],
            ['name' => 'UI Design', 'category' => 'Diseño'],
            ['name' => 'TypeScript', 'category' => 'Desarrollo'],
            ['name' => 'MySQL', 'category' => 'Desarrollo'],
            ['name' => 'Premiere', 'category' => 'Video'],
            ['name' => 'Framer Motion', 'category' => 'Desarrollo'],
            ['name' => 'OpenAI API', 'category' => 'IA'],
            ['name' => 'PostgreSQL', 'category' => 'Desarrollo'],
            ['name' => 'Copywriting', 'category' => 'Marketing'],
            ['name' => 'Meta Ads', 'category' => 'Marketing'],
            ['name' => 'Illustrator', 'category' => 'Diseño'],
        ];

        foreach ($skills as $skill) {
            Skill::query()->firstOrCreate(['name' => $skill['name']], $skill);
        }
    }
}
