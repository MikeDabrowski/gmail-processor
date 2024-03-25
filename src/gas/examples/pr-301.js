/**
 * This is a special configuration used to initialize example emails for end-to-end testing.
 * @type {GmailProcessorLib.E2EConfig}
 */
const pr301InitConfig = {
  globals: {
    repoBaseUrl:
      "https://raw.githubusercontent.com/ahochsteger/gmail-processor/main/src/e2e-test/files",
    subjectPrefix: "[GmailProcessor-Test] ",
    to: Session.getActiveUser().getEmail(),
  },
  folders: [
    {
      name: "e2e",
      location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/pr-301`,
    },
  ],
  files: [
    {
      name: "pr-301-sample-xlsx",
      type: "url",
      filename: "pr-301-sample.xlsx",
      ref: "https://github.com/ahochsteger/sample-files/raw/main/sample%20office%20files/sample.xlsx",
      destFolder: "e2e",
    },
  ],
  mails: [
    /*
    {
      name: "pr-301-test",
      subject: "Test for PR #301",
      htmlBody: "Test email for PR #301.",
      files: ["sample-xlsx"],
    },
  */
  ],
}

/**
 * Initialize data for end-to-end tests.
 * @param {GoogleAppsScript.Events.TimeDriven} evt Event information
 * @param {EnvContext | undefined} ctx Environment context
 * @returns {GmailProcessorLib.ProcessingResult} Processing result
 */
function pr301Init(_evt, ctx) {
  return GmailProcessorLib.E2E.initAll(
    pr301InitConfig,
    ctx,
    GmailProcessorLib.ConflictStrategy.REPLACE,
  )
}

/**
 * This is a special configuration used for end-to-end testing using the emails generated by `e2eInit.js`.
 * @type {GmailProcessorLib.Config}
 */
const pr301Config = {
  description:
    "Test for PR #301 - fix getBlob error on conflict strategy 'update'",
  settings: {
    logSheetLocation:
      "/GmailProcessor-Tests/logsheet-${date.now:date::yyyy-MM}",
    markProcessedMethod: "mark-read",
    timezone: "UTC",
  },
  global: {
    thread: {
      match: {
        query:
          "has:attachment -in:trash -in:drafts -in:spam after:${date.now:date::yyyy-MM-dd}",
        maxMessageCount: -1,
        minMessageCount: 1,
      },
    },
  },
  threads: [
    {
      match: {
        query:
          "from:${user.email} to:${user.email} subject:'Test with office attachments'",
      },
      attachments: [
        {
          description: "Process *.docx attachment files",
          match: {
            name: "(?<basename>.+)\\.docx$",
          },
          actions: [
            {
              description: "Store original docx file",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name}`,
              },
            },
            {
              description: "Store docx file converted to Google Docs format",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name.match.basename}`,
                toMimeType: "application/vnd.google-apps.document",
              },
            },
          ],
        },
        {
          description: "Process *.pptx attachment files",
          match: {
            name: "(?<basename>.+)\\.pptx$",
          },
          actions: [
            {
              description: "Store original pptx file",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name}`,
              },
            },
            {
              description:
                "Store pptx file converted to Google Presentations format",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name.match.basename}`,
                toMimeType: "application/vnd.google-apps.presentation",
              },
            },
          ],
        },
        {
          description: "Process *.xlsx attachment files",
          match: {
            name: "(?<basename>.+)\\.xlsx$",
          },
          actions: [
            {
              description: "Store original xlsx file",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name}`,
              },
            },
            {
              description:
                "Store xlsx file converted to Google Spreadsheet format",
              name: "attachment.store",
              args: {
                conflictStrategy: GmailProcessorLib.ConflictStrategy.REPLACE,
                location: `${GmailProcessorLib.E2E_DEFAULT_DRIVE_TESTS_BASE_PATH}/\${attachment.name.match.basename}`,
                toMimeType: "application/vnd.google-apps.spreadsheet",
              },
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
function pr301Run(_evt, ctx) {
  /*  return GmailProcessorLib.run(
    pr301Config,
    GmailProcessorLib.RunMode.DANGEROUS,
    ctx,
  )*/
}
