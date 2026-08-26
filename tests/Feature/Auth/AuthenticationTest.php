<?php

namespace Tests\Feature\Auth;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_with_username_and_password(): void
    {
        User::factory()->create(['username' => 'admin']);

        $response = $this->post('/login', [
            'username' => 'admin',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_wrong_password_gives_a_generic_error_that_does_not_reveal_the_user_exists(): void
    {
        User::factory()->create(['username' => 'admin']);

        $existing = $this->post('/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ]);
        $existing->assertSessionHasErrors('username');
        $this->assertSame(
            'Usuario o contraseña incorrectos.',
            session('errors')->get('username')[0],
        );

        $missing = $this->post('/login', [
            'username' => 'no-existe',
            'password' => 'wrong-password',
        ]);
        $missing->assertSessionHasErrors('username');
        $this->assertSame(
            'Usuario o contraseña incorrectos.',
            session('errors')->get('username')[0],
        );

        $this->assertGuest();
    }

    public function test_users_can_authenticate_with_pin(): void
    {
        User::factory()->withPin('1234')->create();

        $response = $this->post('/login/pin', ['pin' => '1234']);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_pin_login_locks_after_five_failed_attempts(): void
    {
        User::factory()->withPin('1234')->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login/pin', ['pin' => '9999'])
                ->assertSessionHasErrors('pin');
        }

        $this->assertSame(5, LoginAttempt::where('kind', 'pin')->count());

        $sixthAttempt = $this->post('/login/pin', ['pin' => '1234']);

        $sixthAttempt->assertSessionHasErrors('pin');
        $this->assertGuest();
        $this->assertSame(
            'Demasiados intentos, espera unos minutos.',
            session('errors')->get('pin')[0],
        );
    }

    public function test_dashboard_redirects_guests_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_session_cookie_is_http_only(): void
    {
        $response = $this->get('/login');

        $sessionCookie = collect($response->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === config('session.cookie'));

        $this->assertNotNull($sessionCookie);
        $this->assertTrue($sessionCookie->isHttpOnly());
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('login'));
    }
}
