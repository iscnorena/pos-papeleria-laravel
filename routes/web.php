<?php

use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\ProductCategoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ShiftController;
use App\Services\ShiftService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    // §7.5 / §8 Fase 3: sin turno abierto redirige a la apertura; con uno abierto, a su
    // detalle — que la Fase 4 reemplazará por el punto de venta real.
    Route::get('/caja', function (ShiftService $shifts) {
        $shift = $shifts->getOpenShift(request()->user());

        return $shift
            ? redirect()->route('turnos.show', $shift)
            : redirect()->route('turnos.abrir');
    })->name('caja');

    Route::get('/turnos', [ShiftController::class, 'index'])->name('turnos.index');
    Route::get('/turnos/abrir', [ShiftController::class, 'create'])->name('turnos.abrir');
    Route::post('/turnos/abrir', [ShiftController::class, 'store'])->name('turnos.abrir.store');
    Route::get('/turnos/{shift}', [ShiftController::class, 'show'])->name('turnos.show');
    Route::get('/turnos/{shift}/cerrar', [ShiftController::class, 'edit'])->name('turnos.cerrar');
    Route::put('/turnos/{shift}/cerrar', [ShiftController::class, 'update'])->name('turnos.cerrar.store');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/sucursales', [BranchController::class, 'index'])->name('sucursales.index');
    Route::post('/sucursales', [BranchController::class, 'store'])->name('sucursales.store');
    Route::put('/sucursales/{branch}', [BranchController::class, 'update'])->name('sucursales.update');

    Route::get('/usuarios', [UserController::class, 'index'])->name('usuarios.index');
    Route::post('/usuarios', [UserController::class, 'store'])->name('usuarios.store');
    Route::put('/usuarios/{user}', [UserController::class, 'update'])->name('usuarios.update');
    Route::put('/usuarios/{user}/contrasena', [UserController::class, 'resetPassword'])->name('usuarios.reset-password');
    Route::put('/usuarios/{user}/pin', [UserController::class, 'resetPin'])->name('usuarios.reset-pin');

    Route::get('/categorias', [ProductCategoryController::class, 'index'])->name('categorias.index');
    Route::post('/categorias', [ProductCategoryController::class, 'store'])->name('categorias.store');
    Route::put('/categorias/{category}', [ProductCategoryController::class, 'update'])->name('categorias.update');

    Route::get('/productos', [ProductController::class, 'index'])->name('productos.index');
    Route::post('/productos', [ProductController::class, 'store'])->name('productos.store');
    Route::put('/productos/{product}', [ProductController::class, 'update'])->name('productos.update');

    Route::get('/inventario', [InventoryController::class, 'index'])->name('inventario.index');
    Route::put('/inventario/{inventory}', [InventoryController::class, 'update'])->name('inventario.update');
});

require __DIR__.'/auth.php';
