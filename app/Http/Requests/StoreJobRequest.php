<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isClient() || $this->user()?->isAdmin();
    }

    protected function failedAuthorization(): void
    {
        abort(403, 'Solo empresas pueden publicar proyectos.');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'budget' => ['required', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:100'],
            'remote' => ['boolean'],
            'category' => ['nullable', 'string', 'max:100'],
            'deadline' => ['nullable', 'date'],
            'company' => ['nullable', 'string', 'max:255'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:50'],
        ];
    }
}
