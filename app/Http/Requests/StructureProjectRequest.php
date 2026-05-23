<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StructureProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isClient() || $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'raw_need' => ['required', 'string', 'min:20', 'max:3000'],
            'budget' => ['required', 'string', 'max:50'],
            'business_context' => ['nullable', 'string', 'max:500'],
        ];
    }
}
