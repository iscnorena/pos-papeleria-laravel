<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `requerirRol` del prompt maestro (§2): la autorización se revalida siempre en el
 * servidor, nunca confiando en que la interfaz haya escondido un botón.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless($user && in_array($user->role->value, $roles, true), 403);

        return $next($request);
    }
}
