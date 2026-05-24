<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->id === (int) $this->route('user')?->id
            || $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($userId)],
            'city' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'github' => ['nullable', 'url', 'max:255'],
            'linkedin' => ['nullable', 'url', 'max:255'],
            'experience' => ['nullable', 'string', 'max:5000'],
            'skill_ids'    => ['nullable', 'array'],
            'skill_ids.*'  => ['exists:skills,id'],
            'skill_names'   => ['nullable', 'array'],
            'skill_names.*' => ['string', 'max:100'],
        ];
    }
}
