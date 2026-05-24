<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Mail\WelcomeRegisteredMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
            'username' => $request->input('username') ?: Str::slug($request->input('name')).'-'.Str::random(4),
            'role' => $request->input('role', 'freelancer'),
            'city' => $request->input('city'),
        ]);

        $token = $user->createToken('api')->plainTextToken;

        $this->sendWelcomeEmail($user);

        return response()->json([
            'message' => 'Registro exitoso. Revisa tu correo para confirmar la bienvenida.',
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        // Elimina tokens antiguos de esta misma app (evita acumulación) y crea uno nuevo.
        // Se eliminan solo los tokens con nombre 'api' para no invalidar otros clientes.
        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['skills', 'portfolioProjects']);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink(['email' => $request->input('email')]);

        return response()->json([
            'message' => 'Si el correo está registrado, enviamos instrucciones para restablecer tu contraseña.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_TOKEN => 'El enlace de recuperación no es válido o expiró.',
                    Password::INVALID_USER => 'No encontramos una cuenta con ese correo.',
                    default => 'No pudimos restablecer la contraseña. Intenta solicitar un nuevo enlace.',
                },
            ], 422);
        }

        return response()->json([
            'message' => 'Contraseña actualizada. Ya puedes iniciar sesión.',
        ]);
    }

    private function sendWelcomeEmail(User $user): void
    {
        if (! filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL)) {
            return;
        }

        try {
            Mail::to($user->email)->send(new WelcomeRegisteredMail($user));
        } catch (\Throwable $e) {
            Log::warning('No se pudo enviar correo de bienvenida.', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
