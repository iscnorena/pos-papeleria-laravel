<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegisterShift;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\ReportService;
use App\Support\Fechas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SalesAndReportsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Branch}
     */
    private function cajeraConTurno(): array
    {
        $branch = Branch::factory()->create();
        $cajera = User::factory()->create(['branch_id' => $branch->id]);
        CashRegisterShift::factory()->for($cajera)->for($branch)->create();

        return [$cajera, $branch];
    }

    private function venderUnProducto(User $cajera, Product $product, int $centavos): Sale
    {
        $this->actingAs($cajera)->post('/caja', [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [['method' => 'cash', 'amount_cents' => $centavos]],
        ])->assertSessionHasNoErrors();

        return Sale::latest('id')->firstOrFail();
    }

    public function test_the_daily_report_matches_the_sum_of_the_days_history(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $admin = User::factory()->admin()->create();

        $productoA = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);
        $productoB = Product::factory()->create(['sale_price_cents' => 2500, 'manages_inventory' => false]);

        $this->venderUnProducto($cajera, $productoA, 1000);
        $this->venderUnProducto($cajera, $productoB, 2500);

        $hoy = now(config('pos.timezone'))->toDateString();

        $this->actingAs($admin)
            ->get(route('reportes.diario', ['desde' => $hoy, 'hasta' => $hoy]))
            ->assertInertia(fn ($page) => $page
                ->where('totales.ventas', 2)
                ->where('totales.ingresoCents', 3500));

        $this->actingAs($admin)
            ->get(route('ventas.index', ['desde' => $hoy, 'hasta' => $hoy]))
            ->assertInertia(fn ($page) => $page->has('sales', 2));
    }

    public function test_cancelling_a_sale_returns_stock_removes_it_from_report_totals_and_keeps_it_struck_through_in_history(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();
        $admin = User::factory()->admin()->create();

        $product = Product::factory()->create(['sale_price_cents' => 1500, 'manages_inventory' => true]);
        Inventory::create(['product_id' => $product->id, 'branch_id' => $branch->id, 'stock' => 5]);

        $sale = $this->venderUnProducto($cajera, $product, 1500);
        $this->assertSame(4, Inventory::where('product_id', $product->id)->where('branch_id', $branch->id)->value('stock'));

        $hoy = now(config('pos.timezone'))->toDateString();

        $this->actingAs($admin)
            ->get(route('reportes.diario', ['desde' => $hoy, 'hasta' => $hoy]))
            ->assertInertia(fn ($page) => $page->where('totales.ventas', 1)->where('totales.ingresoCents', 1500));

        $this->actingAs($admin)
            ->put(route('ventas.cancelar', $sale))
            ->assertSessionHas('success');

        $this->assertSame('cancelled', $sale->fresh()->status);
        $this->assertSame(5, Inventory::where('product_id', $product->id)->where('branch_id', $branch->id)->value('stock'));

        $this->actingAs($admin)
            ->get(route('reportes.diario', ['desde' => $hoy, 'hasta' => $hoy]))
            ->assertInertia(fn ($page) => $page->where('totales.ventas', 0)->where('totales.ingresoCents', 0));

        $this->actingAs($admin)
            ->get(route('ventas.index', ['desde' => $hoy, 'hasta' => $hoy]))
            ->assertInertia(fn ($page) => $page
                ->has('sales', 1)
                ->where('sales.0.status', 'cancelled'));
    }

    public function test_cancelling_an_already_cancelled_sale_fails(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();
        $admin = User::factory()->admin()->create();

        $product = Product::factory()->create(['manages_inventory' => false]);
        $sale = $this->venderUnProducto($cajera, $product, $product->sale_price_cents);

        $this->actingAs($admin)->put(route('ventas.cancelar', $sale));
        $this->actingAs($admin)
            ->put(route('ventas.cancelar', $sale))
            ->assertSessionHas('error', 'Esta venta ya está cancelada.');
    }

    public function test_a_cajera_cannot_cancel_a_sale(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $product = Product::factory()->create(['manages_inventory' => false]);
        $sale = $this->venderUnProducto($cajera, $product, $product->sale_price_cents);

        $this->actingAs($cajera)->put(route('ventas.cancelar', $sale))->assertForbidden();
    }

    public function test_a_cajera_only_sees_her_own_sales_in_the_history(): void
    {
        [$cajeraUno, $branch] = $this->cajeraConTurno();
        $cajeraDos = User::factory()->create(['branch_id' => $branch->id]);
        CashRegisterShift::factory()->for($cajeraDos)->for($branch)->create();

        $product = Product::factory()->create(['manages_inventory' => false]);
        $this->venderUnProducto($cajeraUno, $product, $product->sale_price_cents);
        $this->venderUnProducto($cajeraDos, $product, $product->sale_price_cents);

        $this->actingAs($cajeraUno)
            ->get(route('ventas.index'))
            ->assertInertia(fn ($page) => $page
                ->has('sales', 1)
                ->where('sales.0.user.id', $cajeraUno->id));
    }

    public function test_a_cajera_cannot_see_reports(): void
    {
        [$cajera] = $this->cajeraConTurno();

        $this->actingAs($cajera)->get(route('reportes.diario'))->assertForbidden();
    }

    public function test_reports_use_the_business_timezone_day_not_utc(): void
    {
        [$cajera] = $this->cajeraConTurno();

        // 8 PM en la zona del negocio (America/Mexico_City, UTC-6) cae en el día siguiente en
        // UTC (2 AM). Si el reporte agrupara por día UTC, la venta aparecería en la fecha
        // equivocada.
        $momentoLocal = Carbon::create(2026, 8, 25, 20, 0, 0, config('pos.timezone'));
        $this->travelTo($momentoLocal);

        $product = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);
        $this->venderUnProducto($cajera, $product, 1000);

        $this->assertSame('2026-08-26', now()->utc()->toDateString());

        $reportes = app(ReportService::class);

        $reporteDiaCorrecto = $reportes->porDia(Fechas::parse('2026-08-25'), Fechas::parse('2026-08-25'));
        $this->assertSame(1, $reporteDiaCorrecto['totales']['ventas']);

        $reporteDiaUtc = $reportes->porDia(Fechas::parse('2026-08-26'), Fechas::parse('2026-08-26'));
        $this->assertSame(0, $reporteDiaUtc['totales']['ventas']);

        $this->travelBack();
    }

    public function test_report_by_branch_and_by_cashier_group_correctly(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);

        $this->venderUnProducto($cajera, $product, 1000);

        $this->actingAs($admin)
            ->get(route('reportes.sucursales'))
            ->assertInertia(fn ($page) => $page
                ->where('tipo', 'sucursales')
                ->has('filas', 1)
                ->where('filas.0.etiqueta', $branch->name));

        $this->actingAs($admin)
            ->get(route('reportes.cajeras'))
            ->assertInertia(fn ($page) => $page
                ->where('tipo', 'cajeras')
                ->has('filas', 1)
                ->where('filas.0.etiqueta', $cajera->name));
    }

    public function test_dashboard_shows_todays_sales_open_shift_and_low_stock_for_the_current_users_branch(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();

        $productoBajo = Product::factory()->create(['manages_inventory' => true, 'is_active' => true]);
        Inventory::create(['product_id' => $productoBajo->id, 'branch_id' => $branch->id, 'stock' => 0]);

        $product = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);
        $this->venderUnProducto($cajera, $product, 1000);

        $this->actingAs($cajera)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('ventasHoy', 1)
                ->where('ingresoHoyCents', 1000)
                ->where('productosStockBajo', 1)
                ->where('turnoAbierto.id', CashRegisterShift::firstOrFail()->id));
    }
}
