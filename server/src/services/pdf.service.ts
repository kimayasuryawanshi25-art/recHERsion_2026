import PDFDocument from 'pdfkit';
import type { AssembledSummaryResult } from './summary.service.js';

export async function generateConsultationSummaryPdf(summary: AssembledSummaryResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Brand styling colors
      const plumColor = '#6b21a8'; // Plum
      const stoneDark = '#1c1917';
      const stoneMuted = '#78716c';
      const sandLight = '#f5f5f4';

      // Header block
      doc
        .rect(50, 45, doc.page.width - 100, 4)
        .fill(plumColor);

      doc.moveDown(1);
      doc
        .fillColor(plumColor)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('HerHealth Companion', 50, 60);

      doc
        .fillColor(stoneDark)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Appointment Preparation Summary', 50, 85);

      doc
        .fillColor(stoneMuted)
        .fontSize(9)
        .font('Helvetica')
        .text(`Generated on ${new Date().toLocaleDateString()} | Personal Consultation Record`, 50, 105);

      doc.moveDown(1.5);

      // Prominent Non-Diagnostic Banner
      const disclaimerY = 125;
      doc
        .roundedRect(50, disclaimerY, doc.page.width - 100, 36, 4)
        .fillAndStroke(sandLight, '#e7e5e4');

      doc
        .fillColor('#9a3412')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('CLINICAL ADVISORY:', 62, disclaimerY + 8);

      doc
        .fillColor('#44403c')
        .fontSize(8.5)
        .font('Helvetica')
        .text(
          'This summary was prepared by HerHealth Companion from self-reported records. It is not a clinical assessment, medical diagnosis, or treatment plan.',
          62,
          disclaimerY + 20,
          { width: doc.page.width - 124 }
        );

      doc.y = disclaimerY + 48;
      doc.moveDown(1);

      // Render ONLY kept (enabled) sections in order, excluding raw header/footer/disclaimer duplicates
      const sectionsToRender = summary.sections
        .filter(s => s.enabled)
        .filter(s => s.id !== 'header' && s.id !== 'disclaimer' && s.id !== 'footer');

      for (const section of sectionsToRender) {
        // Check if we need page break
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }

        // Section Title with subtle bar
        doc
          .fillColor(plumColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(section.title.toUpperCase());

        doc.moveDown(0.2);

        // Section Content
        doc
          .fillColor(stoneDark)
          .fontSize(9.5)
          .font('Helvetica')
          .text(section.content, {
            lineGap: 3,
            paragraphGap: 6,
          });

        doc.moveDown(0.8);
      }

      // Add required footer to EVERY page
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 45;

        doc
          .moveTo(50, footerY - 5)
          .lineTo(doc.page.width - 50, footerY - 5)
          .lineWidth(0.5)
          .strokeColor('#d6d3d1')
          .stroke();

        doc
          .fillColor(stoneMuted)
          .fontSize(7.5)
          .font('Helvetica')
          .text(
            'This summary was prepared by HerHealth Companion from self-reported records. It is not a clinical assessment, medical diagnosis, or treatment plan.',
            50,
            footerY,
            { width: doc.page.width - 140 }
          );

        doc
          .fillColor(stoneMuted)
          .fontSize(7.5)
          .font('Helvetica')
          .text(
            `Page ${i + 1} of ${range.count}`,
            doc.page.width - 90,
            footerY,
            { align: 'right' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
