import { AdOpportunityLevel, AdOpportunitySignal, DailyTransactionConfig } from '../types';

/**
 * =========================================================================
 * AD OPPORTUNITY ENGINE
 * =========================================================================
 * 
 * Logic quy tắc cơ hội quảng cáo (Ad Opportunity Engine):
 * 
 * - Ad Opportunity Engine CHỈ tính toán và tạo tín hiệu / khuyến nghị điều phối
 *   ngân sách quảng cáo đa kênh (Shopee Ads, TikTok Ads, Facebook Ads, Google Ads).
 * - TUYỆT ĐỐI KHÔNG tự động tạo giao dịch SALE hay tăng transaction count.
 * - Single Source of Truth cho giao dịch vẫn luôn là Transaction Engine.
 * 
 * Quy tắc:
 * 1. Nếu actual < target: opportunityLevel = 'HIGH' (Cần tăng cường quảng cáo để đạt chỉ tiêu)
 * 2. Nếu actual >= target và actual < maxPerDay: opportunityLevel = 'NORMAL' (Đã đạt target, duy trì nhịp độ chuẩn)
 * 3. Nếu actual >= maxPerDay: opportunityLevel = 'STOP' (Đạt trần giới hạn tối đa, dừng phân phối thêm)
 */

export class AdOpportunityEngine {
  /**
   * Tính toán tín hiệu cơ hội quảng cáo dựa trên số lượng giao dịch SALE thực tế và Target ngày
   */
  public static calculateOpportunity(
    currentTransactions: number,
    dailyTarget: number,
    maxPerDay: number = dailyTarget,
    configEnabled: boolean = true,
    adaptiveEnabled: boolean = true
  ): AdOpportunitySignal {
    const actual = Math.max(0, currentTransactions || 0);
    const target = Math.max(1, dailyTarget || 1);
    const maxLimit = Math.max(target, maxPerDay || target);

    if (!configEnabled || !adaptiveEnabled) {
      return {
        level: 'NORMAL',
        enabled: false,
        reason: 'Cơ chế tự động điều chỉnh cơ hội quảng cáo đang tạm tắt trong cấu hình.',
        currentTransactions: actual,
        dailyTarget: target,
        maxPerDay: maxLimit
      };
    }

    if (actual < target) {
      const needed = target - actual;
      return {
        level: 'HIGH',
        enabled: true,
        reason: `Cần thêm ${needed} giao dịch để đạt mục tiêu ngày (${actual}/${target}). Khuyến nghị mở rộng ngân sách quảng cáo và tăng tần suất hiển thị.`,
        currentTransactions: actual,
        dailyTarget: target,
        maxPerDay: maxLimit
      };
    }

    if (actual >= maxLimit) {
      return {
        level: 'STOP',
        enabled: true,
        reason: `Đã chạm trần tối đa ${maxLimit} giao dịch/ngày (${actual}/${maxLimit}). Tự động giảm thầu hoặc tạm ngưng chiến dịch để tránh vượt ngân sách.`,
        currentTransactions: actual,
        dailyTarget: target,
        maxPerDay: maxLimit
      };
    }

    // actual >= target && actual < maxLimit
    return {
      level: 'NORMAL',
      enabled: true,
      reason: `Đã hoàn thành mục tiêu ngày (${actual}/${target}). Duy trì chiến dịch ổn định ở mức chi phí tối ưu.`,
      currentTransactions: actual,
      dailyTarget: target,
      maxPerDay: maxLimit
    };
  }

  /**
   * Lấy cấu hình màu sắc, icon và badge đại diện cho từng mức độ cơ hội
   */
  public static getLevelMeta(level: AdOpportunityLevel): {
    label: string;
    description: string;
    badgeClass: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    indicatorColor: string;
  } {
    switch (level) {
      case 'HIGH':
        return {
          label: 'CAO (ĐẨY MẠNH)',
          description: 'Cần tăng tốc độ phân phối và hiển thị để đạt mục tiêu đơn hàng',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
          textClass: 'text-emerald-600 dark:text-emerald-400',
          borderClass: 'border-emerald-200 dark:border-emerald-800/40',
          indicatorColor: '#10B981'
        };
      case 'NORMAL':
        return {
          label: 'CHUẨN (DUY TRÌ)',
          description: 'Mục tiêu ngày đã đạt, duy trì tỷ lệ chuyển đổi hiệu quả',
          badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          bgClass: 'bg-blue-50 dark:bg-blue-950/20',
          textClass: 'text-blue-600 dark:text-blue-400',
          borderClass: 'border-blue-200 dark:border-blue-800/40',
          indicatorColor: '#3B82F6'
        };
      case 'STOP':
        return {
          label: 'DỪNG / GIẢM THẦU',
          description: 'Đã đạt giới hạn tối đa đơn hàng trong ngày, hạn chế lãng phí ngân sách',
          badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
          bgClass: 'bg-amber-50 dark:bg-amber-950/20',
          textClass: 'text-amber-600 dark:text-amber-400',
          borderClass: 'border-amber-200 dark:border-amber-800/40',
          indicatorColor: '#F59E0B'
        };
      default:
        return {
          label: 'KHÔNG XÁC ĐỊNH',
          description: 'Đang tải dữ liệu tín hiệu...',
          badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
          bgClass: 'bg-slate-50',
          textClass: 'text-slate-600',
          borderClass: 'border-slate-200',
          indicatorColor: '#64748B'
        };
    }
  }
}
