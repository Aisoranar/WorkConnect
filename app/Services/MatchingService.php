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

        $userSkills = $user->skills->pluck('name')->map(fn ($s) => Str::lower($s));
        $jobTags = collect($job->skills ?? [])
            ->map(fn ($s) => Str::lower($s));

        foreach (['react', 'laravel', 'figma', 'tailwind', 'php', 'mysql', 'ui', 'design'] as $keyword) {
            if (Str::contains(Str::lower($job->description), $keyword)) {
                $jobTags->push($keyword);
            }
        }

        $jobTags = $jobTags->unique()->filter();
        $overlap = $userSkills->intersect($jobTags)->count();
        $totalTags = max(1, $jobTags->count());

        $skillScore = (int) round(($overlap / $totalTags) * 70);
        $ratingBonus = (int) min(15, ($user->rating ?? 0) * 3);
        $verifiedBonus = $user->verified ? 5 : 0;
        $cityBonus = $user->city && $job->location
            && Str::contains(Str::lower($job->location), Str::lower($user->city)) ? 5 : 0;

        return min(100, max(40, $skillScore + $ratingBonus + $verifiedBonus + $cityBonus + 10));
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
}
