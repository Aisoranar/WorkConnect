<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'username' => ['nullable', 'string', 'max:50', 'unique:users,username'],
            'role' => ['nullable', 'in:freelancer,client,admin'],
            'city' => ['nullable', 'string', 'max:100'],
        ];
    }
}
