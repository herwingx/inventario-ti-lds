const Printer = require('pdfmake/js/Printer').default;
const fs = require('fs');
const path = require('path');

// Definición de fuentes estándar
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

/**
 * Genera el documento de la Hoja de Resguardo oficial.
 * @param {Object} data - Datos de asignación, empleado, equipo y firma.
 */
const generateResponsiva = async (data) => {
  const noopUrlResolver = {
    resolve: () => {},
    resolved: async () => {}
  };

  const printer = new Printer(fonts, null, noopUrlResolver);
  const { asignacion, empleado, equipo, empresa, sucursal, area, signatureDataUrl } = data;

  // Intentar leer el logo SVG
  let logoSvg = null;
  try {
    const logoPath = path.join(__dirname, '../../../client/src/assets/logo-dark.svg');
    if (fs.existsSync(logoPath)) {
      logoSvg = fs.readFileSync(logoPath, 'utf8');
    }
  } catch (e) {
    console.error("No se pudo cargar el logo SVG:", e.message);
  }

  const fechaActual = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const horaActual = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const nombreReceptor = empleado
    ? `${empleado.nombres} ${empleado.apellidos}`.toUpperCase()
    : (sucursal?.nombre || area?.nombre || 'SIN ASIGNAR').toUpperCase();

  const areaNombre = empleado?.areas?.nombre || area?.nombre || sucursal?.nombre || 'N/A';
  const tipoEquipoStr = equipo.tipos_equipo?.nombre_tipo || 'Computadora';

  const docDefinition = {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: 'Helvetica', fontSize: 10 },
    content: [
      // HEADER: LOGO Y DATOS EMPRESA
      {
        columns: [
          logoSvg ? { svg: logoSvg, width: 120 } : { text: 'LOGO', width: 120 },
          {
            stack: [
              { text: 'Línea Digital Del Sureste', style: 'companyName', alignment: 'right' },
              { 
                text: '1a Norte Poniente #834, Tuxtla Gutiérrez, 29000 | (961) 6189200 | ' + fechaActual + ' ' + horaActual, 
                style: 'companyInfo', 
                alignment: 'right' 
              }
            ]
          }
        ]
      },
      { text: '\n' },
      { text: 'Hoja de Resguardo.', style: 'mainTitle' },
      { text: '\n' },

      // TEXTO INTRODUCTORIO
      {
        text: [
          'Por medio de la presente el(a) ',
          { text: `C. ${nombreReceptor}`, bold: true },
          ', quien labora para esta empresa en el área de ',
          { text: areaNombre.toUpperCase(), bold: true },
          ' recibe bajo resguardo una ',
          { text: tipoEquipoStr, bold: true },
          ' con las siguientes características:'
        ],
        alignment: 'justify',
        lineHeight: 1.3
      },
      { text: '\n' },

      // TABLA DE ESPECIFICACIONES (ESTILO DASHED)
      {
        style: 'specsTable',
        table: {
          widths: [100, '*'],
          body: [
            [{ text: 'Marca:', bold: true, border: [false, false, false, false] }, { text: equipo.marca || 'N/A', style: 'dashedCell' }],
            [{ text: 'Modelo:', bold: true, border: [false, false, false, false] }, { text: equipo.modelo || 'N/A', style: 'dashedCell' }],
            [{ text: 'Serie:', bold: true, border: [false, false, false, false] }, { text: equipo.numero_serie, style: 'dashedCell', bold: true }],
            [{ text: 'Procesador:', bold: true, border: [false, false, false, false] }, { text: equipo.procesador || 'N/A', style: 'dashedCell' }],
            [{ text: 'RAM:', bold: true, border: [false, false, false, false] }, { text: equipo.ram || 'N/A', style: 'dashedCell' }],
            [{ text: 'Disco:', bold: true, border: [false, false, false, false] }, { text: equipo.disco_duro || 'N/A', style: 'dashedCell' }],
            [{ text: 'OS:', bold: true, border: [false, false, false, false] }, { text: equipo.sistema_operativo || 'N/A', style: 'dashedCell' }],
            [{ text: 'Ubicación:', bold: true, border: [false, false, false, false] }, { text: areaNombre.toUpperCase(), style: 'dashedCell' }],
          ]
        },
        layout: {
          hLineStyle: () => ({ dash: { length: 2, space: 2 } }),
          vLineStyle: () => ({ dash: { length: 2, space: 2 } }),
          hLineWidth: (i, node) => (i >= 0 && i <= node.table.body.length) ? 0.5 : 0,
          vLineWidth: (i) => (i === 1 || i === 2) ? 0.5 : 0,
        }
      },
      { text: '\n' },

      // CLÁUSULAS LEGALES (COPIADAS DE LA IMAGEN)
      {
        text: [
          'Asimismo, está de acuerdo en haber recibido la ',
          { text: tipoEquipoStr, bold: true },
          ' en perfectas condiciones de funcionamiento para las actividades que le fueron encomendadas. Sabiendo que la computadora que recibe es exclusiva de trabajo, se compromete a hacer buen uso de la misma, evitando el uso inapropiado y negligente que conduzca a la pérdida de información o daño de la computadora. De la misma forma se compromete a mantenerlo en las mejores condiciones físicas, reportando cualquier anomalía o mal funcionamiento al área de TI para su correspondiente mantenimiento. Cualquier desperfecto al entregar el equipo será responsabilidad de quien firma esta carta y se procederá como lo designe el área correspondiente.'
        ],
        alignment: 'justify',
        lineHeight: 1.2,
        fontSize: 9
      },

      { text: '\n\n\n' },

      // SECCIÓN DE FIRMA
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 300,
            stack: [
              signatureDataUrl ? { image: signatureDataUrl, width: 120, alignment: 'center', margin: [0, 0, 0, -15] } : { text: '', margin: [0, 40, 0, 0] },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 250, y2: 0, lineWidth: 0.5 }] },
              { text: nombreReceptor, bold: true, alignment: 'center', margin: [0, 5, 0, 0] }
            ],
            alignment: 'center'
          },
          { width: '*', text: '' }
        ]
      }
    ],
    styles: {
      companyName: { fontSize: 16, bold: true, color: '#101F37' },
      companyInfo: { fontSize: 7, color: '#666' },
      mainTitle: { fontSize: 14, bold: true },
      specsTable: { margin: [0, 5, 0, 15] },
      dashedCell: {
        margin: [5, 2, 5, 2],
        border: [true, true, true, true]
      }
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};

module.exports = { generateResponsiva };