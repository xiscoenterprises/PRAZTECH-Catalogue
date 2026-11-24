const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { resolveProductImagePath } = require('./imageResolver');

const generateEnquiryPDF = async (enquiryData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Enquiry ${enquiryData.referenceNumber} - PRAZTECH® Engineering`,
          Author: 'PRAZTECH® Engineering',
          Subject: 'Product Enquiry / Request for Quotation'
        }
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const brandPrimary = '#2c114b';
      const brandAccent = '#5f3f8c';
      const textDark = '#1a1a1a';
      const textMuted = '#555555';
      const borderLight = '#dddddd';
      const bgLight = '#f8f6fc';

      // --- HEADER ---
      // Logo if exists
      const logoCandidates = [
        path.join(__dirname, '../../data/logo.png'),
        path.join(__dirname, '../../../Company Logo Black.png'),
        path.join(__dirname, '../../../client/public/images/logo-black.png')
      ];
      let logoFound = false;
      for (const lp of logoCandidates) {
        if (fs.existsSync(lp)) {
          try {
            doc.image(lp, 40, 35, { width: 145 });
            logoFound = true;
            break;
          } catch (e) {
            // continue
          }
        }
      }

      if (!logoFound) {
        doc.fillColor(brandPrimary).fontSize(20).font('Helvetica-Bold').text('PRAZTECH® Engineering', 40, 45);
      }

      // Business Contact Info on Top Right
      doc.fontSize(8).font('Helvetica').fillColor(textMuted);
      doc.text(process.env.BUSINESS_NAME || 'PRAZTECH® Engineering', 330, 36, { align: 'right', width: 225 });
      doc.text('Asaf Ali Rd, Delhi, 110002', 330, 48, { align: 'right', width: 225 });
      doc.text(`Email: ${process.env.BUSINESS_EMAIL || 'xiscoenterprises@gmail.com'}`, 330, 60, { align: 'right', width: 225 });
      doc.text(`Phone: ${process.env.BUSINESS_PHONE || '+91 8744020102'}`, 330, 72, { align: 'right', width: 225 });
      doc.text(`Web: ${process.env.BUSINESS_WEBSITE || 'www.praztechtools.com'}`, 330, 84, { align: 'right', width: 225 });

      doc.moveTo(40, 110).lineTo(555, 110).strokeColor(brandAccent).lineWidth(1.5).stroke();

      // --- DOCUMENT TITLE BANNER ---
      doc.rect(40, 120, 515, 32).fill(brandPrimary);
      doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold');
      doc.text('PRODUCT ENQUIRY / REQUEST FOR QUOTATION', 45, 130, { align: 'center', width: 505 });

      // Reference & Date Box
      doc.rect(40, 158, 515, 26).fill(bgLight);
      doc.rect(40, 158, 515, 26).strokeColor(borderLight).lineWidth(0.5).stroke();

      doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold');
      doc.text('Enquiry Reference:', 50, 166);
      doc.fillColor(brandAccent).font('Helvetica-Bold').text(enquiryData.referenceNumber, 150, 166);

      const subDate = new Date(enquiryData.submittedAt || Date.now()).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      doc.fillColor(textDark).font('Helvetica-Bold').text('Date Submitted:', 350, 166);
      doc.font('Helvetica').fillColor(textMuted).text(subDate, 435, 166);

      // --- CUSTOMER DETAILS SECTION ---
      let y = 195;
      doc.fillColor(brandPrimary).fontSize(11).font('Helvetica-Bold').text('CUSTOMER & BUSINESS INFORMATION', 40, y);
      y += 18;

      const cust = enquiryData.customerSnapshot || {};
      const col1X = 40;
      const col2X = 300;

      doc.rect(40, y, 515, 78).strokeColor(borderLight).lineWidth(0.5).stroke();
      doc.fontSize(8.5);

      // Left Column
      doc.font('Helvetica-Bold').fillColor(textDark).text('Contact Name:', col1X + 10, y + 8);
      doc.font('Helvetica').fillColor(textMuted).text(cust.fullName || '—', col1X + 85, y + 8);

      doc.font('Helvetica-Bold').fillColor(textDark).text('Company:', col1X + 10, y + 22);
      doc.font('Helvetica').fillColor(textMuted).text(cust.company || 'Individual / Non-commercial', col1X + 85, y + 22);

      doc.font('Helvetica-Bold').fillColor(textDark).text('Email:', col1X + 10, y + 36);
      doc.font('Helvetica').fillColor(textMuted).text(cust.email || '—', col1X + 85, y + 36);

      doc.font('Helvetica-Bold').fillColor(textDark).text('Phone / Mobile:', col1X + 10, y + 50);
      doc.font('Helvetica').fillColor(textMuted).text(cust.phone || '—', col1X + 85, y + 50);

      if (cust.whatsapp) {
        doc.font('Helvetica-Bold').fillColor(textDark).text('WhatsApp:', col1X + 10, y + 64);
        doc.font('Helvetica').fillColor(textMuted).text(cust.whatsapp, col1X + 85, y + 64);
      }

      // Right Column
      doc.font('Helvetica-Bold').fillColor(textDark).text('Country:', col2X + 10, y + 8);
      doc.font('Helvetica').fillColor(textMuted).text(cust.country || '—', col2X + 75, y + 8);

      doc.font('Helvetica-Bold').fillColor(textDark).text('State / City:', col2X + 10, y + 22);
      doc.font('Helvetica').fillColor(textMuted).text(`${cust.state || ''}, ${cust.city || ''}`, col2X + 75, y + 22);

      if (cust.address) {
        doc.font('Helvetica-Bold').fillColor(textDark).text('Address:', col2X + 10, y + 36);
        doc.font('Helvetica').fillColor(textMuted).text(cust.address, col2X + 75, y + 36, { width: 170 });
      }

      if (cust.gstin) {
        doc.font('Helvetica-Bold').fillColor(textDark).text('GSTIN:', col2X + 10, y + 56);
        doc.font('Helvetica').fillColor(textMuted).text(cust.gstin, col2X + 75, y + 56);
      }

      // --- CATALOGUE ITEMS TABLE WITH PHOTOS ---
      y += 92;
      doc.fillColor(brandPrimary).fontSize(11).font('Helvetica-Bold').text('REQUESTED CATALOGUE PRODUCTS', 40, y);
      y += 18;

      const drawTableHeader = (curY) => {
        doc.rect(40, curY, 515, 20).fill(brandAccent);
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('#', 42, curY + 6, { width: 20 });
        doc.text('Photo', 64, curY + 6, { width: 46, align: 'center' });
        doc.text('SKU / Product Model', 115, curY + 6, { width: 180 });
        doc.text('Category / Specifications', 300, curY + 6, { width: 130 });
        doc.text('Qty', 435, curY + 6, { width: 35, align: 'center' });
        doc.text('Item Notes', 475, curY + 6, { width: 75 });
      };

      drawTableHeader(y);
      y += 20;

      const items = enquiryData.catalogueItems || [];
      const rowHeight = 44;

      items.forEach((item, idx) => {
        // Page break check
        if (y + rowHeight > 740) {
          doc.addPage();
          y = 45;
          drawTableHeader(y);
          y += 20;
        }

        const rowBg = idx % 2 === 0 ? '#ffffff' : bgLight;
        doc.rect(40, y, 515, rowHeight).fill(rowBg);
        doc.rect(40, y, 515, rowHeight).strokeColor(borderLight).lineWidth(0.5).stroke();

        // Index
        doc.fillColor(textDark).fontSize(8).font('Helvetica');
        doc.text(String(idx + 1), 42, y + 16, { width: 20 });

        // Product Photo
        const imgBoxX = 66;
        const imgBoxY = y + 4;
        const imgBoxSize = 36;
        doc.rect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize).fill('#ffffff').strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        const imgPath = resolveProductImagePath(item);
        if (imgPath && fs.existsSync(imgPath)) {
          try {
            doc.image(imgPath, imgBoxX + 1, imgBoxY + 1, {
              fit: [imgBoxSize - 2, imgBoxSize - 2],
              align: 'center',
              valign: 'center'
            });
          } catch (imgErr) {
            doc.fontSize(6).fillColor(textMuted).text('Photo', imgBoxX, imgBoxY + 14, { width: imgBoxSize, align: 'center' });
          }
        } else {
          doc.fontSize(6).fillColor(textMuted).text('Tooling', imgBoxX, imgBoxY + 14, { width: imgBoxSize, align: 'center' });
        }

        // Model / SKU & Product Name (Always strictly capitalized)
        const skuText = (item.modelNo || '').trim().replace(/\s*-\s*/g, '-').toUpperCase();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(textDark).text(skuText, 115, y + 8, { width: 180 });
        doc.font('Helvetica').fillColor(textMuted).fontSize(7.5).text(item.name, 115, y + 21, { width: 180, height: 18, ellipsis: true });

        // Category / Sub-model
        doc.fontSize(7.5).fillColor(textDark);
        let specText = item.category;
        if (item.selectedSubModel && typeof item.selectedSubModel === 'object') {
          const subKey = item.selectedSubModel.sizeInches ? `${item.selectedSubModel.sizeInches} (${item.selectedSubModel.sizeMm || ''})` : (item.selectedSubModel.modelNo || item.selectedSubModel.sku || item.selectedSubModel.size || item.selectedSubModel.sizeMm || '');
          if (subKey) specText += ` (${String(subKey).trim().replace(/\s*-\s*/g, '-').toUpperCase()})`;
          if (item.selectedSubModel.stoneColor) {
            specText += ` [${String(item.selectedSubModel.stoneColor).toUpperCase()} STONE]`;
          }
        }
        doc.text(specText, 300, y + 14, { width: 130, height: 24, ellipsis: true });

        // Qty
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(brandPrimary);
        doc.text(String(item.quantity), 435, y + 14, { width: 35, align: 'center' });

        // Notes
        doc.font('Helvetica').fontSize(7.5).fillColor(textMuted);
        doc.text(item.notes || '—', 475, y + 14, { width: 75, height: 24, ellipsis: true });

        y += rowHeight;
      });

      // --- CUSTOM PRODUCTS ENQUIRY SECTION (if any) ---
      const customItems = enquiryData.customItems || [];
      if (customItems.length > 0) {
        y += 15;
        if (y > 680) { doc.addPage(); y = 50; }

        doc.fillColor(brandPrimary).fontSize(11).font('Helvetica-Bold').text('CUSTOM PRODUCT ENQUIRIES', 40, y);
        y += 18;

        customItems.forEach((cItem, cIdx) => {
          if (y > 700) { doc.addPage(); y = 50; }

          doc.rect(40, y, 515, 52).fill(bgLight);
          doc.rect(40, y, 515, 52).strokeColor(borderLight).lineWidth(0.5).stroke();

          doc.fillColor(brandAccent).fontSize(8.5).font('Helvetica-Bold');
          doc.text(`Custom Item #${cIdx + 1}: ${cItem.productName}`, 50, y + 6);
          doc.fillColor(textDark).font('Helvetica-Bold').text(`Qty: ${cItem.quantity}`, 490, y + 6);

          doc.fontSize(7.5).font('Helvetica').fillColor(textMuted);
          const specParts = [];
          if (cItem.specifications) specParts.push(`Specs: ${cItem.specifications}`);
          if (cItem.dimensions) specParts.push(`Dimensions: ${cItem.dimensions}`);
          if (cItem.material) specParts.push(`Material: ${cItem.material}`);
          if (cItem.intendedApplication) specParts.push(`App: ${cItem.intendedApplication}`);

          doc.text(specParts.join(' | ') || 'No extra specs specified', 50, y + 20, { width: 495 });
          if (cItem.notes) {
            doc.text(`Notes: ${cItem.notes}`, 50, y + 34, { width: 495 });
          }

          y += 58;
        });
      }

      // --- GENERAL NOTES SECTION ---
      if (enquiryData.generalNotes) {
        y += 10;
        if (y > 710) { doc.addPage(); y = 50; }

        doc.fillColor(brandPrimary).fontSize(10).font('Helvetica-Bold').text('SPECIAL INSTRUCTIONS / GENERAL NOTES', 40, y);
        y += 15;
        doc.rect(40, y, 515, 36).strokeColor(borderLight).lineWidth(0.5).stroke();
        doc.fillColor(textDark).fontSize(8).font('Helvetica').text(enquiryData.generalNotes, 50, y + 8, { width: 495 });
        y += 45;
      }

      // --- NOTICE & DISCLAIMER ---
      if (y > 700) { doc.addPage(); y = 50; } else { y += 15; }
      doc.rect(40, y, 515, 45).fill('#f1f3f6');
      doc.rect(40, y, 515, 45).strokeColor(borderLight).lineWidth(0.5).stroke();

      doc.fillColor(textDark).fontSize(7.5).font('Helvetica-Bold');
      doc.text('IMPORTANT NOTICE:', 50, y + 6);
      doc.font('Helvetica').fillColor(textMuted);
      doc.text(
        'This document is a formal Product Enquiry / Request for Quotation (RFQ) submitted by the customer. ' +
        'It does NOT constitute an invoice, order confirmation, or formal price quotation. ' +
        'PRAZTECH® Engineering will review specifications, current stock, and custom tooling requirements before issuing a formal quotation.',
        50, y + 17, { width: 495 }
      );

      // --- FOOTER ---
      doc.fontSize(7).fillColor('#999999');
      doc.text(
        'PRAZTECH® Engineering • Precision-Engineered Tools • Website: www.praztechtools.com • Generated electronically via PRAZTECH® Catalogue System',
        40, 790, { align: 'center', width: 515 }
      );

      doc.end();
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateEnquiryPDF };
