/**
 * @module Utils/PdfGenerator
 * @description Utilidades para generar PDFs con pdfmake.
 * Incluye estilos predefinidos y helpers para documentos del sistema.
 * Colores alineados con el tema Karciz del proyecto.
 */

// Paleta de colores del tema (de tailwind.config.js)
const THEME_COLORS = {
  primary: '#13B497',      // Teal principal
  primaryDark: '#0e8670',
  secondary: '#D07407',
  success: '#2bc155',
  warning: '#FFAB2D',
  danger: '#B03636',
  info: '#3C65F5',
  text: '#3d4465',         // light-text
  muted: '#6c757d',        // light-muted
  border: '#e2e8f0',
};

/**
 * Estilos base para documentos PDF.
 */
const defaultStyles = {
  header: {
    fontSize: 18,
    bold: true,
    margin: [0, 0, 0, 10],
    color: THEME_COLORS.text
  },
  subheader: {
    fontSize: 14,
    bold: true,
    margin: [0, 10, 0, 5],
    color: THEME_COLORS.text
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: 'white',
    fillColor: THEME_COLORS.primary
  },
  tableCell: {
    fontSize: 10,
    color: THEME_COLORS.text
  },
  footer: {
    fontSize: 8,
    color: THEME_COLORS.muted,
    alignment: 'center'
  },
  label: {
    fontSize: 10,
    bold: true,
    color: THEME_COLORS.muted
  },
  value: {
    fontSize: 10,
    color: THEME_COLORS.text
  }
};

/**
 * Configuración por defecto del documento.
 */
const defaultDocDefinition = {
  pageSize: 'LETTER',
  pageMargins: [40, 60, 40, 60],
  defaultStyle: {
    font: 'Roboto',
    fontSize: 10
  },
  styles: defaultStyles
};

/**
 * Genera y descarga un PDF.
 * @param {Object} docDefinition - Definición del documento pdfmake
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const generatePdf = async (docDefinition, filename = 'documento') => {
  try {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

    const fullDefinition = {
      ...defaultDocDefinition,
      ...docDefinition,
      styles: {
        ...defaultStyles,
        ...(docDefinition.styles || {})
      }
    };

    pdfMake.createPdf(fullDefinition).download(`${filename}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

/**
 * Abre el PDF en una nueva pestaña.
 * @param {Object} docDefinition - Definición del documento pdfmake
 */
export const openPdf = async (docDefinition) => {
  try {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

    const fullDefinition = {
      ...defaultDocDefinition,
      ...docDefinition,
      styles: {
        ...defaultStyles,
        ...(docDefinition.styles || {})
      }
    };

    pdfMake.createPdf(fullDefinition).open();
  } catch (error) {
    console.error('Error al abrir PDF:', error);
    throw error;
  }
};

/**
 * Genera un PDF de reporte de equipo.
 * @param {Object} equipo - Datos del equipo
 * @param {Object} options - Opciones adicionales
 */
