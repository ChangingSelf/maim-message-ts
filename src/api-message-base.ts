/**
 * maim_message - API-Server 版本消息类
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

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
    return {
      api_key: this.apiKey,
      platform: this.platform,
    };
  }

  /**
   * 从字典创建MessageDim实例
   */
  static fromDict(data: Record<string, any>): MessageDim {
    const requiredFields = ['api_key', 'platform'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`MessageDim requires ${field}`);
      }
    }

    return new MessageDim(data.api_key, data.platform);
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
    const result: Record<string, any> = {
      platform: this.platform,
      message_id: this.messageId,
      time: this.time,
    };

    if (this.formatInfo !== undefined) {
      result.format_info = this.formatInfo.toDict();
    }
    if (this.templateInfo !== undefined) {
      result.template_info = this.templateInfo.toDict();
    }
    if (this.additionalConfig !== undefined) {
      result.additional_config = this.additionalConfig;
    }
    if (this.senderInfo !== undefined) {
      result.sender_info = this.senderInfo.toDict();
    }
    if (this.receiverInfo !== undefined) {
      result.receiver_info = this.receiverInfo.toDict();
    }

    return result;
  }

  /**
   * 从字典创建APIBaseMessageInfo实例
   */
  static fromDict(data: Record<string, any>): APIBaseMessageInfo {
    // 验证必需字段
    const requiredFields = ['platform', 'message_id', 'time'];
    for (const field of requiredFields) {
      if (data[field] === null || data[field] === undefined) {
        throw new Error(`BaseMessageInfo requires ${field}`);
      }
    }

    const formatInfo = data.format_info ? FormatInfo.fromDict(data.format_info) : undefined;
    const templateInfo = data.template_info ? TemplateInfo.fromDict(data.template_info) : undefined;
    const senderInfo = data.sender_info ? SenderInfo.fromDict(data.sender_info) : undefined;
    const receiverInfo = data.receiver_info ? ReceiverInfo.fromDict(data.receiver_info) : undefined;

    return new APIBaseMessageInfo(
      data.platform,
      data.message_id,
      data.time,
      formatInfo,
      templateInfo,
      data.additional_config,
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
    // 验证必需字段
    const requiredFields = ['message_info', 'message_segment', 'message_dim'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`APIMessageBase requires ${field}`);
      }
    }

    const messageInfo = APIBaseMessageInfo.fromDict(data.message_info);
    const messageSegment = Seg.fromDict(data.message_segment);
    const messageDim = MessageDim.fromDict(data.message_dim);

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
