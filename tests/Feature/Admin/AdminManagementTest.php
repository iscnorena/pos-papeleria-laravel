<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_admin_can_create_and_update_a_branch_with_visible_validation(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post('/sucursales', ['name' => '', 'is_active' => true])
            ->assertSessionHasErrors('name');

        $this->actingAs($admin)->post('/sucursales', [
            'name' => 'Sucursal Centro',
            'is_active' => true,
        ]);

        $branch = Branch::where('name', 'Sucursal Centro')->firstOrFail();

        $this->actingAs($admin)->put("/sucursales/{$branch->id}", [
            'name' => 'Sucursal Centro Renombrada',
            'is_active' => false,
        ])->assertSessionHasNoErrors();

        $this->assertSame('Sucursal Centro Renombrada', $branch->fresh()->name);
        $this->assertFalse($branch->fresh()->is_active);
    }

    public function test_admin_can_create_and_update_a_category(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post('/categorias', ['name' => ''])
            ->assertSessionHasErrors('name');

        $this->actingAs($admin)->post('/categorias', ['name' => 'Papelería fina']);

        $category = ProductCategory::where('name', 'Papelería fina')->firstOrFail();

        $this->actingAs($admin)->put("/categorias/{$category->id}", [
            'name' => 'Papelería fina y regalo',
            'is_active' => true,
        ]);

        $this->assertSame('Papelería fina y regalo', $category->fresh()->name);
    }

    public function test_admin_can_create_and_update_a_user(): void
    {
        $admin = $this->admin();
        $branch = Branch::factory()->create();

        $this->actingAs($admin)
            ->post('/usuarios', ['name' => 'Nueva Cajera'])
            ->assertSessionHasErrors(['username', 'password', 'role', 'branch_id']);

        $this->actingAs($admin)->post('/usuarios', [
            'name' => 'Nueva Cajera',
            'username' => 'nueva',
            'password' => 'password123',
            'role' => 'cajera',
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $user = User::where('username', 'nueva')->firstOrFail();
        $this->assertTrue(Hash::check('password123', $user->password));

        $this->actingAs($admin)->put("/usuarios/{$user->id}", [
            'name' => 'Nueva Cajera Editada',
            'username' => 'nueva',
            'role' => 'admin',
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $this->assertSame('Nueva Cajera Editada', $user->fresh()->name);
        $this->assertSame(Role::Admin, $user->fresh()->role);
    }

    public function test_admin_can_reset_a_users_password_and_pin(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();

        $this->actingAs($admin)->put("/usuarios/{$user->id}/contrasena", [
            'password' => 'una-clave-nueva',
        ]);
        $this->assertTrue(Hash::check('una-clave-nueva', $user->fresh()->password));

        $this->actingAs($admin)->put("/usuarios/{$user->id}/pin", ['pin' => '4321']);
        $this->assertTrue(Hash::check('4321', $user->fresh()->pin_hash));
    }

    public function test_admin_can_create_a_product_and_it_provisions_inventory_in_every_branch(): void
    {
        $admin = $this->admin();
        Branch::factory()->count(2)->create();

        $response = $this->actingAs($admin)->post('/productos', [
            'name' => 'Cuaderno de prueba',
            'cost_price' => 'no-es-un-monto',
            'sale_price' => '45.00',
            'manages_inventory' => true,
            'is_active' => true,
        ]);
        $response->assertSessionHasErrors('cost_price');

        $this->actingAs($admin)->post('/productos', [
            'name' => 'Cuaderno de prueba',
            'cost_price' => '28.00',
            'sale_price' => '45.00',
            'manages_inventory' => true,
            'is_active' => true,
        ]);

        $product = Product::where('name', 'Cuaderno de prueba')->firstOrFail();

        $this->assertSame(2800, $product->cost_price_cents);
        $this->assertSame(4500, $product->sale_price_cents);
        $this->assertSame(3, Inventory::where('product_id', $product->id)->count());
    }

    public function test_deactivating_a_product_keeps_it_but_flags_it_inactive(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create(['is_active' => true]);

        $this->actingAs($admin)->put("/productos/{$product->id}", [
            'name' => $product->name,
            'cost_price' => '10.00',
            'sale_price' => '20.00',
            'manages_inventory' => $product->manages_inventory,
            'is_active' => false,
        ]);

        $product->refresh();
        $this->assertFalse($product->is_active);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_adjusting_stock_in_one_branch_does_not_affect_another(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create();
        $branch1 = Branch::factory()->create();
        $branch2 = Branch::factory()->create();

        app(InventoryService::class)->provisionForAllBranches($product);
        // provisionForAllBranches usa TODAS las sucursales de la tabla, incluidas las
        // creadas arriba porque ya existen al momento de llamarlo.

        $inventoryBranch1 = Inventory::where('product_id', $product->id)
            ->where('branch_id', $branch1->id)->firstOrFail();
        $inventoryBranch2 = Inventory::where('product_id', $product->id)
            ->where('branch_id', $branch2->id)->firstOrFail();

        $this->actingAs($admin)->put("/inventario/{$inventoryBranch1->id}", ['stock' => '50']);

        $this->assertSame(50, $inventoryBranch1->fresh()->stock);
        $this->assertSame(0, $inventoryBranch2->fresh()->stock);
    }

    public function test_cajera_gets_403_on_every_admin_route_even_by_typing_the_url(): void
    {
        $cajera = User::factory()->create(['role' => Role::Cajera]);

        foreach (['/sucursales', '/usuarios', '/categorias', '/productos', '/inventario'] as $ruta) {
            $this->actingAs($cajera)->get($ruta)->assertForbidden();
        }
    }
}
