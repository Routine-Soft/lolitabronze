// modules/item/item.service.js
import { ItemModel } from './item.model.js';

export async function createItem(dto) {
  return ItemModel.create(dto);
}

export async function listItems(type) {
  const filter = type ? { type } : {};
  return ItemModel.find(filter).sort({ name: 1 });
}

export async function getItemById(id) {
  return ItemModel.findById(id);
}

export async function updateItem(id, dto) {
  return ItemModel.findByIdAndUpdate(id, dto, { new: true });
}

export async function deleteItem(id) {
  return ItemModel.findByIdAndDelete(id);
}