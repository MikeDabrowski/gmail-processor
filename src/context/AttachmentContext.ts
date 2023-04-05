import { AttachmentActions } from "../actions/AttachmentActions"
import { AttachmentConfig } from "../config/AttachmentConfig"
import { MessageContext } from "./MessageContext"

export class AttachmentContext extends MessageContext {
  public attachmentActions = new AttachmentActions()
  constructor(
    public messageContext: MessageContext,
    public attachmentConfig: AttachmentConfig,
    public attachment: GoogleAppsScript.Gmail.GmailAttachment,
    public attachmentConfigIndex = 0,
    public attachmentIndex = 0,
  ) {
    super(
      messageContext.threadContext,
      messageContext.messageConfig,
      messageContext.message,
    )
  }
}
