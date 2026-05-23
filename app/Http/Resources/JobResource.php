<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'budget' => $this->budget,
            'location' => $this->location,
            'remote' => $this->remote,
            'status' => $this->status,
            'category' => $this->category,
            'deadline' => $this->deadline?->toDateString(),
            'company' => $this->company,
            'skills' => $this->skills ?? [],
            'owner' => new UserResource($this->whenLoaded('owner')),
            'applications_count' => $this->whenCounted('applications'),
            'created_at' => $this->created_at,
        ];
    }
}
