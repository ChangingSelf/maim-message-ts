/**
 * maim_message - 消息基础类
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

/**
 * 消息片段类，用于表示消息的不同部分
 *
 * @property type - 片段类型，可以是 'text'、'image'、'seglist' 等
 * @property data - 片段的具体内容
 *   - 对于 text 类型，data 是字符串
 *   - 对于 image 类型，data 是 base64 字符串
 *   - 对于 seglist 类型，data 是 Seg 列表
 */
export class Seg {
  type: string;
  data: string | Seg[];

  constructor(type: string, data: string | Seg[]) {
    this.type = type;
    this.data = data;
  }

  /**
   * 从字典创建Seg实例
   */
  static fromDict(data: Record<string, any>): Seg {
    const type = data.type;
    let segData = data.data;

    if (type === 'seglist' && Array.isArray(segData)) {
      segData = segData.map(seg => Seg.fromDict(seg));
    }

    return new Seg(type, segData);
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = { type: this.type };

    if (this.type === 'seglist' && Array.isArray(this.data)) {
      result.data = this.data.map(seg => seg.toDict());
    } else {
      result.data = this.data;
    }

    return result;
  }
}

/**
 * 群组信息类
 */
export class GroupInfo {
  platform?: string;
  groupId?: string;
  groupName?: string;

  constructor(platform?: string, groupId?: string, groupName?: string) {
    this.platform = platform;
    this.groupId = groupId;
    this.groupName = groupName;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    if (this.platform !== undefined) result.platform = this.platform;
    if (this.groupId !== undefined) result.group_id = this.groupId;
    if (this.groupName !== undefined) result.group_name = this.groupName;

    return result;
  }

  /**
   * 从字典创建GroupInfo实例
   */
  static fromDict(data: Record<string, any> | null | undefined): GroupInfo | null {
    if (!data) {
      return null;
    }

    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    if (normalizedData.group_id === null || normalizedData.group_id === undefined) {
      return null;
    }

    return new GroupInfo(normalizedData.platform, normalizedData.group_id, normalizedData.group_name);
  }
}

/**
 * 用户信息类
 */
export class UserInfo {
  platform?: string;
  userId?: string;
  userNickname?: string;
  userCardname?: string;

  constructor(platform?: string, userId?: string, userNickname?: string, userCardname?: string) {
    this.platform = platform;
    this.userId = userId;
    this.userNickname = userNickname;
    this.userCardname = userCardname;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    if (this.platform !== undefined) result.platform = this.platform;
    if (this.userId !== undefined) result.user_id = this.userId;
    if (this.userNickname !== undefined) result.user_nickname = this.userNickname;
    if (this.userCardname !== undefined) result.user_cardname = this.userCardname;

    return result;
  }

  /**
   * 从字典创建UserInfo实例
   */
  static fromDict(data: Record<string, any> | null | undefined): UserInfo | null {
    if (!data) {
      return null;
    }

    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    return new UserInfo(normalizedData.platform, normalizedData.user_id, normalizedData.user_nickname, normalizedData.user_cardname);
  }
}

/**
 * 信息基类，包含群组和用户信息
 */
export class InfoBase {
  groupInfo?: GroupInfo | null;
  userInfo?: UserInfo | null;

  constructor(groupInfo?: GroupInfo | null, userInfo?: UserInfo | null) {
    this.groupInfo = groupInfo;
    this.userInfo = userInfo;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    if (this.groupInfo !== null && this.groupInfo !== undefined) {
      result.group_info = this.groupInfo.toDict();
    }
    if (this.userInfo !== null && this.userInfo !== undefined) {
      result.user_info = this.userInfo.toDict();
    }

    return result;
  }

  /**
   * 从字典创建InfoBase实例
   */
  static fromDict(data: Record<string, any>): InfoBase {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    const groupInfo = normalizedData.group_info ? GroupInfo.fromDict(normalizedData.group_info) : null;
    const userInfo = normalizedData.user_info ? UserInfo.fromDict(normalizedData.user_info) : null;

    return new InfoBase(groupInfo, userInfo);
  }
}

/**
 * 发送者信息类
 */
export class SenderInfo extends InfoBase {}

/**
 * 接收者信息类
 */
export class ReceiverInfo extends InfoBase {}

/**
 * 格式信息类
 *
 * 目前maimcore可接受的格式为text,image,emoji
 * 可发送的格式为text,emoji,reply
 */
export class FormatInfo {
  contentFormat?: string[];
  acceptFormat?: string[];

  constructor(contentFormat?: string[], acceptFormat?: string[]) {
    this.contentFormat = contentFormat;
    this.acceptFormat = acceptFormat;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    if (this.contentFormat !== undefined) result.content_format = this.contentFormat;
    if (this.acceptFormat !== undefined) result.accept_format = this.acceptFormat;

    return result;
  }

  /**
   * 从字典创建FormatInfo实例
   */
  static fromDict(data: Record<string, any>): FormatInfo {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    return new FormatInfo(normalizedData.content_format, normalizedData.accept_format);
  }
}

