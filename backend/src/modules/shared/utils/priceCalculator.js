// shared/utils/priceCalculator.js
export function calculateItemPrice(item, date = new Date()) {
  const diaSemana = date.getDay(); // 0-6
  const temDesconto = item.discount?.diasSemana?.includes(diaSemana);

  if (!temDesconto || !item.discount.percentual) {
    return item.price;
  }

  const desconto = item.price * (item.discount.percentual / 100);
  return Number((item.price - desconto).toFixed(2));
}