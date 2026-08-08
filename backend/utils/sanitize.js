const { logAuthEvent } = require('./audit');

// AI prompt-injection defense for aiChat in aiController.js.
// Ref: OWASP LLM01 Prompt Injection (https://owasp.org/www-project-top-10-for-large-language-model-applications/)

const MAX_INPUT_LENGTH = 1000;

// Known override patterns that attempt to jailbreak the AI by hijacking instructions.
const OVERRIDE_PATTERNS = [
  /ignore (previous|all|your) (instructions?|prompts?|rules?)/i,
  /system\s*prompt/i,
  /you are now/i,
  /new instructions?:/i,
  /forget (everything|what|all)/i,
  /disregard (previous|all|your)/i,
  /act as (if|though)?/i,
  /pretend (you are|to be)/i,
];

/**
 * Sanitize user input destined for an AI prompt.
 * Returns { clean, flagged, reason }.
 */
function sanitizePrompt(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return { clean: '', flagged: true, reason: 'Empty or non-string input' };
  }

  let clean = String(input).trim();

  // 1. Cap length to bound abuse.
  if (clean.length > MAX_INPUT_LENGTH) {
    clean = clean.slice(0, MAX_INPUT_LENGTH);
  }

  // 2. Strip control chars and zero-width / bidi-override Unicode.
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  // Zero-width space, zero-width joiner, LTR/RTL override, etc.
  clean = clean.replace(/[​-‍‪-‮﻿]/g, '');

  // 3. Flag known override patterns.
  let flagged = false;
  let reason = null;
  for (const pattern of OVERRIDE_PATTERNS) {
    if (pattern.test(clean)) {
      flagged = true;
      reason = `Potential prompt-injection attempt detected`;
      break;
    }
  }

  return { clean, flagged, reason };
}

/**
 * Middleware-style function for controllers.
 * Logs flagged attempts and returns sanitized input for safe interpolation.
 * Even flagged input is still processed — we fence it, not reject it.
 */
function sanitizeAndLog({ input, userId, ip, userAgent }) {
  const result = sanitizePrompt(input);
  if (result.flagged) {
    logAuthEvent({
      userId,
      eventType: 'prompt_injection_attempt',
      ip,
      userAgent,
      success: false,
      detail: result.reason,
    });
  }
  return result.clean;
}

module.exports = { sanitizePrompt, sanitizeAndLog, MAX_INPUT_LENGTH };
