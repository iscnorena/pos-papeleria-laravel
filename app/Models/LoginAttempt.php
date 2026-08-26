<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['ip', 'kind', 'attempted_at'])]
class LoginAttempt extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
        ];
    }
}
