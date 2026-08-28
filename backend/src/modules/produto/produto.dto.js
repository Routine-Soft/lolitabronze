// modules/produto/produto.dto.js

export function toCreateProdutoDto(body) {
  return {
    name: body.name,
    description: body.description,
    priceNormal: body.priceNormal,
    pricePromotional: body.pricePromotional,
    diasPromocionais: body.diasPromocionais ?? [],
    quantity: body.quantity ?? null,
  };
}

// modules/produto/produto.dto.js
export function toProdutoResponseDto(produto) {
  const hoje = new Date().getDay(); // 0-6
  const emPromocao = produto.diasPromocionais.includes(hoje);

  return {
    id: produto._id,
    name: produto.name,
    description: produto.description,
    priceNormal: produto.priceNormal,
    pricePromotional: produto.pricePromotional,
    diasPromocionais: produto.diasPromocionais,
    quantity: produto.quantity,
    price: emPromocao ? produto.pricePromotional : produto.priceNormal, // <- é SÓ ISSO que o frontend usa pra exibir
  };
}