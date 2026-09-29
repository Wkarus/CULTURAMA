function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function calcDigit(base: string, factor: number): number {
  let total = 0;
  for (const char of base) {
    total += Number(char) * factor;
    factor -= 1;
  }
  const rest = (total * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function normalizeCpf(value: string): string {
  return onlyDigits(value);
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;

  const d2 = calcDigit(cpf.slice(0, 10), 11);
  return d2 === Number(cpf[10]);
}

export function formatCpf(value: string): string {
  const cpf = normalizeCpf(value);
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
