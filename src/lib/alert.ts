/**
 * 告警模块
 * 用于记录和通知关键业务异常
 */
import { redis } from './redis';

// 告警级别
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

// 告警类型
export type AlertType =
  | 'payment_signature_invalid'    // 支付签名验证失败
  | 'payment_amount_mismatch'      // 支付金额不匹配
  | 'payment_order_not_found'      // 支付订单不存在
  | 'payment_duplicate_notify'     // 重复支付通知
  | 'payment_user_not_found'       // 支付用户不存在
  | 'payment_process_error'        // 支付处理异常
  | 'rate_limit_exceeded'          // 速率限制触发
  | 'suspicious_activity';         // 可疑活动

// 告警数据接口
export interface AlertData {
  type: AlertType;
  level: AlertLevel;
  message: string;
  details?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  orderId?: string;
  timestamp: Date;
}

// 告警统计键前缀
const ALERT_COUNT_PREFIX = 'alert:count:';
const ALERT_LOG_PREFIX = 'alert:log:';

/**
 * 发送告警
 * - 记录到日志
 * - 存储到 Redis（用于统计和监控）
 * - 未来可扩展：发送邮件/短信/企业微信等
 */
export async function sendAlert(data: Omit<AlertData, 'timestamp'>): Promise<void> {
  const alert: AlertData = {
    ...data,
    timestamp: new Date(),
  };

  // 1. 记录到控制台日志（生产环境会被日志系统收集）
  const logPrefix = `[ALERT][${alert.level.toUpperCase()}][${alert.type}]`;
  const logMessage = `${logPrefix} ${alert.message}`;

  switch (alert.level) {
    case 'critical':
    case 'error':
      console.error(logMessage, alert.details || '');
      break;
    case 'warning':
      console.warn(logMessage, alert.details || '');
      break;
    default:
      console.log(logMessage, alert.details || '');
  }

  // 2. 存储到 Redis（如果可用）
  if (redis) {
    try {
      // 增加告警计数（按类型和小时统计）
      const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const countKey = `${ALERT_COUNT_PREFIX}${alert.type}:${hourKey}`;
      await redis.incr(countKey);
      await redis.expire(countKey, 86400 * 7); // 保留7天

      // 存储告警详情（最近100条）
      const logKey = `${ALERT_LOG_PREFIX}${alert.type}`;
      await redis.lpush(logKey, JSON.stringify(alert));
      await redis.ltrim(logKey, 0, 99); // 只保留最近100条
      await redis.expire(logKey, 86400 * 7); // 保留7天
    } catch (error) {
      console.error('[Alert] Failed to store alert in Redis:', error);
    }
  }

  // 3. 严重告警可以触发即时通知（预留扩展点）
  if (alert.level === 'critical') {
    await sendCriticalNotification(alert);
  }
}

/**
 * 发送严重告警通知
 * 预留扩展点：可接入企业微信、钉钉、短信等
 */
async function sendCriticalNotification(alert: AlertData): Promise<void> {
  // TODO: 实现即时通知
  // 示例：
  // - 企业微信机器人
  // - 钉钉机器人
  // - 短信通知
  // - 邮件通知
  console.error('[CRITICAL ALERT] 需要立即处理:', alert);
}

/**
 * 获取告警统计
 */
export async function getAlertStats(
  type: AlertType,
  hours: number = 24
): Promise<{ total: number; hourly: Record<string, number> }> {
  if (!redis) {
    return { total: 0, hourly: {} };
  }

  const hourly: Record<string, number> = {};
  let total = 0;

  try {
    const now = new Date();
    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - i * 3600 * 1000);
      const hourKey = date.toISOString().slice(0, 13);
      const countKey = `${ALERT_COUNT_PREFIX}${type}:${hourKey}`;
      const count = parseInt(await redis.get(countKey) || '0', 10);
      hourly[hourKey] = count;
      total += count;
    }
  } catch (error) {
    console.error('[Alert] Failed to get alert stats:', error);
  }

  return { total, hourly };
}

/**
 * 获取最近的告警日志
 */
export async function getRecentAlerts(
  type: AlertType,
  limit: number = 20
): Promise<AlertData[]> {
  if (!redis) {
    return [];
  }

  try {
    const logKey = `${ALERT_LOG_PREFIX}${type}`;
    const logs = await redis.lrange(logKey, 0, limit - 1);
    return logs.map(log => JSON.parse(log) as AlertData);
  } catch (error) {
    console.error('[Alert] Failed to get recent alerts:', error);
    return [];
  }
}

// ============================================================
// 便捷函数：支付相关告警
// ============================================================

/**
 * 支付签名验证失败告警
 */
export function alertPaymentSignatureInvalid(
  orderId: string,
  ip?: string
): Promise<void> {
  return sendAlert({
    type: 'payment_signature_invalid',
    level: 'error',
    message: `支付签名验证失败: ${orderId}`,
    details: { orderId, ip },
    ip,
    orderId,
  });
}

/**
 * 支付金额不匹配告警
 */
export function alertPaymentAmountMismatch(
  orderId: string,
  expectedAmount: number,
  actualAmount: number,
  ip?: string
): Promise<void> {
  return sendAlert({
    type: 'payment_amount_mismatch',
    level: 'critical', // 金额不匹配是严重问题
    message: `支付金额不匹配: ${orderId}, 预期 ${expectedAmount}, 实际 ${actualAmount}`,
    details: { orderId, expectedAmount, actualAmount, ip },
    ip,
    orderId,
  });
}

/**
 * 订单不存在告警
 */
export function alertPaymentOrderNotFound(
  orderId: string,
  ip?: string
): Promise<void> {
  return sendAlert({
    type: 'payment_order_not_found',
    level: 'warning',
    message: `支付订单不存在: ${orderId}`,
    details: { orderId, ip },
    ip,
    orderId,
  });
}

/**
 * 支付处理异常告警
 */
export function alertPaymentProcessError(
  orderId: string,
  error: unknown,
  userId?: string
): Promise<void> {
  return sendAlert({
    type: 'payment_process_error',
    level: 'error',
    message: `支付处理异常: ${orderId}`,
    details: {
      orderId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    },
    userId,
    orderId,
  });
}

/**
 * 速率限制触发告警
 */
export function alertRateLimitExceeded(
  userId: string,
  ip: string,
  endpoint: string
): Promise<void> {
  return sendAlert({
    type: 'rate_limit_exceeded',
    level: 'warning',
    message: `速率限制触发: ${endpoint}`,
    details: { userId, ip, endpoint },
    userId,
    ip,
  });
}
