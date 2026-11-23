const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const Contact = require('../models/Contact');
const { sendContactFormEmail } = require('../utils/emailService');
const { getDBStatus } = require('../config/db');

const localContactsDir = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'praztech_contacts') 
  : path.join(__dirname, '../../data/contacts');
try {
  if (!fs.existsSync(localContactsDir)) {
    fs.mkdirSync(localContactsDir, { recursive: true });
  }
} catch (e) {}

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Basic HTML/script tag stripping for sanitization
 */
const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * POST /api/contact
 * Handles factory-direct customer inquiries and technical advisory requests
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, phone, company, message } = req.body || {};

    const errors = [];

    // 1. Validate Name
    const cleanName = sanitizeText(name);
    if (!cleanName || cleanName.length < 2) {
      errors.push('Full name is required (minimum 2 characters).');
    } else if (cleanName.length > 100) {
      errors.push('Name cannot exceed 100 characters.');
    }

    // 2. Validate Email
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      errors.push('Email address is required.');
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.push('Please provide a valid email address.');
    } else if (cleanEmail.length > 150) {
      errors.push('Email address is too long.');
    }

    // 3. Validate Message
    const cleanMessage = sanitizeText(message);
    if (!cleanMessage || cleanMessage.length < 10) {
      errors.push('Message is required (minimum 10 characters).');
    } else if (cleanMessage.length > 3000) {
      errors.push('Message cannot exceed 3,000 characters.');
    }

    // 4. Sanitize Optional Fields
    const cleanPhone = sanitizeText(phone).slice(0, 30);
    const cleanCompany = sanitizeText(company).slice(0, 150);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const contactPayload = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      message: cleanMessage,
      ipAddress: req.ip || req.connection.remoteAddress,
      createdAt: new Date().toISOString()
    };

    // 5. Persist to Local Storage Fallback
    try {
      const fileId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const filePath = path.join(localContactsDir, `contact_${fileId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(contactPayload, null, 2), 'utf8');
    } catch (fsErr) {
      console.warn('⚠️ Warning: Could not write contact submission to local file fallback:', fsErr.message);
    }

    // 6. Attempt Email Dispatch
    let emailDelivered = false;
    let deliveryError = null;

    try {
      const emailResult = await sendContactFormEmail(contactPayload);
      if (emailResult.businessEmailSent) {
        emailDelivered = true;
      } else if (emailResult.errors && emailResult.errors.length > 0) {
        deliveryError = emailResult.errors[0];
      }
    } catch (emailErr) {
      deliveryError = emailErr.message;
      console.error('❌ Contact form email dispatch error:', emailErr);
    }

    // 7. Persist to MongoDB (if connected)
    if (getDBStatus()) {
      try {
        await Contact.create({
          ...contactPayload,
          emailDelivered,
          deliveryError
        });
      } catch (dbErr) {
        console.warn('⚠️ Warning: Could not persist contact submission to MongoDB:', dbErr.message);
      }
    }

    // 8. Return response
    if (emailDelivered) {
      return res.status(201).json({
        success: true,
        message: 'Thank you for reaching out to PRAZTECH® Engineering. Your inquiry has been delivered and our technical advisory team will contact you within 24 business hours.'
      });
    }

    // If email failed or SMTP not set, message is still safely preserved in database/file
    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to PRAZTECH® Engineering. Your inquiry has been safely recorded in our commercial portal. Our technical team will review it shortly.',
      emailNotice: deliveryError || 'Email notification pending delivery queue.'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { submitContactForm };
