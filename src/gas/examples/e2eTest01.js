import EnvContext from "../../lib/Context"
import * as GmailProcessorLib from "../../lib/index"

/**
 * This is a special configuration used for end-to-end testing using the emails generated by `e2eInit.js`.
 * @type {GmailProcessorLib.Config}
 */
export const e2eTest01Config = {
  description: "End-to-end (E2E) test configuration",
  settings: {
    logSheetLocation:
      "/GmailProcessor-Tests/logsheet-${date.now:date::yyyy-MM}",
    markProcessedMethod:
      GmailProcessorLib.MarkProcessedMethod.MARK_MESSAGE_READ,
    maxBatchSize: 10,
    maxRuntime: 280,
    sleepTimeThreads: 100,
    sleepTimeMessages: 0,
    sleepTimeAttachments: 0,
  },
  global: {
    thread: {
      match: {
        query: "has:attachment -in:trash -in:drafts -in:spam after:2023-06-19",
        maxMessageCount: -1,
        minMessageCount: 1,
      },
      actions: [],
    },
  },
  threads: [
    {
      actions: [
        {
          name: "global.log",
          args: {
            message: "A log message for the matched thread.",
            level: "info",
          },
        },
        {
          name: "global.sheetLog",
          args: {
            message: "A sheetLog message for the matched thread.",
            level: "info",
          },
        },
      ],
      match: {
        query:
          "from:${user.email} to:${user.email} subject:'GmailProcessor-Test'",
      },
      messages: [
        {
          attachments: [
            {
              match: { name: "^(?<basename>.+).png$" },
              actions: [
                {
                  name: "global.sheetLog",
                  args: {
                    message:
                      "A sheetLog message for the matched message (pre).",
                    level: "info",
                  },
                  processingStage: GmailProcessorLib.ProcessingStage.PRE_MAIN,
                },
                {
                  name: "attachment.store",
                  args: {
                    location:
                      "/GmailProcessor-Tests/e2e01/${attachment.name.match.basename}-stored.png",
                    conflictStrategy: "keep",
                  },
                },
                {
                  name: "global.log",
                  args: {
                    message: "A log message for the matched attachment.",
                    level: "info",
                  },
                },
                {
                  name: "global.sheetLog",
                  args: {
                    message: "A sheetLog message for the matched attachment.",
                    level: "info",
                  },
                },
              ],
            },
            {
              match: { name: "^(?<basename>.+).txt$" },
              actions: [
                {
                  name: "attachment.store",
                  args: {
                    location:
                      "/GmailProcessor-Tests/e2e01/${attachment.name.match.basename}-stored.txt",
                    conflictStrategy: "keep",
                  },
                },
              ],
            },
          ],
          actions: [
            {
              name: "global.sheetLog",
              args: {
                message:
                  "A sheetLog message for the matched message (post-main stage).",
                level: "info",
              },
              processingStage: GmailProcessorLib.ProcessingStage.POST_MAIN,
            },
            {
              name: "global.sheetLog",
              args: {
                message:
                  "A sheetLog message for the matched message (main stage).",
                level: "info",
              },
              processingStage: GmailProcessorLib.ProcessingStage.MAIN,
            },
            {
              name: "global.sheetLog",
              args: {
                message:
                  "A sheetLog message for the matched message (pre-main stage).",
                level: "info",
              },
              processingStage: GmailProcessorLib.ProcessingStage.PRE_MAIN,
            },
          ],
        },
      ],
    },
  ],
}

/**
 * Run Gmail Processor with config
 * @param {GoogleAppsScript.Events.TimeDriven | undefined} evt Event information
 * @param {EnvContext | undefined} ctx Environment context
 * @returns {GmailProcessorLib.ProcessingResult} Processing result
 */
export function e2eTest01Run(_evt, ctx) {
  return GmailProcessorLib.run(
    e2eTest01Config,
    GmailProcessorLib.RunMode.DRY_RUN,
    ctx,
  )
}
