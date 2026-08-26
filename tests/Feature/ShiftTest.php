<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegisterShift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_open_a_shift_with_a_fund_and_not_a_second_one(): void
    {
        $cajera = User::factory()->create();

        $this->actingAs($cajera)
            ->post('/turnos/abrir', ['opening_amount' => '500.00'])
            ->assertSessionHasNoErrors();

        $shift = CashRegisterShift::where('user_id', $cajera->id)->firstOrFail();
        $this->assertSame(50000, $shift->opening_amount_cents);
        $this->assertSame('open', $shift->status);

        $segundoIntento = $this->actingAs($cajera)->post('/turnos/abrir', ['opening_amount' => '200.00']);

        $this->assertSame(1, CashRegisterShift::where('user_id', $cajera->id)->count());
        $segundoIntento->assertSessionHas('error', 'Ya tienes un turno abierto.');
    }

    public function test_caja_redirects_to_opening_screen_without_an_open_shift(): void
    {
        $cajera = User::factory()->create();

        $this->actingAs($cajera)->get('/caja')->assertRedirect(route('turnos.abrir'));
    }

    public function test_caja_shows_the_point_of_sale_screen_when_a_shift_is_open(): void
    {
        $cajera = User::factory()->create();
        CashRegisterShift::factory()->for($cajera)->for($cajera->branch)->create();

        // Desde la Fase 4, /caja con turno abierto YA NO redirige a turnos.show — es el
        // punto de venta real (PosController@index).
        $this->actingAs($cajera)->get('/caja')->assertOk();
    }

    public function test_closing_with_the_exact_expected_cash_shows_zero_difference(): void
    {
        $cajera = User::factory()->create();
        $shift = CashRegisterShift::factory()->for($cajera)->for($cajera->branch)->create([
            'opening_amount_cents' => 50000,
        ]);

        $this->actingAs($cajera)
            ->put("/turnos/{$shift->id}/cerrar", ['actual_cash' => '500.00'])
            ->assertSessionHasNoErrors();

        $shift->refresh();
        $this->assertSame('closed', $shift->status);
        $this->assertSame(50000, $shift->expected_cash_cents);
        $this->assertSame(50000, $shift->actual_cash_cents);
        $this->assertSame(0, $shift->difference_cents);
    }

    public function test_closing_with_fifty_pesos_less_shows_a_negative_difference(): void
    {
        $cajera = User::factory()->create();
        $shift = CashRegisterShift::factory()->for($cajera)->for($cajera->branch)->create([
            'opening_amount_cents' => 50000,
        ]);

        $this->actingAs($cajera)->put("/turnos/{$shift->id}/cerrar", ['actual_cash' => '450.00']);

        $this->assertSame(-5000, $shift->fresh()->difference_cents);
    }

    public function test_a_cajera_cannot_see_another_cajeras_shift_but_an_admin_sees_every_shift(): void
    {
        $branch = Branch::factory()->create();
        $cajera1 = User::factory()->create(['branch_id' => $branch->id]);
        $cajera2 = User::factory()->create(['branch_id' => $branch->id]);
        $admin = User::factory()->admin()->create(['branch_id' => $branch->id]);

        $shiftDeCajera1 = CashRegisterShift::factory()->for($cajera1)->for($branch)->create();

        $this->actingAs($cajera2)->get("/turnos/{$shiftDeCajera1->id}")->assertForbidden();
        $this->actingAs($admin)->get("/turnos/{$shiftDeCajera1->id}")->assertOk();
    }

    public function test_a_cajera_cannot_close_someone_elses_shift(): void
    {
        $branch = Branch::factory()->create();
        $cajera1 = User::factory()->create(['branch_id' => $branch->id]);
        $cajera2 = User::factory()->create(['branch_id' => $branch->id]);

        $shiftDeCajera1 = CashRegisterShift::factory()->for($cajera1)->for($branch)->create();

        $this->actingAs($cajera2)
            ->put("/turnos/{$shiftDeCajera1->id}/cerrar", ['actual_cash' => '500.00'])
            ->assertForbidden();
    }

    public function test_the_shifts_index_scopes_to_the_cajeras_own_shifts_but_shows_all_to_admins(): void
    {
        $branch = Branch::factory()->create();
        $cajera1 = User::factory()->create(['branch_id' => $branch->id]);
        $cajera2 = User::factory()->create(['branch_id' => $branch->id]);
        $admin = User::factory()->admin()->create(['branch_id' => $branch->id]);

        CashRegisterShift::factory()->for($cajera1)->for($branch)->create(['status' => 'closed', 'closed_at' => now()]);
        CashRegisterShift::factory()->for($cajera2)->for($branch)->create(['status' => 'closed', 'closed_at' => now()]);

        $respuestaCajera = $this->actingAs($cajera1)->get('/turnos');
        $respuestaCajera->assertInertia(fn ($page) => $page->has('closedShifts', 1));

        $respuestaAdmin = $this->actingAs($admin)->get('/turnos');
        $respuestaAdmin->assertInertia(fn ($page) => $page->has('closedShifts', 2));
    }
}
