<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            'role' => $this->role,
            'city' => $this->city,
            'avatar' => $this->avatar ? url('storage/'.$this->avatar) : null,
            'bio' => $this->bio,
            'rating' => $this->rating,
            'verified' => $this->verified,
            'github' => $this->github,
            'linkedin' => $this->linkedin,
            'experience' => $this->experience,
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
            'portfolio' => PortfolioProjectResource::collection($this->whenLoaded('portfolioProjects')),
            'created_at' => $this->created_at,
        ];
    }
}
