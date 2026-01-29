import { NextRequest } from 'next/server';
import {
  RateLimiter,
  getClientIP,
  sanitizeInput,
  sanitizeForHtml,
  successResponse,
  errorResponse,
  rateLimitResponse,
  configErrorResponse,
  serverErrorResponse,
  isSpamSubmission,
  spamResponse,
  logError,
} from '@/lib/api-helpers';
import { validateCSRFToken } from '@/lib/csrf';
import { contactFormSchema, parseSchema } from '@/lib/schemas';

// Rate limiter: 3 requests per minute per IP
const rateLimiter = new RateLimiter({ maxRequests: 3 });

// Brevo configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@shammasdevelopment.io';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Shammas Development';
const COMPANY_EMAIL = 'info@shammasdevelopment.io';

// Send notification email to Shammas Development
async function sendContactNotification(data: {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  budget: string;
}): Promise<boolean> {
  try {
    const emailData = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: COMPANY_EMAIL, name: 'Shammas Development' }],
      replyTo: { email: data.email, name: data.name },
      subject: `New Contact Form: ${data.name}${data.company ? ` from ${data.company}` : ''}`,
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #171717; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Contact Message</h1>
                    <p style="margin: 8px 0 0 0; color: #a3a3a3; font-size: 14px;">Someone wants to work with you!</p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">NEW MESSAGE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">

              <!-- Contact Info Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</p>
                    <p style="margin: 0; color: #171717; font-size: 18px; font-weight: 600;">${data.name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                    <p style="margin: 0;">
                      <a href="mailto:${data.email}" style="color: #171717; font-size: 16px; text-decoration: none;">${data.email}</a>
                    </p>
                  </td>
                </tr>
                ${data.company ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Company</p>
                    <p style="margin: 0; color: #171717; font-size: 16px;">${data.company}</p>
                  </td>
                </tr>
                ` : ''}
                ${data.phone ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</p>
                    <p style="margin: 0;">
                      <a href="tel:${data.phone}" style="color: #171717; font-size: 16px; text-decoration: none;">${data.phone}</a>
                    </p>
                  </td>
                </tr>
                ` : ''}
                ${data.budget ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Budget</p>
                    <p style="margin: 0; color: #171717; font-size: 16px;">${data.budget}</p>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Message -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 12px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                <div style="color: #171717; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${data.message}</div>
              </div>

              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          <a href="mailto:${data.email}?subject=Re: Your Inquiry - Shammas Development" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply via Email</a>
                        </td>
                        ${data.phone ? `
                        <td>
                          <a href="tel:${data.phone}" style="display: inline-block; background-color: #ffffff; color: #171717; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; border: 2px solid #171717;">Call ${data.name.split(' ')[0]}</a>
                        </td>
                        ` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; text-align: center;">
                This message was sent from the contact form on shammasdevelopment.io
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      textContent: `
NEW CONTACT FORM SUBMISSION
===========================

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.budget ? `Budget: ${data.budget}` : ''}

MESSAGE:
${data.message}

---
Reply to: ${data.email}
${data.phone ? `Call: ${data.phone}` : ''}
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  } catch (error) {
    logError('Contact notification email', error);
    return false;
  }
}

// Send confirmation email to the user
async function sendConfirmationToUser(data: { name: string; email: string }): Promise<boolean> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shammasdevelopment.io';

  try {
    const emailData = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: data.email, name: data.name }],
      subject: 'We received your message - Shammas Development',
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${SITE_URL}" style="text-decoration: none; color: #ffffff; font-size: 24px; font-weight: 700;">Shammas Development</a>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #171717 0%, #262626 100%); padding: 48px 40px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 20px auto; line-height: 64px;">
                      <span style="font-size: 28px;">&#10003;</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Message Received!</h1>
                    <p style="margin: 12px 0 0 0; color: #a3a3a3; font-size: 16px;">Thanks for reaching out, ${data.name.split(' ')[0]}!</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; color: #171717; font-size: 16px; line-height: 1.7;">
                      We've received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you within <strong>24-48 hours</strong>.
                    </p>

                    <p style="margin: 0 0 24px 0; color: #525252; font-size: 15px; line-height: 1.7;">
                      In the meantime, feel free to explore our services or check out some of our recent work.
                    </p>

                    <!-- CTA Buttons -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-right: 12px;">
                                <a href="${SITE_URL}/services" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View Services</a>
                              </td>
                              <td>
                                <a href="${SITE_URL}/work" style="display: inline-block; background-color: #ffffff; color: #171717; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; border: 2px solid #e5e5e5;">See Our Work</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; font-weight: 500;">
                Shammas Development LLC
              </p>
              <p style="margin: 0 0 16px 0; color: #525252; font-size: 13px;">
                Remote-first &bull; Serving clients across the United States
              </p>
              <p style="margin: 0; color: #525252; font-size: 12px;">
                Need urgent help? Email us directly at <a href="mailto:info@shammasdevelopment.io" style="color: #a3a3a3;">info@shammasdevelopment.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      textContent: `
MESSAGE RECEIVED!
=================

Thanks for reaching out, ${data.name.split(' ')[0]}!

We've received your message and appreciate you taking the time to contact us. Our team will review your inquiry and get back to you within 24-48 hours.

In the meantime, feel free to explore our services or check out some of our recent work.

View Services: ${SITE_URL}/services
See Our Work: ${SITE_URL}/work

---
Shammas Development LLC
Remote-first | Serving clients across the United States

Need urgent help? Email us directly at info@shammasdevelopment.io
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  } catch (error) {
    logError('Contact confirmation email', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      return errorResponse('Invalid or missing CSRF token. Please refresh the page and try again.', 403, 'CSRF_ERROR');
    }

    // Get client IP for rate limiting
    const ip = getClientIP(request);

    // Check rate limit
    if (!rateLimiter.check(ip)) {
      return rateLimitResponse();
    }

    // Parse request body
    const body = await request.json();

    // Honeypot check - if botcheck is filled, it's a bot
    if (isSpamSubmission(body.botcheck)) {
      return spamResponse();
    }

    // Validate with Zod schema
    const validation = parseSchema(contactFormSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { name, email, company, phone, message, budget } = validation.data;

    // Sanitize inputs for storage/logic
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email).toLowerCase(),
      company: company ? sanitizeInput(company) : '',
      phone: phone ? sanitizeInput(phone) : '',
      message: sanitizeInput(message, 5000),
      budget: budget ? sanitizeInput(budget) : '',
    };

    // HTML-escaped version for email templates (prevents XSS)
    const htmlSafeData = {
      name: sanitizeForHtml(name),
      email: sanitizeForHtml(email).toLowerCase(),
      company: company ? sanitizeForHtml(company) : '',
      phone: phone ? sanitizeForHtml(phone) : '',
      message: sanitizeForHtml(message, 5000),
      budget: budget ? sanitizeForHtml(budget) : '',
    };

    if (!BREVO_API_KEY) {
      logError('Contact API', 'BREVO_API_KEY not configured');
      return configErrorResponse();
    }

    // Send both emails in parallel (use HTML-safe data for email templates)
    const [companyEmailSent, userEmailSent] = await Promise.all([
      sendContactNotification(htmlSafeData),
      sendConfirmationToUser({ name: htmlSafeData.name, email: sanitizedData.email }),
    ]);

    if (companyEmailSent && userEmailSent) {
      return successResponse(undefined, 'Your message has been sent successfully. Check your inbox for confirmation!');
    } else if (companyEmailSent) {
      return successResponse(undefined, 'Your message has been sent successfully!');
    } else {
      return serverErrorResponse('Unable to send message. Please try again or email us directly at info@shammasdevelopment.io');
    }
  } catch (error) {
    logError('Contact API', error);
    return serverErrorResponse('An error occurred. Please try again or email us directly at info@shammasdevelopment.io');
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return successResponse();
}