/**
 * 模板信息类
 */
export class TemplateInfo {
  templateItems?: Record<string, string>;
  templateName?: Record<string, string>;
  templateDefault: boolean = true;

  constructor(templateItems?: Record<string, string>, templateName?: Record<string, string>, templateDefault: boolean = true) {
    this.templateItems = templateItems;
    this.templateName = templateName;
    this.templateDefault = templateDefault;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {};

    if (this.templateItems !== undefined) result.template_items = this.templateItems;
    if (this.templateName !== undefined) result.template_name = this.templateName;
    result.template_default = this.templateDefault;

    return result;
  }

  /**
   * 从字典创建TemplateInfo实例
   */
  static fromDict(data: Record<string, any>): TemplateInfo {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    return new TemplateInfo(normalizedData.template_items, normalizedData.template_name, normalizedData.template_default !== undefined ? normalizedData.template_default : true);
  }
}

/**
 * 消息信息类
 */
export class BaseMessageInfo {
  platform?: string;
  messageId?: string;
  time?: number;
  groupInfo?: GroupInfo | null;
  userInfo?: UserInfo | null;
  formatInfo?: FormatInfo;
  templateInfo?: TemplateInfo;
  additionalConfig?: Record<string, any>;
  senderInfo?: SenderInfo;
  receiverInfo?: ReceiverInfo;

  constructor(
    platform?: string,
    messageId?: string,
    time?: number,
    groupInfo?: GroupInfo | null,
    userInfo?: UserInfo | null,
    formatInfo?: FormatInfo,
    templateInfo?: TemplateInfo,
    additionalConfig?: Record<string, any>,
    senderInfo?: SenderInfo,
    receiverInfo?: ReceiverInfo,
  ) {
    this.platform = platform;
    this.messageId = messageId;
    this.time = time;
    this.groupInfo = groupInfo;
    this.userInfo = userInfo;
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

    if (this.platform !== undefined) result.platform = this.platform;
    if (this.messageId !== undefined) result.message_id = this.messageId;
    if (this.time !== undefined) result.time = this.time;
    if (this.additionalConfig !== undefined) result.additional_config = this.additionalConfig;

    if (this.groupInfo !== null && this.groupInfo !== undefined) {
      result.group_info = this.groupInfo.toDict();
    }
    if (this.userInfo !== null && this.userInfo !== undefined) {
      result.user_info = this.userInfo.toDict();
    }
    if (this.formatInfo !== undefined) {
      result.format_info = this.formatInfo.toDict();
    }
    if (this.templateInfo !== undefined) {
      result.template_info = this.templateInfo.toDict();
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
   * 从字典创建BaseMessageInfo实例
   */
  static fromDict(data: Record<string, any>): BaseMessageInfo {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    const groupInfo = normalizedData.group_info ? GroupInfo.fromDict(normalizedData.group_info) : null;
    const userInfo = normalizedData.user_info ? UserInfo.fromDict(normalizedData.user_info) : null;
    const formatInfo = normalizedData.format_info ? FormatInfo.fromDict(normalizedData.format_info) : undefined;
    const templateInfo = normalizedData.template_info ? TemplateInfo.fromDict(normalizedData.template_info) : undefined;
    const senderInfo = normalizedData.sender_info ? SenderInfo.fromDict(normalizedData.sender_info) : undefined;
    const receiverInfo = normalizedData.receiver_info ? ReceiverInfo.fromDict(normalizedData.receiver_info) : undefined;

    return new BaseMessageInfo(
      normalizedData.platform,
      normalizedData.message_id,
      normalizedData.time,
      groupInfo,
      userInfo,
      formatInfo,
      templateInfo,
      normalizedData.additional_config,
      senderInfo,
      receiverInfo,
    );
  }
}

/**
 * 消息类
 */
export class MessageBase {
  messageInfo: BaseMessageInfo;
  messageSegment: Seg;
  rawMessage?: string;

  constructor(messageInfo: BaseMessageInfo, messageSegment: Seg, rawMessage?: string) {
    this.messageInfo = messageInfo;
    this.messageSegment = messageSegment;
    this.rawMessage = rawMessage;
  }

  /**
   * 转换为字典格式
   */
  toDict(): Record<string, any> {
    const result: Record<string, any> = {
      message_info: this.messageInfo.toDict(),
      message_segment: this.messageSegment.toDict(),
    };

    if (this.rawMessage !== undefined) {
      result.raw_message = this.rawMessage;
    }

    return result;
  }

  /**
   * 从字典创建MessageBase实例
   */
  static fromDict(data: Record<string, any>): MessageBase {
    // 兼容性处理：将驼峰命名的字段转换为下划线命名
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      normalizedData[snakeKey] = data[key];
    }

    const messageInfo = BaseMessageInfo.fromDict(normalizedData.message_info || {});
    const messageSegment = Seg.fromDict(normalizedData.message_segment || {});
    const rawMessage = normalizedData.raw_message;

    return new MessageBase(messageInfo, messageSegment, rawMessage);
  }
}
