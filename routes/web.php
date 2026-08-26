<?php

use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\ProductCategoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

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
