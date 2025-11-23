/**
 * maim_message - API-Server 版本消息类
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

/**
 * 字段名转换函数：将驼峰命名转换为下划线命名
 * 注意：platform字段保持不变，因为在Python版本中就是platform
 */
function camelToSnake(key: string): string {
  if (key === 'platform') {
    return key;
  }
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 字段名转换函数：将下划线命名转换为驼峰命名
 * 用于反序列化时处理输入数据
 */
function snakeToCamel(key: string): string {
  if (key === 'platform') {
    return key;
  }
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

import { Seg, GroupInfo, UserInfo, InfoBase, SenderInfo, ReceiverInfo, FormatInfo, TemplateInfo } from './message-base';

/**
 * 消息维度信息类，包含API密钥和平台标识
 */
export class MessageDim {
  apiKey: string;
  platform: string;

  constructor(apiKey: string, platform: string) {
    this.apiKey = apiKey;
    this.platform = platform;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    // 使用通用转换函数确保所有字段都正确转换为下划线命名
    Object.keys(this).forEach(key => {
      if (this[key as keyof this] !== undefined) {
        result[camelToSnake(key)] = this[key as keyof this];
      }
    });

    return result;
  }

  /**
   * 从字典创建MessageDim实例
   */
  static fromDict(data: Record<string, any>): MessageDim {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      normalizedData[snakeToCamel(key)] = data[key];
    }

    const requiredFields = ['apiKey', 'platform'];
    for (const field of requiredFields) {
      if (!normalizedData[field]) {
        throw new Error(`MessageDim requires ${field}`);
      }
    }

    return new MessageDim(normalizedData.apiKey, normalizedData.platform);
  }
}

/**
 * API-Server 版本消息信息类
 */
export class APIBaseMessageInfo {
  platform: string;
  messageId: string;
  time: number;
  formatInfo?: FormatInfo;
  templateInfo?: TemplateInfo;
  additionalConfig?: Record<string, any>;
  senderInfo?: SenderInfo;
  receiverInfo?: ReceiverInfo;

  constructor(
    platform: string,
    messageId: string,
    time: number,
    formatInfo?: FormatInfo,
    templateInfo?: TemplateInfo,
    additionalConfig?: Record<string, any>,
    senderInfo?: SenderInfo,
    receiverInfo?: ReceiverInfo,
  ) {
    this.platform = platform;
    this.messageId = messageId;
    this.time = time;
    this.formatInfo = formatInfo;
    this.templateInfo = templateInfo;
    this.additionalConfig = additionalConfig;
    this.senderInfo = senderInfo;
    this.receiverInfo = receiverInfo;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    // 使用通用转换函数确保所有字段都正确转换为下划线命名
    Object.keys(this).forEach(key => {
      const value = this[key as keyof this];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && 'toDict' in value && typeof value.toDict === 'function') {
          // 对于有toDict方法的对象，递归调用
          result[camelToSnake(key)] = (value as any).toDict();
        } else {
          // 对于基本类型，直接赋值
          result[camelToSnake(key)] = value;
        }
      }
    });

    return result;
  }

  /**
   * 从字典创建APIBaseMessageInfo实例
   */
  static fromDict(data: Record<string, any>): APIBaseMessageInfo {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名，以便统一处理
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      normalizedData[snakeToCamel(key)] = data[key];
    }

    // 验证必需字段（使用驼峰命名进行验证）
    const requiredFields = ['platform', 'messageId', 'time'];
    for (const field of requiredFields) {
      if (normalizedData[snakeToCamel(field)] === null || normalizedData[snakeToCamel(field)] === undefined) {
        throw new Error(`BaseMessageInfo requires ${field}`);
      }
    }

    const formatInfo = normalizedData.formatInfo ? FormatInfo.fromDict(normalizedData.formatInfo) : undefined;
    const templateInfo = normalizedData.templateInfo ? TemplateInfo.fromDict(normalizedData.templateInfo) : undefined;
    const senderInfo = normalizedData.senderInfo ? SenderInfo.fromDict(normalizedData.senderInfo) : undefined;
    const receiverInfo = normalizedData.receiverInfo ? ReceiverInfo.fromDict(normalizedData.receiverInfo) : undefined;

    return new APIBaseMessageInfo(
      normalizedData.platform,
      normalizedData.messageId,
      normalizedData.time,
      formatInfo,
      templateInfo,
      normalizedData.additionalConfig,
      senderInfo,
      receiverInfo,
    );
  }
}

/**
 * API-Server Version消息类，基于双事件循环架构优化
 */
export class APIMessageBase {
  messageInfo: APIBaseMessageInfo;
  messageSegment: Seg;
  messageDim: MessageDim;

  constructor(messageInfo: APIBaseMessageInfo, messageSegment: Seg, messageDim: MessageDim) {
    this.messageInfo = messageInfo;
    this.messageSegment = messageSegment;
    this.messageDim = messageDim;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    return {
      message_info: this.messageInfo.toDict(),
      message_segment: this.messageSegment.toDict(),
      message_dim: this.messageDim.toDict(),
    };
  }

  /**
   * 从字典创建APIMessageBase实例
   */
  static fromDict(data: Record<string, any>): APIMessageBase {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名，以便统一处理
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      normalizedData[snakeToCamel(key)] = data[key];
    }

    // 验证必需字段（使用驼峰命名进行验证）
    const requiredFields = ['messageInfo', 'messageSegment', 'messageDim'];
    for (const field of requiredFields) {
      if (!normalizedData[field]) {
        throw new Error(`APIMessageBase requires ${field}`);
      }
    }

    const messageInfo = APIBaseMessageInfo.fromDict(normalizedData.messageInfo);
    const messageSegment = Seg.fromDict(normalizedData.messageSegment);
    const messageDim = MessageDim.fromDict(normalizedData.messageDim);

    return new APIMessageBase(messageInfo, messageSegment, messageDim);
  }

  /**
   * 获取API密钥
   */
  getApiKey(): string {
    return this.messageDim.apiKey;
  }

  /**
   * 获取平台标识
   */
  getPlatform(): string {
    return this.messageDim.platform;
  }

  /**
   * 获取消息平台标识
   */
  getMessagePlatform(): string {
    return this.messageInfo.platform;
  }

  /**
   * 获取消息ID
   */
  getMessageId(): string {
    return this.messageInfo.messageId;
  }

  /**
   * 获取消息时间
   */
  getMessageTime(): number {
    return this.messageInfo.time;
  }

  /**
   * 设置消息维度信息
   */
  setMessageDim(apiKey: string, platform: string): void {
    this.messageDim.apiKey = apiKey;
    this.messageDim.platform = platform;
  }

  /**
   * 检查是否有发送者信息
   */
  hasSenderInfo(): boolean {
    return this.messageInfo.senderInfo !== undefined;
  }

  /**
   * 检查是否有接收者信息
   */
  hasReceiverInfo(): boolean {
    return this.messageInfo.receiverInfo !== undefined;
  }
}

// 导出所有相关类
export { Seg, GroupInfo, UserInfo, InfoBase, SenderInfo, ReceiverInfo, FormatInfo, TemplateInfo };
