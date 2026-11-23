/**
 * Validates mandatory environment variables safely on server startup.
 * Never prints secret values to console or log streams.
 */
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingCritical = [];
  const notices = [];

  // 1. Administrative Credentials Check
  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);
  if (!hasAdminPassword) {
    if (isProduction) {
      missingCritical.push('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH');
    } else {
      notices.push('ADMIN_PASSWORD is not set. Administrative authentication is disabled until configured.');
    }
  }

  // 2. Cryptographic Session Secret Check
  if (!process.env.SESSION_SECRET) {
    if (isProduction) {
      missingCritical.push('SESSION_SECRET');
    } else {
      notices.push('SESSION_SECRET is not set. Using an ephemeral in-memory secret for this session.');
    }
  }

  // 3. Export API Key Check
  if (!process.env.ADMIN_API_KEY) {
    notices.push('ADMIN_API_KEY is not set. API key-based export access is disabled.');
  }

  // 4. Output notices
  if (notices.length > 0 && !isProduction) {
    notices.forEach(notice => console.warn(`⚠️  [ENV NOTICE] ${notice}`));
  }

  // 5. Fail safely in production if critical secrets are missing
  if (missingCritical.length > 0) {
    console.error('================================================================');
    console.error('❌ FATAL SECURITY ERROR: Server startup notice in production mode.');
    console.error(`   Missing mandatory environment variable(s): ${missingCritical.join(', ')}`);
    console.error('   Please define these variables in your production environment configuration.');
    console.error('================================================================');
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
  }
};

module.exports = { validateEnvironment };
