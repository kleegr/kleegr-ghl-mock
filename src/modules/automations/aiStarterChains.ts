/**
 * aiStarterChains.ts - data foundation that maps common AI-composer prompts to
 * ready-made starter workflow chains.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The AI composer in the Automations module is interactive but does not yet turn
 * a natural-language prompt ("follow up with missed calls") into a real starter
 * chain. This module supplies the *data* for that: a catalogue of
 * `StarterChainTemplate`s (one per common intent), a lightweight prompt ->
 * template index (`AI_STARTER_PROMPT_MAP`), and a naive resolver
 * (`resolveStarterChain`) the composer can call to pick a chain from free text.
 *
 * It is intentionally frontend-only and demo-safe:
 * - No real automation ever fires; these are display/template structures.
 * - No real business or customer data - copy uses generic merge-field tokens.
 * - Additive: nothing here mutates an existing export. Developer 6 can import
 * `STARTER_CHAINS` / `resolveStarterChain` and render or seed a builder
 * canvas from the result via `toDisplayNodes()` in workflowNodes.ts.
 *
 * Each chain is shaped exactly like the showcase `WorkflowTemplate` (rich
 * `WorkflowNode`s, nested `branches`), so the same renderer handles both.
 */

import type {
  AiStarterPromptMapping,
  StarterChainIntent,
  StarterChainTemplate,
} from './types';
import {
  missedCallFollowUp,
  newLeadNurture,
  appointmentReminder,
  quoteFollowUp,
  invoicePaymentReminder,
} from './starterChainTemplatesA';
import {
  reviewRequest,
  reactivationCampaign,
  noShowRecovery,
  abandonedFormFollowUp,
} from './starterChainTemplatesB';

/* Re-export the individual chain templates so callers can pull a specific chain
   straight from this module if they need one. */
export {
  missedCallFollowUp,
  newLeadNurture,
  appointmentReminder,
  quoteFollowUp,
  invoicePaymentReminder,
} from './starterChainTemplatesA';
export {
  reviewRequest,
  reactivationCampaign,
  noShowRecovery,
  abandonedFormFollowUp,
} from './starterChainTemplatesB';

export const STARTER_CHAINS: StarterChainTemplate[] = [
  missedCallFollowUp,
  newLeadNurture,
  appointmentReminder,
  quoteFollowUp,
  invoicePaymentReminder,
  reviewRequest,
  reactivationCampaign,
  noShowRecovery,
  abandonedFormFollowUp,
];

/** Lookup by intent. */
export const STARTER_CHAINS_BY_INTENT: Record<string, StarterChainTemplate> =
  Object.fromEntries(STARTER_CHAINS.map((c) => [c.intent, c]));

/** Lookup by template id. */
export const STARTER_CHAIN_BY_ID: Record<string, StarterChainTemplate> =
  Object.fromEntries(STARTER_CHAINS.map((c) => [c.id, c]));

/* -- Prompt -> chain index -- */

/**
 * Naive prompt-matching index. Keywords are lowercased; the resolver scores a
 * prompt against each entry by counting keyword hits. Deliberately simple and
 * deterministic - Developer 6 can swap in a smarter matcher later without
 * changing the data shape.
 */
export const AI_STARTER_PROMPT_MAP: AiStarterPromptMapping[] = [
  {
    intent: 'missed-call-follow-up',
    templateId: 'sc_missed_call',
    promptExamples: missedCallFollowUp.promptExamples,
    keywords: ['missed call', 'missed-call', 'text back', 'text-back', 'call back', 'callback', 'unanswered', 'missed'],
  },
  {
    intent: 'new-lead-nurture',
    templateId: 'sc_new_lead',
    promptExamples: newLeadNurture.promptExamples,
    keywords: ['new lead', 'nurture', 'drip', 'welcome', 'lead follow', 'fresh lead', 'onboarding'],
  },
  {
    intent: 'appointment-reminder',
    templateId: 'sc_appt_reminder',
    promptExamples: appointmentReminder.promptExamples,
    keywords: ['appointment reminder', 'reminder', 'appointment', 'booking reminder', 'reduce no show', 'confirm appointment'],
  },
  {
    intent: 'quote-follow-up',
    templateId: 'sc_quote_follow_up',
    promptExamples: quoteFollowUp.promptExamples,
    keywords: ['quote', 'estimate', 'proposal', 'quote follow', 'follow up quote', 'bid'],
  },
  {
    intent: 'invoice-payment-reminder',
    templateId: 'sc_invoice_reminder',
    promptExamples: invoicePaymentReminder.promptExamples,
    keywords: ['invoice', 'payment', 'pay', 'unpaid', 'overdue', 'past due', 'collections', 'billing'],
  },
  {
    intent: 'review-request',
    templateId: 'sc_review_request',
    promptExamples: reviewRequest.promptExamples,
    keywords: ['review', 'reviews', 'reputation', 'google review', 'testimonial', 'feedback', 'rating'],
  },
  {
    intent: 'reactivation-campaign',
    templateId: 'sc_reactivation',
    promptExamples: reactivationCampaign.promptExamples,
    keywords: ['reactivation', 'reactivate', 're-engage', 'reengage', 'win back', 'winback', 'cold lead', 'dormant', 'old contact'],
  },
  {
    intent: 'no-show-recovery',
    templateId: 'sc_no_show',
    promptExamples: noShowRecovery.promptExamples,
    keywords: ['no show', 'no-show', 'noshow', 'missed appointment', 'rebook', 'reschedule', 'did not show'],
  },
  {
    intent: 'abandoned-form-follow-up',
    templateId: 'sc_abandoned_form',
    promptExamples: abandonedFormFollowUp.promptExamples,
    keywords: ['abandoned form', 'incomplete form', 'form abandon', 'did not finish', 'unfinished form', 'partial form', 'form drop', 'abandon', 'abandoned', 'unfinished', 'incomplete', 'drop off', 'dropped off'],
  },
];

/* -- Resolver -- */

export interface StarterChainMatch {
  chain: StarterChainTemplate;
  intent: StarterChainIntent;
  /** Number of keyword hits - higher is a more confident match. */
  score: number;
}

/**
 * Resolve a free-text prompt to the best-matching starter chain.
 *
 * Scores each mapping by counting how many of its keywords appear in the
 * lowercased prompt (multi-word keywords count as a single, stronger hit).
 * Returns `null` when nothing matches, so the caller can fall back to the
 * generic blank-builder flow rather than guessing.
 */
export function resolveStarterChain(prompt: string): StarterChainTemplate | null {
  return rankStarterChains(prompt)[0]?.chain ?? null;
}

/** Full ranked list of matches (best first); empty when nothing matches. */
export function rankStarterChains(prompt: string): StarterChainMatch[] {
  const text = prompt.toLowerCase();
  const matches: StarterChainMatch[] = [];

  for (const mapping of AI_STARTER_PROMPT_MAP) {
    let score = 0;
    for (const kw of mapping.keywords) {
      if (text.includes(kw)) {
        // Multi-word keywords are more specific, so weight them higher.
        score += kw.includes(' ') ? 2 : 1;
      }
    }
    const chain = STARTER_CHAIN_BY_ID[mapping.templateId];
    if (score > 0 && chain) {
      matches.push({ chain, intent: mapping.intent, score });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

