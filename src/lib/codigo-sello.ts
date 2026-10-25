/**
 * El código de los QR del Pasaporte. Solo se usa al compilar: cada página /sello/<lugar> trae su código
 * y lo compara con el del enlace. No es seguridad (sin servidor no puede serlo): evita que un QR de un
 * lugar selle otro y que se selle escribiendo la dirección a mano.
 */
import { createHash } from 'node:crypto';

export const codigoDeSello = (id: string) =>
  createHash('sha256').update(`popayan-interactiva/sello/${id}`).digest('hex').slice(0, 8);
