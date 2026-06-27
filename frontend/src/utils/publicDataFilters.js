/**
 * Filtros de datos públicos — aseguran que el portal público nunca muestre
 * datos internos, ficticios, técnicos o placeholder.
 * 
 * Usa displayFormatters.js para normalización de nombres.
 */

import { toPublicTitle } from './displayFormatters';

const SUCURSAL_BLACKLIST = [
  'FICTICIA', 'HISTORICA', 'CAPACITACION', 'PRODUCTOS_ONLINE',
  'CERRADA', 'TEST', 'DEMO_INTERNA', 'INTERNA', 'PRUEBA',
];

const SERVICIO_BLACKLIST = ['FICTICIO', 'TEST', 'BORRADOR', 'INTERNO', 'PRUEBA'];
const SERVICIO_PLACEHOLDER_NAMES = ['servicio', 'sin nombre', 'placeholder', 'n/a', '-'];

const CATEGORIA_INTERNA_BLACKLIST = [
  'CLIENTES', 'GESTION', 'OPERACION', 'FINANZAS', 'SISTEMA',
  'CATALOGO', 'ADMIN', 'CONFIGURACION', 'RRHH', 'LEGACY',
  'PRODUCTOS_WEB', 'PRODUCTOS', 'INVENTARIO',
];

export function isPublicBranch(branch) {
  if (!branch || !branch.NOMBRE_SUCURSAL) return false;
  if (branch.ACTIVO === false) return false;
  if (branch.PUBLICAR_WEB === false) return false;
  const estado = String(branch.ESTADO_SUCURSAL || '').toUpperCase().trim();
  if (['INACTIVA', 'CERRADA', 'BORRADOR'].includes(estado)) return false;
  const visibilidad = String(branch.VISIBILIDAD_WEB || '').toUpperCase().trim();
  if (['OCULTA', 'INTERNA', 'SOLO_INTERNA', 'BORRADOR'].includes(visibilidad)) return false;
  const nombre = String(branch.NOMBRE_SUCURSAL || '').toUpperCase();
  const nombreCorto = String(branch.NOMBRE_CORTO_SUCURSAL || '').toUpperCase();
  for (const word of SUCURSAL_BLACKLIST) {
    if (nombre.includes(word) || nombreCorto.includes(word)) return false;
  }
  return true;
}

export function isPublicService(service) {
  if (!service) return false;
  const nombre = String(service.NOMBRE_PUBLICO_SERVICIO || service.NOMBRE_SERVICIO || '').trim();
  if (!nombre) return false;
  if (SERVICIO_PLACEHOLDER_NAMES.includes(nombre.toLowerCase())) return false;
  const nombreUpper = nombre.toUpperCase();
  for (const word of SERVICIO_BLACKLIST) {
    if (nombreUpper.includes(word)) return false;
  }
  if (nombreUpper === 'SERVICIO') return false;
  return true;
}

export function normalizeServiceCategory(service) {
  if (!service) return null;
  const categoriaRaw = String(
    service.CATEGORIA_WEB || service.NOMBRE_CATEGORIA || service.CATEGORIA || ''
  ).toUpperCase().trim();
  if (CATEGORIA_INTERNA_BLACKLIST.includes(categoriaRaw)) return null;
  const CATEGORIAS_PUBLICAS = [
    'CABELLO', 'MANOS Y PIES', 'FACIAL', 'MAQUILLAJE', 'SPA / BIENESTAR',
    'DEPILACION', 'MASAJES', 'TRATAMIENTOS', 'COLORACION', 'PEINADO',
  ];
  for (const cat of CATEGORIAS_PUBLICAS) {
    if (categoriaRaw === cat || categoriaRaw.includes(cat)) return formatLabel(cat);
  }
  const nombre = String(service.NOMBRE_PUBLICO_SERVICIO || service.NOMBRE_SERVICIO || '').toUpperCase();
  if (nombre.includes('CABELLO') || nombre.includes('CORTE') || nombre.includes('PEINADO') || nombre.includes('ALISADO')) return 'Cabello';
  if (nombre.includes('COLOR') || nombre.includes('TINTE') || nombre.includes('BALAYAGE')) return 'Coloración';
  if (nombre.includes('MANICUR') || nombre.includes('PEDICUR') || nombre.includes('UÑAS')) return 'Manos y Pies';
  if (nombre.includes('FACIAL') || nombre.includes('LIMPIEZA')) return 'Facial';
  if (nombre.includes('MAQUILLAJE') || nombre.includes('MAKEUP')) return 'Maquillaje';
  if (nombre.includes('SPA') || nombre.includes('MASAJE') || nombre.includes('TRATAMIENTO') || nombre.includes('BIENESTAR')) return 'Spa / Bienestar';
  if (nombre.includes('DEPILA')) return 'Depilación';
  return null;
}

function formatLabel(key) {
  const labels = {'CABELLO':'Cabello','MANOS Y PIES':'Manos y Pies','FACIAL':'Facial','MAQUILLAJE':'Maquillaje','SPA / BIENESTAR':'Spa / Bienestar','DEPILACION':'Depilación','MASAJES':'Masajes','TRATAMIENTOS':'Tratamientos','COLORACION':'Coloración','PEINADO':'Peinado'};
  return labels[key] || key;
}

/**
 * Formatea un nombre para display público.
 * Delega en toPublicTitle de displayFormatters para manejo completo.
 * 
 * Ejemplos:
 *   "COLORACION GLOBAL" → "Coloración global"
 *   "CORTE_DE_CABELLO_DAMA" → "Corte de cabello dama"
 *   "MANICURIA CLASICA" → "Manicuría clásica"
 */
export function formatPublicName(value) {
  if (!value) return '';
  return toPublicTitle(value);
}

export function toPublicSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function normalizeAttachment(value) {
  const attachment = Array.isArray(value) ? value[0] : value;
  if (!attachment || typeof attachment !== 'object') return null;
  const thumb = attachment.thumbnails?.large || attachment.thumbnails?.full || attachment.thumbnails?.small;
  const url = thumb?.url || attachment.url;
  if (!url) return null;
  return {
    url,
    width: thumb?.width || attachment.width,
    height: thumb?.height || attachment.height,
    filename: attachment.filename || '',
    type: attachment.type || '',
  };
}

export function getPublicServiceImage(service) {
  if (!service) return null;
  const candidates = [
    service.IMAGEN_PRINCIPAL_SERVICIO,
    service.IMAGEN_PRINCIPAL,
    service.FOTO_SERVICIO,
    service.IMAGENES_SERVICIO,
    service.imagen_principal,
    service.imagen,
  ];
  for (const candidate of candidates) {
    const image = normalizeAttachment(candidate);
    if (image) return image;
  }
  return null;
}

export function hideTechnicalName(value) {
  return formatPublicName(value);
}

export function getPublicCategories(categorias) {
  if (!Array.isArray(categorias)) return [];
  return categorias.filter(cat => {
    const nombre = String(cat.NOMBRE_CATEGORIA || cat.nombre || '').toUpperCase().trim();
    return !CATEGORIA_INTERNA_BLACKLIST.includes(nombre) && nombre.length > 0;
  });
}
