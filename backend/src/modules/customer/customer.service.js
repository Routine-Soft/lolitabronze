// modules/customer/customer.service.js
import CustomerModel from './customer.model.js';

export async function createCustomer(dto) {
  return CustomerModel.create(dto);
}

export async function listCustomers(search) {
  if (!search) return CustomerModel.find().sort({ name: 1 });
  return CustomerModel.find({
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ],
  });
}

export async function getCustomerById(id) {
  return CustomerModel.findById(id);
}

export async function updateCustomer(id, dto) {
  return CustomerModel.findByIdAndUpdate(id, dto, { new: true });
}

export async function deleteCustomer(id) {
  return CustomerModel.findByIdAndDelete(id);
}