export const generateEquipoReport = async (equipo, options = {}) => {
  const docDefinition = {
    content: [
      { text: 'Reporte de Equipo', style: 'header' },
      { text: `Generado: ${new Date().toLocaleDateString('es-MX')}`, style: 'footer', margin: [0, 0, 0, 20] },

      { text: 'Información General', style: 'subheader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Marca', style: 'label' }, { text: equipo.marca || '-', style: 'value' }],
            [{ text: 'Modelo', style: 'label' }, { text: equipo.modelo || '-', style: 'value' }],
            [{ text: 'Número de Serie', style: 'label' }, { text: equipo.numero_serie || '-', style: 'value' }],
            [{ text: 'Tipo', style: 'label' }, { text: equipo.tipo_equipo || '-', style: 'value' }],
            [{ text: 'Estado', style: 'label' }, { text: equipo.nombre_status || '-', style: 'value' }]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Firma si existe
      ...(options.signature ? [
        { text: 'Firma de Responsable', style: 'subheader', margin: [0, 20, 0, 10] },
        {
          image: options.signature,
          width: 150,
          height: 60,
          margin: [0, 0, 0, 10]
        },
        { text: options.signatureName || 'Responsable', style: 'label' }
      ] : [])
    ],
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount} | Sistema de Inventario TI`,
      style: 'footer',
      margin: [40, 0]
    })
  };

  await generatePdf(docDefinition, `equipo_${equipo.numero_serie || equipo.id}`);
};

/**
 * Genera un PDF de reporte de mantenimiento.
 * @param {Object} mantenimiento - Datos del mantenimiento
 * @param {Array} evidencias - Lista de evidencias
 * @param {Object} options - Opciones adicionales
 */
export const generateMantenimientoReport = async (mantenimiento, evidencias = [], options = {}) => {
  const docDefinition = {
    content: [
      { text: 'Reporte de Mantenimiento', style: 'header' },
      {
        text: `ID: ${mantenimiento.id} | ${new Date().toLocaleDateString('es-MX')}`,
        style: 'footer',
        margin: [0, 0, 0, 20]
      },

      { text: 'Información del Servicio', style: 'subheader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Título', style: 'label' }, { text: mantenimiento.titulo || '-', style: 'value' }],
            [{ text: 'Tipo', style: 'label' }, { text: mantenimiento.tipo || '-', style: 'value' }],
            [{ text: 'Estado', style: 'label' }, { text: mantenimiento.estatus || '-', style: 'value' }],
            [{ text: 'Fecha Programada', style: 'label' }, { text: mantenimiento.fecha_programada || '-', style: 'value' }],
            [{ text: 'Fecha Realizada', style: 'label' }, { text: mantenimiento.fecha_realizada || '-', style: 'value' }],
            [{ text: 'Costo', style: 'label' }, { text: mantenimiento.costo ? `$${mantenimiento.costo}` : '-', style: 'value' }]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: 'Descripción', style: 'subheader' },
      { text: mantenimiento.descripcion || 'Sin descripción', margin: [0, 0, 0, 10] },

      // Equipo asociado
      { text: 'Equipo', style: 'subheader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Marca/Modelo', style: 'label' }, { text: `${mantenimiento.marca || ''} ${mantenimiento.modelo || ''}`.trim() || '-', style: 'value' }],
            [{ text: 'Número de Serie', style: 'label' }, { text: mantenimiento.numero_serie || '-', style: 'value' }]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Evidencias
      ...(evidencias.length > 0 ? [
        { text: `Evidencias (${evidencias.length})`, style: 'subheader' },
        {
          ul: evidencias.map(e => `${e.tipo}: ${e.nombre_original || 'Archivo'}`)
        }
      ] : []),

      // Firma del técnico
      ...(options.signature ? [
        { text: 'Firma del Técnico', style: 'subheader', margin: [0, 20, 0, 10] },
        {
          image: options.signature,
          width: 150,
          height: 60,
          margin: [0, 0, 0, 10]
        },
        { text: options.signatureName || mantenimiento.tecnico_asignado || 'Técnico', style: 'label' }
      ] : [])
    ],
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount} | Reporte de Mantenimiento | Sistema de Inventario TI`,
      style: 'footer',
      margin: [40, 0]
    })
  };

  await generatePdf(docDefinition, `mantenimiento_${mantenimiento.id}`);
};

/**
 * Genera un PDF de reporte de ticket.
 * @param {Object} ticket - Datos del ticket
 * @param {Array} comentarios - Lista de comentarios
 * @param {Object} options - Opciones adicionales
 */
export const generateTicketReport = async (ticket, comentarios = [], options = {}) => {
  // Colores de prioridad alineados con el tema
  const prioridadColors = {
    'CRITICA': THEME_COLORS.danger,   // #B03636
    'ALTA': THEME_COLORS.secondary,   // #D07407
    'MEDIA': THEME_COLORS.warning,    // #FFAB2D
    'BAJA': THEME_COLORS.success      // #2bc155
  };

  const docDefinition = {
    content: [
      { text: 'Reporte de Ticket de Soporte', style: 'header' },
      {
        text: `#${ticket.id} | ${new Date().toLocaleDateString('es-MX')}`,
        style: 'footer',
        margin: [0, 0, 0, 20]
      },

      { text: 'Información del Ticket', style: 'subheader' },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Estado', style: 'label' },
              { text: ticket.estatus || '-', style: 'value' },
              { text: 'Prioridad', style: 'label' },
              { text: ticket.prioridad || '-', style: 'value', color: prioridadColors[ticket.prioridad] }
            ],
            [
              { text: 'Tipo Falla', style: 'label' },
              { text: ticket.tipo_falla || '-', style: 'value' },
              { text: 'Fecha', style: 'label' },
              { text: ticket.fecha_creacion || '-', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: 'Descripción del Problema', style: 'subheader' },
      { text: ticket.descripcion || 'Sin descripción', margin: [0, 0, 0, 10] },

      // Historial de comentarios
      ...(comentarios.length > 0 ? [
        { text: `Historial (${comentarios.length} comentarios)`, style: 'subheader' },
        ...comentarios.filter(c => !c.es_interno).map(c => ({
          stack: [
            { text: `${c.username || 'Usuario'} - ${c.fecha_creacion}`, style: 'label' },
            { text: c.contenido, margin: [0, 2, 0, 10] }
          ]
        }))
      ] : [])
    ],
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount} | Ticket #${ticket.id} | Sistema de Inventario TI`,
      style: 'footer',
      margin: [40, 0]
    })
  };

  await generatePdf(docDefinition, `ticket_${ticket.id}`);
};

export default {
  generatePdf,
  openPdf,
  generateEquipoReport,
  generateMantenimientoReport,
  generateTicketReport
};
