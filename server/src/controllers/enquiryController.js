const fs = require('fs');
const path = require('path');
const os = require('os');
const Enquiry = require('../models/Enquiry');
const Customer = require('../models/Customer');
const { getNextSequence } = require('../utils/referenceGenerator');
const { generateEnquiryPDF } = require('../utils/pdfGenerator');
const { sendEnquiryEmails } = require('../utils/emailService');
const { getDBStatus } = require('../config/db');

const localEnquiriesDir = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'praztech_enquiries') 
  : path.join(__dirname, '../../data/enquiries');
const pdfStorageDir = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'praztech_pdfs') 
  : path.join(__dirname, '../../data/pdfs');

// Ensure storage directories exist safely
const ensureDirectoriesExist = () => {
  try {
    if (!fs.existsSync(localEnquiriesDir)) fs.mkdirSync(localEnquiriesDir, { recursive: true });
  } catch (e) {}
  try {
    if (!fs.existsSync(pdfStorageDir)) fs.mkdirSync(pdfStorageDir, { recursive: true });
  } catch (e) {}
};
ensureDirectoriesExist();

// POST /api/enquiries
const createEnquiry = async (req, res, next) => {
  try {
    const {
      customer,
      catalogueItems = [],
      customItems = [],
      generalNotes = '',
      consent
    } = req.body;

    // Basic Validation
    if (!customer || !customer.fullName || !customer.email || !customer.phone || !customer.country || !customer.state || !customer.city) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory customer fields (fullName, email, phone, country, state, city).'
      });
    }

    if (!consent || !consent.accepted) {
      return res.status(400).json({
        success: false,
        message: 'Consent to terms and privacy policy is required before submitting.'
      });
    }

    if (catalogueItems.length === 0 && customItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one catalogue product or add a custom product enquiry.'
      });
    }

    // Generate unique reference number (atomic)
    const referenceNumber = await getNextSequence();
    const pdfFilename = `Enquiry_${referenceNumber}.pdf`;
    const pdfFilePath = path.join(pdfStorageDir, pdfFilename);

    // Normalize customer contact info
    const emailNormalized = customer.email.trim().toLowerCase();
    const phoneNormalized = customer.phone.replace(/[^0-9+]/g, '');

    let customerId = null;

    // Persist Customer (if DB is connected)
    if (getDBStatus()) {
      let existingCustomer = await Customer.findOne({
        $or: [
          { emailNormalized },
          { phoneNormalized }
        ]
      });

      if (existingCustomer) {
        existingCustomer.enquiryCount += 1;
        existingCustomer.enquiryIds.push(referenceNumber);
        // Update contact details if provided
        if (customer.company) existingCustomer.company = customer.company;
        if (customer.whatsapp) existingCustomer.whatsapp = customer.whatsapp;
        if (customer.address) existingCustomer.address = customer.address;
        if (customer.gstin) existingCustomer.gstin = customer.gstin;
        await existingCustomer.save();
        customerId = existingCustomer._id;
      } else {
        const newCustomer = await Customer.create({
          fullName: customer.fullName.trim(),
          company: (customer.company || '').trim(),
          email: customer.email.trim(),
          emailNormalized,
          phone: customer.phone.trim(),
          phoneNormalized,
          whatsapp: (customer.whatsapp || '').trim(),
          country: customer.country.trim(),
          state: customer.state.trim(),
          city: customer.city.trim(),
          address: (customer.address || '').trim(),
          gstin: (customer.gstin || '').trim(),
          enquiryCount: 1,
          enquiryIds: [referenceNumber]
        });
        customerId = newCustomer._id;
      }
    }

    // Prepare Enquiry Data Object
    const enquiryData = {
      referenceNumber,
      customerId,
      customerSnapshot: {
        fullName: customer.fullName.trim(),
        company: (customer.company || '').trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        whatsapp: (customer.whatsapp || '').trim(),
        country: customer.country.trim(),
        state: customer.state.trim(),
        city: customer.city.trim(),
        address: (customer.address || '').trim(),
        gstin: (customer.gstin || '').trim()
      },
      catalogueItems: catalogueItems.map(item => ({
        productId: item.productId || item.id || item.slug,
        modelNo: (item.modelNo || '').trim().replace(/\s*-\s*/g, '-').toUpperCase(),
        name: item.name,
        category: item.category,
        selectedSubModel: item.selectedSubModel || null,
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        notes: item.notes || '',
        productSnapshot: item
      })),
      customItems: customItems.map(cItem => ({
        productName: cItem.productName,
        specifications: cItem.specifications || '',
        dimensions: cItem.dimensions || '',
        material: cItem.material || '',
        quantity: Math.max(1, parseInt(cItem.quantity) || 1),
        intendedApplication: cItem.intendedApplication || '',
        notes: cItem.notes || '',
        attachmentName: cItem.attachmentName || '',
        attachmentUrl: cItem.attachmentUrl || ''
      })),
      generalNotes: generalNotes.trim(),
      status: req.body.status || 'Review Pending',
      pdfUrl: `/api/enquiries/${referenceNumber}/download`,
      consent: {
        accepted: true,
        timestamp: new Date(),
        policyVersion: consent.policyVersion || '1.0'
      },
      notificationStatus: {
        customerEmailSent: false,
        businessEmailSent: false,
        errors: []
      },
      submittedAt: new Date()
    };

    // 1. SAVE ENQUIRY FIRST (Mandatory requirement: must be saved before attempting email)
    let savedEnquiry = null;
    if (getDBStatus()) {
      savedEnquiry = await Enquiry.create(enquiryData);
    } else {
      // Local fallback persistence
      fs.writeFileSync(
        path.join(localEnquiriesDir, `${referenceNumber}.json`),
        JSON.stringify(enquiryData, null, 2)
      );
    }

    // 2. GENERATE PDF
    try {
      await generateEnquiryPDF(enquiryData, pdfFilePath);
    } catch (pdfErr) {
      console.error('⚠️ PDF Generation failed:', pdfErr.message);
    }

    // 3. SEND EMAIL NOTIFICATIONS (Dispatched in background so client receives instant response)
    sendEnquiryEmails(enquiryData, pdfFilePath)
      .then(async (emailRes) => {
        if (getDBStatus() && savedEnquiry) {
          savedEnquiry.notificationStatus = emailRes;
          await savedEnquiry.save();
        }
      })
      .catch((emailErr) => {
        console.error('⚠️ Background Email dispatch notice:', emailErr.message);
      });

    // 4. RETURN CONFIRMATION TO CLIENT
    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: {
        referenceNumber,
        submittedAt: enquiryData.submittedAt,
        pdfDownloadUrl: `/api/enquiries/${referenceNumber}/download`,
        customer: enquiryData.customerSnapshot,
        itemCount: enquiryData.catalogueItems.length + enquiryData.customItems.length,
        catalogueItems: enquiryData.catalogueItems,
        customItems: enquiryData.customItems
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries - Retrieve all logged enquiries
const getAllEnquiries = async (req, res, next) => {
  try {
    if (getDBStatus()) {
      const enquiries = await Enquiry.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: enquiries.length, data: enquiries });
    }

    // Local JSON files fallback
    if (!fs.existsSync(localEnquiriesDir)) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const files = fs.readdirSync(localEnquiriesDir).filter(f => f.endsWith('.json'));
    const enquiries = files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(localEnquiriesDir, file), 'utf8'));
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    enquiries.sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0));

    return res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries/:reference
const getEnquiryByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (getDBStatus()) {
      const enquiry = await Enquiry.findOne({ referenceNumber: reference });
      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry reference not found' });
      }
      return res.json({ success: true, data: enquiry });
    }

    // Local JSON fallback
    const localFile = path.join(localEnquiriesDir, `${reference}.json`);
    if (fs.existsSync(localFile)) {
      const data = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      return res.json({ success: true, data });
    }

    res.status(404).json({ success: false, message: 'Enquiry reference not found' });
  } catch (error) {
    next(error);
  }
};

// GET /api/enquiries/:reference/download
const downloadEnquiryPDF = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const pdfPath = path.join(pdfStorageDir, `Enquiry_${reference}.pdf`);

    // Fetch latest enquiryData to ensure up-to-date capitalized SKUs and photos
    let enquiryData = null;
    if (getDBStatus()) {
      enquiryData = await Enquiry.findOne({ referenceNumber: reference });
    } else {
      const localFile = path.join(localEnquiriesDir, `${reference}.json`);
      if (fs.existsSync(localFile)) {
        enquiryData = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      }
    }

    if (enquiryData) {
      await generateEnquiryPDF(enquiryData, pdfPath);
    }

    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PRAZTECH_Enquiry_${reference}.pdf"`);
      return fs.createReadStream(pdfPath).pipe(res);
    }

    res.status(404).json({ success: false, message: 'Enquiry reference not found' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/enquiries/:reference - Update enquiry (status, notes, etc.)
const updateEnquiry = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { status, generalNotes, catalogueItems } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (generalNotes !== undefined) updates.generalNotes = generalNotes;
    if (catalogueItems && Array.isArray(catalogueItems)) updates.catalogueItems = catalogueItems;

    if (getDBStatus()) {
      const updated = await Enquiry.findOneAndUpdate(
        { referenceNumber: reference },
        updates,
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      return res.json({ success: true, data: updated });
    }

    // Local JSON fallback
    const localFile = path.join(localEnquiriesDir, `${reference}.json`);
    if (fs.existsSync(localFile)) {
      const current = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      const merged = { ...current, ...updates };
      fs.writeFileSync(localFile, JSON.stringify(merged, null, 2));
      return res.json({ success: true, data: merged });
    }

    res.status(404).json({ success: false, message: 'Enquiry not found.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/enquiries/:reference - Delete enquiry
const deleteEnquiry = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (getDBStatus()) {
      const deleted = await Enquiry.findOneAndDelete({ referenceNumber: reference });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
    }

    // Clean up local files if they exist
    const localFile = path.join(localEnquiriesDir, `${reference}.json`);
    if (fs.existsSync(localFile)) fs.unlinkSync(localFile);

    const pdfPath = path.join(pdfStorageDir, `Enquiry_${reference}.pdf`);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    return res.json({ success: true, message: 'Enquiry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryByReference,
  downloadEnquiryPDF,
  updateEnquiry,
  deleteEnquiry
};
