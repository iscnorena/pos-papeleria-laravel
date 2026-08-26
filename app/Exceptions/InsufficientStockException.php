<?php

namespace App\Exceptions;

class InsufficientStockException extends BusinessException
{
    public function __construct(string $productName)
    {
        parent::__construct("Sin existencia suficiente de {$productName}.");
    }
}
