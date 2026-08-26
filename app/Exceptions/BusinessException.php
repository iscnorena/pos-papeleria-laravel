<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * §2 del prompt maestro: los errores de negocio (turno ya abierto, sin existencia, pago
 * insuficiente...) se lanzan como excepciones propias con un mensaje en español apto para
 * mostrarse, y el manejador de excepciones las convierte en back()->with('error', ...) —
 * nunca se les deja llegar crudas al cliente.
 */
class BusinessException extends RuntimeException {}
