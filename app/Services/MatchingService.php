<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MatchingService
{
    public function scoreJobForUser(User $user, WorkJob $job): int
    {
        $user->loadMissing('skills');

        $userSkills = $user->skills->pluck('name')->map(fn ($s) => $this->normalizeSkill($s));
        $jobTags = $this->extractJobSkillTags($job);

        $profileBonus = $this->profileBonus($user);

        if ($jobTags->isEmpty()) {
            return min(100, max(0, 20 + $profileBonus));
        }

        if ($userSkills->isEmpty()) {
            $categoryHint = $this->categoryAffinityScore($user, $job);

            return min(35, max(5, $categoryHint + $profileBonus));
        }

        $matched = $this->countSkillMatches($userSkills, $jobTags);
        $ratio = $matched / max(1, $jobTags->count());
        $skillScore = (int) round($ratio * 82);

        $cityBonus = $user->city && $job->location
            && Str::contains(Str::lower($job->location), Str::lower($user->city)) ? 4 : 0;

        return min(100, max(0, $skillScore + $profileBonus + $cityBonus));
    }

    /**
     * @return Collection<int, array{job: WorkJob, match: int}>
     */
    public function recommendJobsForUser(User $user, int $limit = 10): Collection
    {
        return WorkJob::query()
            ->where('status', 'open')
            ->with('owner')
            ->get()
            ->map(fn (WorkJob $job) => [
                'job' => $job,
                'match' => $this->scoreJobForUser($user, $job),
            ])
            ->sortByDesc('match')
            ->take($limit)
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function extractJobSkillTags(WorkJob $job): Collection
    {
        $tags = collect($job->skills ?? [])
            ->filter()
            ->map(fn ($s) => $this->normalizeSkill((string) $s));

        $desc = Str::lower((string) $job->description);
        foreach (['react', 'laravel', 'figma', 'tailwind', 'typescript', 'php', 'mysql', 'ui', 'design', 'vue', 'node'] as $keyword) {
            if (Str::contains($desc, $keyword)) {
                $tags->push($keyword);
            }
        }

        return $tags->unique()->filter()->values();
    }

    /**
     * @param  Collection<int, string>  $userSkills
     * @param  Collection<int, string>  $jobTags
     */
    private function countSkillMatches(Collection $userSkills, Collection $jobTags): int
    {
        $matched = 0;

        foreach ($jobTags as $tag) {
            foreach ($userSkills as $userSkill) {
                if ($this->skillsMatch($userSkill, $tag)) {
                    $matched++;
                    break;
                }
            }
        }

        return $matched;
    }

    private function skillsMatch(string $a, string $b): bool
    {
        if ($a === $b) {
            return true;
        }

        if (Str::contains($a, $b) || Str::contains($b, $a)) {
            return true;
        }

        $compact = fn (string $s) => preg_replace('/[\s.\-_]+/', '', $s) ?? $s;

        return $compact($a) === $compact($b);
    }

    private function normalizeSkill(string $skill): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $skill) ?? $skill));
    }

    private function profileBonus(User $user): int
    {
        $ratingBonus = (int) min(8, ($user->rating ?? 0) * 2);

        return $ratingBonus + ($user->verified ? 4 : 0);
    }

    private function categoryAffinityScore(User $user, WorkJob $job): int
    {
        $bio = Str::lower((string) ($user->bio ?? ''));
        $category = Str::lower((string) $job->category);
        $title = Str::lower((string) $job->title);

        $designSignals = ['diseño', 'design', 'ui', 'ux', 'figma'];
        $devSignals = ['desarrollo', 'dev', 'react', 'laravel', 'program'];

        $userDesign = Str::contains($bio, $designSignals);
        $userDev = Str::contains($bio, $devSignals);
        $jobDesign = Str::contains($category.$title, $designSignals);
        $jobDev = Str::contains($category.$title, $devSignals);

        if (($userDesign && $jobDesign) || ($userDev && $jobDev)) {
            return 18;
        }

        return 8;
    }
}
