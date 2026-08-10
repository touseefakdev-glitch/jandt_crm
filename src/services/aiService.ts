import { localDb } from './db';
import { Customer, Product, CustomerProductHistory, CustomerQuery } from '../types';

export interface AIOrderProposalItem {
  productId: string;
  quantity: number;
  agreedPrice?: number;
  packagingUnit?: string;
}

export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  requiresHumanIntervention?: boolean;
}

/**
 * Vendor-Agnostic AI Service Abstraction Layer
 * 
 * Provides controlled, permission-bounded tools for future AI / WhatsApp conversational ordering agents.
 * 
 * SECURITY & PERMISSION RULES:
 * 1. Read: The AI can query customer profiles, product catalog, inventory availability status, and customer history.
 * 2. Propose: The AI can generate draft order proposals or clarifying questions for customer confirmation.
 * 3. Escalated: If uncertain or if a human agent is needed, the AI calls createCustomerQuery to hand off to the Customer Query system.
 * 4. STRICTLY PROHIBITED: The AI has zero direct database write access, cannot modify prices, alter inventory stock, or issue invoices.
 * 
 * NOTE: WhatsApp and AI ordering automation are future capabilities.
 * The current implementation only prepares and structures the architecture required for future integration.
 */
export class AIService {
  /**
   * Identifies customer account by incoming WhatsApp phone number
   */
  public async findCustomerByWhatsApp(whatsappNumber: string): Promise<AIServiceResponse<Customer | null>> {
    const cleanNum = whatsappNumber.trim().replace(/[^0-9+]/g, '');
    const customers = localDb.getCustomers();
    const match = customers.find(c => (c.whatsapp_number && c.whatsapp_number.trim().replace(/[^0-9+]/g, '') === cleanNum));

    if (match) {
      return { success: true, data: match };
    }
    return {
      success: false,
      data: null,
      message: `No registered customer account found for WhatsApp number: ${whatsappNumber}`,
      requiresHumanIntervention: true,
    };
  }

  /**
   * Searches the product catalog by term or SKU
   */
  public async searchProducts(query: string): Promise<AIServiceResponse<Product[]>> {
    const products = localDb.getProducts({ searchTerm: query });
    return { success: true, data: products };
  }

  /**
   * Fetches product details by ID or SKU
   */
  public async getProductDetails(productIdOrSku: string): Promise<AIServiceResponse<Product | null>> {
    const product = localDb.getProductById(productIdOrSku) || localDb.getProductBySku(productIdOrSku);
    if (product) {
      return { success: true, data: product };
    }
    return { success: false, data: null, message: 'Product not found in catalog.' };
  }

  /**
   * Fetches customer's historical purchasing catalog
   */
  public async getCustomerHistory(customerId: string): Promise<AIServiceResponse<CustomerProductHistory[]>> {
    const history = localDb.getCustomerProductHistory(customerId);
    return { success: true, data: history };
  }

  /**
   * Checks current stock availability for a product (Available vs Out of Stock)
   */
  public async checkProductAvailability(productId: string): Promise<AIServiceResponse<{ isAvailable: boolean; status: string; notes?: string }>> {
    const product = localDb.getProductById(productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    const isAvailable = product.availability_status === 'available';
    return {
      success: true,
      data: {
        isAvailable,
        status: product.availability_status,
        notes: product.availability_notes || undefined,
      },
    };
  }

  /**
   * Proposes an order request for human agent review. Does NOT auto-place or dispatch orders.
   */
  public async createOrderRequest(
    customerId: string,
    items: AIOrderProposalItem[],
    notes?: string
  ): Promise<AIServiceResponse<{ proposalId: string; status: string }>> {
    const customer = localDb.getCustomerById(customerId);
    if (!customer) {
      return { success: false, message: 'Invalid customer ID for order proposal.' };
    }

    // In future, this creates a draft order in 'order_received' status for human sales agent confirmation
    const proposalId = `PROP-AI-${Date.now()}`;
    return {
      success: true,
      data: {
        proposalId,
        status: 'pending_customer_and_human_confirmation',
      },
      message: `Draft order proposal created for ${customer.company_name} with ${items.length} items. Awaiting confirmation.`,
    };
  }

  /**
   * Escalates conversation to a human support agent by creating a CRM Customer Query
   */
  public async createCustomerQuery(
    customerId: string,
    issueDescription: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<AIServiceResponse<CustomerQuery>> {
    const customer = localDb.getCustomerById(customerId);
    if (!customer) {
      return { success: false, message: 'Customer account not found for query creation.' };
    }

    const categories = localDb.getCategories();
    const defaultCat = categories[0]?.id || '00000000-0000-0000-0001-000000000001';

    const query = localDb.createQuery({
      customer_id: customerId,
      subject: `WhatsApp Bot Escalation — ${customer.company_name}`,
      description: issueDescription,
      category_id: defaultCat,
      priority,
    }, 'system_ai');

    return {
      success: true,
      data: query,
      message: `Escalated to human support agent. Created query ${query.query_number}.`,
      requiresHumanIntervention: true,
    };
  }
}

export const aiService = new AIService();
