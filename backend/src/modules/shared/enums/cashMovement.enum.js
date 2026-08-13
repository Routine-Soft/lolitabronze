// shared/enums/cashMovement.enum.js
export const MOVEMENT_TYPE = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
};

export const MOVEMENT_CATEGORY = {
  VENDA: 'VENDA',
  SINAL: 'SINAL',
  COMPLEMENTO: 'COMPLEMENTO', // restante do serviço pago no dia da finalização
  DESPESA: 'DESPESA',
  SANGRIA: 'SANGRIA',   // retirada de dinheiro do caixa
  REFORCO: 'REFORCO',   // entrada de dinheiro extra no caixa
  OUTRO: 'OUTRO',
};