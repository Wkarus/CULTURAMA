export function idadeEmAnos(dataNascimento: Date, hoje = new Date()): number {
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mes = hoje.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade -= 1;
  }
  return idade;
}

export function isMaiorDe18(dataNascimento: Date, hoje = new Date()): boolean {
  return idadeEmAnos(dataNascimento, hoje) >= 18;
}

export function parseDataNascimento(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
