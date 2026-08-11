// modules/customer/customer.dto.js
export function toCreateCustomerDto(body) {
  return { name: body.name, phone: body.phone };
}

export function toCustomerResponseDto(customer) {
  return {
    id: customer._id,
    name: customer.name,
    phone: customer.phone,
  };
}