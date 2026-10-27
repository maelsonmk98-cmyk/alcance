
const arredondarCentavos = (valor: number) =>
  Math.round((valor + Number.EPSILON) * 100) / 100;

// Promoção sobre o preço integral
const promocaoValor = arredondarCentavos(
  preco * (numero(promocao) / 100)
);

// Comissão após o desconto da promoção
const comissaoValor = arredondarCentavos(
  (preco - promocaoValor) *
    (numero(comissao) / 100)
);

// Custo total por unidade
const custoUnitarioTotal =
  custo +
  comissaoValor +
  impostosValor +
  acosValor +
  promocaoValor +
  numero(frete) +
  numero(embalagem) +
  numero(outrasDespesas) +
  numero(tarifaFixa);

// Custo e lucro da venda
const custoVendaPrevisto =
  custoUnitarioTotal * qtd;

const lucroPrevisto =
  faturamentoPrevisto - custoVendaPrevisto;
