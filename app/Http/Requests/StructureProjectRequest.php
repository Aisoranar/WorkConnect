<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StructureProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isClient() || $this->user()?->isAdmin();
    }

    protected function failedAuthorization(): void
    {
        abort(403, 'Solo empresas pueden estructurar proyectos. Regístrate como cliente o usa una cuenta empresa.');
    }

    public function rules(): array
    {
        return [
            'raw_need' => ['required', 'string', 'min:20', 'max:3000'],
            'currency' => ['required', Rule::in(['COP', 'USD', 'cop', 'usd'])],
            'budget_amount' => ['required', 'numeric', 'min:1'],
            'business_context' => ['nullable', 'string', 'max:500'],
        ];
    }
}
