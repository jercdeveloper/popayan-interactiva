/**
 * Fechas de la agenda. Se guardan como "AAAA-MM-DD" y se leen siempre en UTC para que el día no cambie
 * según la zona horaria de quien compila o de quien mira la página.
 */
const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const formato = (opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...opciones });

const dia = formato({ day: 'numeric' });
const semana = formato({ weekday: 'long' });
const mesAnio = formato({ month: 'long', year: 'numeric' });
const mes = formato({ month: 'long' });

export const diaDelMes = (iso: string) => dia.format(fecha(iso));
export const diaDeLaSemana = (iso: string) => semana.format(fecha(iso));
export const nombreDelMes = (iso: string) => mes.format(fecha(iso));

/** "Enero de 2027" */
export function mesYAnio(iso: string) {
  const texto = mesAnio.format(fecha(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** El número grande de cada evento: "13", o "5–12" si dura varios días dentro del mismo mes */
export function rangoDeDias(inicio: string, fin?: string) {
  if (!fin || fin === inicio) return diaDelMes(inicio);
  if (inicio.slice(0, 7) !== fin.slice(0, 7)) return `${diaDelMes(inicio)} ${nombreDelMes(inicio).slice(0, 3)}.–${diaDelMes(fin)} ${nombreDelMes(fin).slice(0, 3)}.`;
  return `${diaDelMes(inicio)}–${diaDelMes(fin)}`;
}
