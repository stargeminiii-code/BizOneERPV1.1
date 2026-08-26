import {
  TransactionRecord,
  DailyTransactionConfig,
  TransactionDashboardResponse,
  TransactionAuditEntry,
  TransactionSource
} from '../types';
import { AuthService } from './authService';

/**
 * =========================================================================
 * TRANSACTION ENGINE SERVICE (CLIENT-SIDE ADAPTER)
 * =========================================================================
 * 
 * Single Source of Truth cho toàn bộ giao dịch bán hàng (SALE Transactions).
 * Dashboard, POS, Orders và các kênh Omni-Channel (Shopee, TikTok Shop, Lazada...)
 * đọc và ghi nhận dữ liệu thông qua service này.
 */

export class TransactionEngineService {
  private static getAuthHeaders(): Record<string, string> {
    const token = AuthService.getActiveToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  /**
   * Tạo Idempotency Key duy nhất và an toàn để chống trùng lặp giao dịch
   */
  public static generateIdempotencyKey(source: TransactionSource, orderId?: string): string {
    const cleanSource = (source || 'ERP').toUpperCase();
    const cleanId = orderId ? orderId.trim().replace(/[^a-zA-Z0-9_-]/g, '') : `ORD-${Date.now()}`;
    return `${cleanSource}_${cleanId}_${Date.now().toString(36)}`;
  }

  /**
   * Lấy số liệu tổng hợp Dashboard ngày hôm nay từ Transaction Engine Server
   */
  public static async getDashboardMetrics(): Promise<TransactionDashboardResponse> {
    try {
      const res = await fetch('/api/transactions/dashboard', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return data;
        }
      }
    } catch (e) {
      console.warn('[TransactionEngineService] Error fetching dashboard metrics:', e);
    }

    // Fallback an toàn khi chưa kết nối máy chủ
    const todayStr = new Date().toISOString().substring(0, 10);
    return {
      success: true,
      date: todayStr,
      target: { min: 4, max: 6, today: 5 },
      actual: 0,
      remaining: 5,
      progress: 0,
      status: 'IN_PROGRESS',
      adOpportunity: {
        level: 'HIGH',
        enabled: true,
        reason: 'Cần thêm 5 giao dịch để đạt mục tiêu ngày.'
      },
      metrics: {
        sales: 0,
        revenue: 0,
        confirmed: 0,
        cancelled: 0,
        refunded: 0
      }
    };
  }

  /**
   * Tạo mới một giao dịch bán hàng (SALE Transaction) có kiểm tra Idempotency
   */
  public static async createSaleTransaction(payload: {
    idempotencyKey: string;
    orderId?: string;
    source?: TransactionSource;
    amount?: number;
    currency?: string;
    status?: 'CONFIRMED' | 'PENDING';
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; transaction?: TransactionRecord; isDuplicate?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/transactions/sale', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          source: 'ERP',
          status: 'CONFIRMED',
          currency: 'VND',
          ...payload
        })
      });

      const result = await res.json();
      return result;
    } catch (e: any) {
      console.error('[TransactionEngineService] createSaleTransaction error:', e);
      return {
        success: false,
        error: e?.message || 'Không thể kết nối đến máy chủ Transaction Engine'
      };
    }
  }

  /**
   * Lấy danh sách toàn bộ giao dịch của Tenant
   */
  public static async getTransactions(params?: {
    date?: string;
    status?: string;
    source?: string;
    limit?: number;
  }): Promise<{ success: boolean; transactions: TransactionRecord[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.date) query.set('date', params.date);
      if (params?.status) query.set('status', params.status);
      if (params?.source) query.set('source', params.source);
      if (params?.limit) query.set('limit', String(params.limit));

      const res = await fetch(`/api/transactions?${query.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[TransactionEngineService] getTransactions error:', e);
    }
    return { success: false, transactions: [], total: 0 };
  }

  /**
   * Hủy một giao dịch bán (CONFIRMED -> CANCELLED)
   */
  public static async cancelTransaction(transactionId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi kết nối khi hủy giao dịch' };
    }
  }

  /**
   * Hoàn tiền một giao dịch bán (CONFIRMED -> REFUNDED)
   */
  public static async refundTransaction(transactionId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi kết nối khi hoàn tiền giao dịch' };
    }
  }

  /**
   * Lấy cấu hình mục tiêu giao dịch hàng ngày (Daily Transaction Target Config)
   */
  public static async getConfig(): Promise<{ success: boolean; config: DailyTransactionConfig }> {
    try {
      const res = await fetch('/api/transactions/config', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[TransactionEngineService] getConfig error:', e);
    }
    return {
      success: true,
      config: {
        enabled: true,
        min: 4,
        max: 6,
        maxPerDay: 6,
        adaptiveAdOpportunity: true,
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Lưu cấu hình mục tiêu giao dịch mới (Yêu cầu quyền Admin / Super Admin)
   */
  public static async saveConfig(config: {
    enabled: boolean;
    min: number;
    max: number;
    maxPerDay?: number;
    adaptiveAdOpportunity: boolean;
  }): Promise<{ success: boolean; config?: DailyTransactionConfig; error?: string }> {
    try {
      const res = await fetch('/api/transactions/config', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi kết nối lưu cấu hình' };
    }
  }

  /**
   * Lấy lịch sử kiểm toán giao dịch và cấu hình
   */
  public static async getAuditLogs(): Promise<{ success: boolean; logs: TransactionAuditEntry[] }> {
    try {
      const res = await fetch('/api/transactions/audit', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[TransactionEngineService] getAuditLogs error:', e);
    }
    return { success: false, logs: [] };
  }

  /**
   * Khởi tạo dữ liệu mẫu Demo (nếu cần kiểm thử UI)
   */
  public static async seedDemoTransactions(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const res = await fetch('/api/transactions/seed-demo', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Lỗi nạp dữ liệu demo' };
    }
  }
}
