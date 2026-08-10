import { WhatsAppContact, WhatsAppConversation, WhatsAppMessage } from '../types';

export interface OutboundMessagePayload {
  toWhatsAppNumber: string;
  messageText: string;
  templateName?: string;
  parameters?: Record<string, string>;
}

export interface InboundMessageWebhookPayload {
  fromWhatsAppNumber: string;
  displayName?: string;
  externalMessageId: string;
  messageText: string;
  timestamp: string;
}

export interface MessagingResponse {
  success: boolean;
  messageId?: string;
  status: string;
  error?: string;
}

/**
 * Vendor-Agnostic WhatsApp Messaging Provider Interface
 * 
 * Decouples the CRM from specific WhatsApp API gateways (e.g., Meta WhatsApp Business Cloud API, Twilio API, Infobip).
 * 
 * NOTE: Live WhatsApp integration is a future capability.
 * This class provides the architecture and abstractions for future deployment.
 */
export interface MessagingProvider {
  sendMessage(payload: OutboundMessagePayload): Promise<MessagingResponse>;
  parseWebhookPayload(rawPayload: unknown): InboundMessageWebhookPayload | null;
  verifyWhatsAppContact(whatsappNumber: string): Promise<{ isVerified: boolean; formattedNumber: string }>;
}

/**
 * Mock / Stub Implementation of MessagingProvider for Future Integration Preparation
 */
export class StubWhatsAppMessagingProvider implements MessagingProvider {
  public async sendMessage(payload: OutboundMessagePayload): Promise<MessagingResponse> {
    console.log('[MessagingService Stub] Outbound WhatsApp message queued:', payload);
    return {
      success: true,
      messageId: `WA-STUB-${Date.now()}`,
      status: 'queued_future_integration',
    };
  }

  public parseWebhookPayload(rawPayload: unknown): InboundMessageWebhookPayload | null {
    if (typeof rawPayload === 'object' && rawPayload !== null) {
      const p = rawPayload as any;
      if (p.from && p.text) {
        return {
          fromWhatsAppNumber: String(p.from),
          displayName: p.displayName || undefined,
          externalMessageId: p.id || `MSG-${Date.now()}`,
          messageText: String(p.text),
          timestamp: new Date().toISOString(),
        };
      }
    }
    return null;
  }

  public async verifyWhatsAppContact(whatsappNumber: string): Promise<{ isVerified: boolean; formattedNumber: string }> {
    const clean = whatsappNumber.replace(/[^0-9+]/g, '');
    return {
      isVerified: clean.length >= 10,
      formattedNumber: clean.startsWith('+') ? clean : `+1${clean}`,
    };
  }
}

export const messagingService = new StubWhatsAppMessagingProvider();
