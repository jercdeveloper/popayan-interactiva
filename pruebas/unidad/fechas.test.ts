import { describe, expect, it } from 'vitest';
import { diaDeLaSemana, diaDelMes, mesYAnio, nombreDelMes, rangoDeDias } from '../../src/lib/fechas';

describe('fechas de la agenda', () => {
  it('leen el día sin correrse por la zona horaria', () => {
    // A medianoche UTC ya es el día anterior en Popayán: la fecha no debe moverse
    expect(diaDelMes('2027-01-13')).toBe('13');
    expect(diaDeLaSemana('2027-01-13')).toBe('miércoles');
    expect(nombreDelMes('2026-12-01')).toBe('diciembre');
  });

  it('el mes y el año van con mayúscula inicial', () => {
    expect(mesYAnio('2026-10-01')).toBe('Octubre de 2026');
  });

  it('un rango dentro del mismo mes', () => {
    expect(rangoDeDias('2026-11-05', '2026-11-12')).toBe('5–12');
  });

  it('un solo día', () => {
    expect(rangoDeDias('2026-12-04')).toBe('4');
    expect(rangoDeDias('2026-12-04', '2026-12-04')).toBe('4');
  });

  it('un rango que cruza de mes nombra los dos meses', () => {
    expect(rangoDeDias('2026-12-28', '2027-01-06')).toBe('28 dic.–6 ene.');
  });
});
