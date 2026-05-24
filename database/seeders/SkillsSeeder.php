<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

/**
 * Catálogo de skills alineado con matching, filtros de explorar y evaluaciones IA.
 */
class SkillsSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            // Desarrollo
            ['name' => 'React', 'category' => 'Desarrollo'],
            ['name' => 'Laravel', 'category' => 'Desarrollo'],
            ['name' => 'TypeScript', 'category' => 'Desarrollo'],
            ['name' => 'Tailwind CSS', 'category' => 'Desarrollo'],
            ['name' => 'JavaScript', 'category' => 'Desarrollo'],
            ['name' => 'PHP', 'category' => 'Desarrollo'],
            ['name' => 'MySQL', 'category' => 'Desarrollo'],
            ['name' => 'PostgreSQL', 'category' => 'Desarrollo'],
            ['name' => 'Framer Motion', 'category' => 'Desarrollo'],
            ['name' => 'Vue', 'category' => 'Desarrollo'],
            ['name' => 'Node.js', 'category' => 'Desarrollo'],
            ['name' => 'HTML', 'category' => 'Desarrollo'],
            ['name' => 'CSS', 'category' => 'Desarrollo'],
            // Diseño
            ['name' => 'Figma', 'category' => 'Diseño'],
            ['name' => 'UI Design', 'category' => 'Diseño'],
            ['name' => 'UX Research', 'category' => 'Diseño'],
            ['name' => 'Illustrator', 'category' => 'Diseño'],
            ['name' => 'Design systems', 'category' => 'Diseño'],
            // Video
            ['name' => 'Premiere', 'category' => 'Video'],
            ['name' => 'After Effects', 'category' => 'Video'],
            // Marketing
            ['name' => 'Copywriting', 'category' => 'Marketing'],
            ['name' => 'Meta Ads', 'category' => 'Marketing'],
            ['name' => 'SEO', 'category' => 'Marketing'],
            // IA
            ['name' => 'OpenAI API', 'category' => 'IA'],
        ];

        foreach ($skills as $skill) {
            Skill::query()->firstOrCreate(['name' => $skill['name']], $skill);
        }
    }
}
