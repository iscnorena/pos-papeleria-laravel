<?php

namespace App\Exceptions;

class InsufficientPaymentException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('El pago es insuficiente.');
    }
}
