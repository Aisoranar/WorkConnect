<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'proposal' => ['required', 'string', 'max:5000'],
            'price' => ['required', 'string', 'max:50'],
            'delivery_time' => ['required', 'string', 'max:100'],
        ];
    }
}
