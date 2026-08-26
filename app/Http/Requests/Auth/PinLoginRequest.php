<?php

namespace App\Http\Requests\Auth;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * §5 del prompt maestro: PIN de 4 a 6 dígitos, único entre los usuarios activos (un solo
 * negocio, no hace falta scoparlo por sucursal). Límite de 5 intentos fallidos por IP en
 * 15 minutos, guardado en `login_attempts` — nunca en memoria del proceso (§1.1).
 */
class PinLoginRequest extends FormRequest
{
    private const MAX_ATTEMPTS = 5;

    private const DECAY_MINUTES = 15;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pin' => ['required', 'string', 'regex:/^\d{4,6}$/'],
        ];
    }

    /**
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $pin = $this->string('pin')->value();

        $user = User::query()
            ->where('is_active', true)
            ->whereNotNull('pin_hash')
            ->get()
            ->first(fn (User $candidate) => Hash::check($pin, $candidate->pin_hash));

        if (! $user) {
            LoginAttempt::create([
                'ip' => $this->ip(),
                'kind' => 'pin',
                'attempted_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'pin' => 'PIN incorrecto.',
            ]);
        }

        Auth::login($user);
    }

    /**
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        $recentFailures = LoginAttempt::query()
            ->where('ip', $this->ip())
            ->where('kind', 'pin')
            ->where('attempted_at', '>=', now()->subMinutes(self::DECAY_MINUTES))
            ->count();

        if ($recentFailures < self::MAX_ATTEMPTS) {
            return;
        }

        throw ValidationException::withMessages([
            'pin' => 'Demasiados intentos, espera unos minutos.',
        ]);
    }
}
