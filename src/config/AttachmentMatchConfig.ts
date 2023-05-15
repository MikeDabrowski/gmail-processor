import { instanceToPlain, plainToInstance } from "class-transformer"
import "reflect-metadata"
import { RequiredDeep } from "../utils/UtilityTypes"

/**
 * Represents a config to match a certain GMail attachment
 */
export class AttachmentMatchConfig {
  /**
   * A RegEx matching the content type of the attachment
   */
  contentType? = ".*"
  /**
   * Should regular attachments be included in attachment processing (default: true)
   */
  includeAttachments? = true
  /**
   * Should inline images be included in attachment processing (default: true)
   */
  includeInlineImages? = true
  /**
   * Only include attachments larger than the given size in bytes
   */
  largerThan? = -1
  /**
   * A RegEx matching the name of the attachment
   */
  name? = "(.*)"
  /**
   * Only include attachments smaller than the given size in bytes
   */
  smallerThan? = -1
}

export type RequiredAttachmentMatchConfig = RequiredDeep<AttachmentMatchConfig>

export function jsonToAttachmentMatchConfig(
  json: Record<string, unknown>,
): RequiredAttachmentMatchConfig {
  return plainToInstance(AttachmentMatchConfig, json, {
    exposeDefaultValues: true,
    exposeUnsetFields: false,
  }) as RequiredAttachmentMatchConfig
}

export function attachmentMatchConfigToJson<T = AttachmentMatchConfig>(
  config: T,
  withDefaults = false,
): Record<string, unknown> {
  return instanceToPlain(config, {
    exposeDefaultValues: withDefaults,
  })
}

export function newAttachmentMatchConfig(
  json: Record<string, unknown> = {},
): RequiredAttachmentMatchConfig {
  return jsonToAttachmentMatchConfig(json)
}
