<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_guests_visiting_root_end_up_at_login(): void
    {
        $this->get('/')->assertRedirect(route('dashboard', absolute: false));

        $this->get('/dashboard')->assertRedirect('/login');
    }
}
