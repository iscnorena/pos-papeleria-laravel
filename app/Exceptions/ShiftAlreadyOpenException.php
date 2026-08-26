<?php

namespace App\Exceptions;

class ShiftAlreadyOpenException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('Ya tienes un turno abierto.');
    }
}
