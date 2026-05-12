export const toQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) ? quantity : 0;
};

export const isPositiveQuantity = (value) => toQuantity(value) > 0;

export const normalizeText = (value) =>
  value
    ?.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase() || '';

export const normalizeDescription = (value) => normalizeText(value);

export const calculateMovementBalance = (item = {}) => {
  const entradas = Array.isArray(item.entradas) ? item.entradas : [];
  const saidas = Array.isArray(item.saidas) ? item.saidas : [];

  const totalEntradas = entradas.reduce((acc, entrada) => acc + toQuantity(entrada.quantidade), 0);
  const totalSaidas = saidas.reduce((acc, saida) => acc + toQuantity(saida.quantidade), 0);

  return totalEntradas - totalSaidas;
};

export const getStockBase = (item = {}) => {
  if (item.estoque_inicial !== undefined && item.estoque_inicial !== null) {
    return toQuantity(item.estoque_inicial);
  }

  if (item.total_estoque !== undefined && item.total_estoque !== null) {
    return toQuantity(item.total_estoque) - calculateMovementBalance(item);
  }

  return 0;
};

export const calculateStockTotal = (item = {}) =>
  getStockBase(item) + calculateMovementBalance(item);

export const calculateUpdatedStockTotal = (currentItem = {}, nextMovements = {}) =>
  getStockBase(currentItem) + calculateMovementBalance({
    entradas: nextMovements.entradas ?? currentItem.entradas,
    saidas: nextMovements.saidas ?? currentItem.saidas,
  });

export const withCalculatedStock = (item = {}) => ({
  ...item,
  total_estoque: calculateStockTotal(item),
});

export const buildMovementId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
