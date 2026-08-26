<?php

namespace App\Exceptions;

class SaleAlreadyCancelledException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('Esta venta ya está cancelada.');
    }
}
