// modules/customer/customer.service.js
import CustomerModel from './customer.model.js';

export async function createCustomer(dto) {
  return CustomerModel.create(dto);
}

export async function listCustomers({ search = '', page = 1, limit = 10 } = {}) {
  const filter = search
    ? { $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ] }
    : {};

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CustomerModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    CustomerModel.countDocuments(filter),
  ]);

  return { items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
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