// modules/servico/servico.dto.js

export function toCreateServicoDto(body) {
  return {
    name: body.name,
    description: body.description,
    priceNormal: body.priceNormal,
    pricePromotional: body.pricePromotional,
    diasPromocionais: body.diasPromocionais ?? [],
  };
}

// modules/servico/servico.dto.js
export function toServicoResponseDto(servico) {
  const hoje = new Date().getDay(); // 0-6
  const emPromocao = servico.diasPromocionais.includes(hoje);

  return {
    id: servico._id,
    name: servico.name,
    description: servico.description,
    priceNormal: servico.priceNormal,
    pricePromotional: servico.pricePromotional,
    diasPromocionais: servico.diasPromocionais,
    price: emPromocao ? servico.pricePromotional : servico.priceNormal, // <- é SÓ ISSO que o frontend usa pra exibir
  };
}