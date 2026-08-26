<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'cost_price' => ['required', 'regex:/^\d+(\.\d{1,2})?$/'],
            'sale_price' => ['required', 'regex:/^\d+(\.\d{1,2})?$/'],
            'manages_inventory' => ['boolean'],
            'expiry_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cost_price.regex' => 'El costo debe ser un monto válido, por ejemplo 12.50.',
            'sale_price.regex' => 'El precio debe ser un monto válido, por ejemplo 12.50.',
        ];
    }
}
