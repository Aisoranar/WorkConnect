<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\User;
use App\Models\WorkJob;
use App\Services\MatchingService;
use Carbon\Carbon;

class LegacyApiFormatter
{
    public function __construct(private readonly MatchingService $matching) {}

    public function job(WorkJob $job, ?User $user = null, ?JobApplication $application = null): array
    {
        $match = $user
            ? $this->matching->scoreJobForUser($user, $job)
            : (($job->applications_count ?? 0) > 0 ? 75 : 70);

        return [
            'id' => (string) $job->id,
            'title' => $job->title,
            'company' => $job->company ?? $job->owner?->name ?? 'Cliente',
            'budget' => $job->budget,
            'location' => $job->location ?? 'Remoto',
            'remote' => (bool) $job->remote,
            'status' => $job->status,
            'category' => $job->category ?? 'General',
            'description' => $job->description,
            'skills' => $job->skills ?? [],
            'match' => $match,
            'postedAgo' => $job->created_at?->locale('es')->diffForHumans(short: true) ?? 'reciente',
            'applicants' => (int) ($job->applications_count ?? $job->applications()->count()),
            'alreadyApplied' => $application !== null,
            'applicationStatus' => $application?->status,
            'isNew' => $job->created_at?->isAfter(now()->subDays(5)) ?? false,
        ];
    }

    public function application(JobApplication $application): array
    {
        $application->loadMissing(['job.owner', 'user']);
        $job = $application->job;
        $applicant = $application->user;
        $match = $applicant ? $this->matching->scoreJobForUser($applicant, $job) : null;

        return [
            'id' => (string) $application->id,
            'jobId' => (string) $application->job_id,
            'jobTitle' => $job->title,
            'company' => $job->company ?? $job->owner?->name ?? 'Cliente',
            'price' => $application->price,
            'deliveryTime' => $application->delivery_time,
            'proposal' => $application->proposal,
            'status' => $application->status,
            'sentAgo' => $application->created_at?->locale('es')->diffForHumans(short: true) ?? 'reciente',
            'sentAt' => $application->created_at?->toIso8601String(),
            'match' => $match,
            'job' => [
                'id' => (string) $job->id,
                'title' => $job->title,
                'company' => $job->company ?? $job->owner?->name ?? 'Cliente',
                'budget' => $job->budget,
                'category' => $job->category ?? 'General',
                'description' => $job->description,
                'skills' => $job->skills ?? [],
                'location' => $job->location ?? 'Remoto',
                'remote' => (bool) $job->remote,
                'status' => $job->status,
                'postedAgo' => $job->created_at?->locale('es')->diffForHumans(short: true) ?? 'reciente',
            ],
        ];
    }

    public function inboxConversation(User $contact, string $preview, int $unread, Carbon|string|null $time): array
    {
        $initials = collect(explode(' ', $contact->name))
            ->map(fn ($w) => mb_substr($w, 0, 1))
            ->take(2)
            ->implode('');

        return [
            'id' => (string) $contact->id,
            'name' => $contact->name,
            'avatar' => strtoupper($initials) ?: 'WC',
            'preview' => $preview,
            'time' => $time instanceof Carbon ? $time->format('H:i') : (string) $time,
            'unread' => $unread,
        ];
    }
}
