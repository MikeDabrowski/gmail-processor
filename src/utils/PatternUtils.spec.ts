import { MockFactory } from "../../test/mocks/MockFactory"
import { MessageConfig } from "../config/MessageConfig"
import { PatternUtil } from "./PatternUtil"
import { plainToClass } from "class-transformer"
import { AttachmentConfig } from "../config/AttachmentConfig"
import { Config } from "../config/Config"
import { ThreadContext } from "../context/ThreadContext"
import { MessageContext } from "../context/MessageContext"
import { AttachmentContext } from "../context/AttachmentContext"

function getMocks(dryRun = true, config = new Config()) {
  const mocks = MockFactory.newMocks(config, dryRun)
  const threadContext = new ThreadContext(
    mocks.processingContext,
    MockFactory.newDefaultThreadConfig(),
    mocks.thread,
  )
  const messageContext = new MessageContext(
    threadContext,
    MockFactory.newDefaultMessageConfig(),
    mocks.message,
  )
  const attachmentContext = new AttachmentContext(
    messageContext,
    new AttachmentConfig(),
    mocks.attachment,
  )
  return {
    mocks,
    threadContext,
    messageContext,
    attachmentContext,
  }
}

describe("Pattern Substitution", () => {
  it("should handle a thread", () => {
    const thread1 = MockFactory.newThreadMock({
      messages: [
        {
          date: new Date("2018-05-27T12:34:56Z"),
          from: "msgFrom",
          id: "msgId",
          subject: "msgSubject",
          to: "msgTo",
          attachments: [
            {
              contentType: "attContentType0",
              name: "attName0",
            },
            {
              contentType: "attContentType1",
              name: "attName1",
            },
          ],
        },
      ],
    })
    const s1 = PatternUtil.substituteFromAttachmentContext(
      "${message.from}/${message.to}/${attachment.contentType}/${message.subject}-${message.id}-" +
        "${attachment.index}-${attachment.name}-${message.date:dateformat:YYYY-MM-DD}",
      MockFactory.newAttachmentContext(thread1),
    )
    expect(s1).toBe(
      "msgFrom/msgTo/attContentType0/msgSubject-msgId-1-attName0-2018-05-27",
    )
  })
  it("should handle a thread with a message rule", () => {
    const thread2 = MockFactory.newThreadMock({
      messages: [
        {
          subject: "Message 01: Some more text",
          from: "some.email@example.com",
          to: "my.email+emailsuffix@example.com",
          date: new Date("2019-05-01T18:48:31Z"),
          attachments: [
            {
              name: "attachment123.jpg",
            },
          ],
        },
      ],
    })
    const pattern =
      "Evaluation data: message.subject: ${message.subject}, message.from: ${message.from}, " +
      "message.to: ${message.to}, message.date: ${message.date:dateformat:YYYY-MM-DD_HH-mm-ss}, " +
      "message.subject.match.1: ${message.subject.match.1}, message.subject.match.2: " +
      "${message.subject.match.2}"
    const expRslt =
      "Evaluation data: message.subject: Message 01: Some more text, " +
      "message.from: some.email@example.com, message.to: my.email+emailsuffix@example.com, " +
      "message.date: 2019-05-01_18-48-31, message.subject.match.1: 01, " +
      "message.subject.match.2: Some more text"
    const rule = plainToClass(MessageConfig, {
      match: {
        from: "(.+)@example.com",
        subject: "Message ([0-9]+): (.*)",
        to: "my\\.email\\+(.+)@example.com",
      },
      handler: [
        {
          type: "attachments",
          match: { name: "attachment([0-9]+)\\.jpg" },
          actions: [
            {
              name: "storeAttachment",
              args: {
                location:
                  "Folder2/Subfolder2/${message.subject.match.1}/${message.subject} - " +
                  "${attachment.name.match.1}.jpg",
                conflictStrategy: "replace",
              },
            },
          ],
        },
      ],
    })
    const s2 = PatternUtil.substituteFromAttachmentContext(
      pattern,
      MockFactory.newAttachmentContext(
        thread2,
        0,
        0,
        0,
        new AttachmentConfig(),
        rule,
      ),
    )
    expect(s2).toBe(expRslt)
  })
  const sharedThread = MockFactory.newThreadMock({
    messages: [
      {
        date: new Date("2018-05-27T12:34:56Z"),
        from: "msgFrom",
        id: "msgId",
        subject: "msgSubject",
        to: "msgTo",
        attachments: [
          {
            contentType: "attContentType1",
            name: "attName1",
          },
          {
            contentType: "attContentType2",
            name: "attName2",
          },
        ],
      },
    ],
  })

  it("should handle a thread with one message", () => {
    const s = PatternUtil.substituteFromMessageContext(
      "${message.from},${message.to},${message.subject}," +
        "${message.id},${message.date:dateformat:YYYY-MM-DD}",
      MockFactory.newMessageContext(sharedThread),
    )
    expect(s).toBe("msgFrom,msgTo,msgSubject,msgId,2018-05-27")
  })

  it("should substitute all thread attributes", () => {
    const thread = MockFactory.newThreadMock()
    const s = PatternUtil.substituteFromThreadContext(
      "${thread.firstMessageSubject}," +
        "${thread.hasStarredMessages},${thread.id},${thread.isImportant},${thread.isInPriorityInbox}," +
        "${thread.labels},${thread.lastMessageDate:dateformat:YYYY-MM-DD},${thread.messageCount}," +
        "${thread.permalink}",
      MockFactory.newMessageContext(thread),
    )
    expect(s).toBe(
      "message subject,false,threadId123,false,false,,2019-05-02,2,some-permalink-url",
    )
  })

  it("should handle a thread with one message and attachment 1 of 2", () => {
    const s = PatternUtil.substituteFromAttachmentContext(
      "${message.from}/${message.to}/${attachment.contentType}" +
        "/${message.subject}-${message.id}-${attachment.index}-${attachment.name}-" +
        "${message.date:dateformat:YYYY-MM-DD}",
      MockFactory.newAttachmentContext(sharedThread, 0, 0, 0),
    )
    expect(s).toBe(
      "msgFrom/msgTo/attContentType1/msgSubject-msgId-1-attName1-2018-05-27",
    )
  })

  it("should substitute advanced message + attachment pattern", () => {
    const s = PatternUtil.substituteFromAttachmentContext(
      "${message.from}/${message.to}/${attachment.contentType}" +
        "/${message.subject}-${message.id}-${attachment.index}-${attachment.name}-" +
        "${message.date:dateformat:YYYY-MM-DD}",
      MockFactory.newAttachmentContext(sharedThread, 0, 0, 1),
    )
    expect(s).toBe(
      "msgFrom/msgTo/attContentType2/msgSubject-msgId-2-attName2-2018-05-27",
    )
  })

  it("should substitute mixed message + attachment pattern", () => {
    const s = PatternUtil.substituteFromAttachmentContext(
      "${message.from}/${message.to}/${attachment.contentType}/" +
        "${message.subject}-${message.id}-${attachment.index}-${attachment.name}-" +
        "${message.date:dateformat:YYYY-MM-DD}",
      MockFactory.newAttachmentContext(sharedThread),
    )
    expect(s).toBe(
      "msgFrom/msgTo/attContentType1/msgSubject-msgId-1-attName1-2018-05-27",
    )
  })
})
describe("Substitutions", () => {
  it("should substitute all thread attributes", () => {
    expect(
      PatternUtil.substituteFromThreadContext(
        "${thread.firstMessageSubject},${thread.hasStarredMessages}," +
          "${thread.id},${thread.isImportant},${thread.isInPriorityInbox},${thread.labels}," +
          "${thread.lastMessageDate:dateformat:YYYY-MM-DD HH:mm:ss},${thread.messageCount},${thread.permalink}",
        MockFactory.newThreadContext(
          MockFactory.newThreadMock({
            firstMessageSubject: "tfms",
            hasStarredMessages: true,
            id: "tid",
            isImportant: true,
            isInPriorityInbox: true,
            labels: ["l1", "l2"],
            lastMessageDate: new Date("2019-05-06T12:34:56Z"),
            messageCount: 3,
            permalink: "tpl",
          }),
        ),
      ),
    ).toBe("tfms,true,tid,true,true,l1,l2,2019-05-06 12:34:56,3,tpl")
  })
  it("should substitute all message attributes", () => {
    expect(
      PatternUtil.substituteFromMessageContext(
        "${message.bcc},${message.cc},${message.date:dateformat:YYYY-MM-DD HH:mm:ss},${message.from}," +
          "${message.id},${message.replyTo},${message.subject},${message.to}",
        MockFactory.newMessageContext(
          MockFactory.newThreadMock({
            messages: [
              {
                bcc: "mbcc",
                cc: "mcc",
                date: new Date("2019-05-06T12:34:56Z"),
                from: "mfrom",
                id: "mid",
                replyTo: "mrt",
                subject: "msj",
                to: "mto",
              },
            ],
          }),
        ),
      ),
    ).toBe("mbcc,mcc,2019-05-06 12:34:56,mfrom,mid,mrt,msj,mto")
  })
  it("should substitute all attachment attributes", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(
          MockFactory.newThreadMock({
            messages: [
              {
                attachments: [
                  {
                    contentType: "act",
                    hash: "ah",
                    isGoogleType: true,
                    name: "aname",
                    size: 12345,
                  },
                ],
              },
            ],
          }),
        ),
      ),
    ).toBe("act,ah,true,aname,12345")
  })
})
describe("Handle single messages", () => {
  it("should handle a thread with one message and no attachments", () => {
    const { threadContext } = getMocks()
    expect(PatternUtil.substituteFromThreadContext("", threadContext)).toBe("")
  })
  it("should handle a thread with one message and one attachment", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${thread.firstMessageSubject},${thread.hasStarredMessages},${thread.id},${thread.isImportant}," +
          "${thread.isInPriorityInbox},${thread.labels},${thread.lastMessageDate:dateformat:YYYY-MM-DD " +
          "HH:mm:ss},${thread.messageCount},${thread.permalink}," +
          "${message.bcc},${message.cc},${message.date:dateformat:YYYY-MM-DD HH:mm:ss},${message.from}," +
          "${message.id},${message.replyTo},${message.subject},${message.to}," +
          "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(
          MockFactory.newThreadMock({
            firstMessageSubject: "tfms",
            hasStarredMessages: true,
            id: "tid",
            isImportant: true,
            isInPriorityInbox: true,
            labels: ["l1", "l2"],
            lastMessageDate: new Date("2019-05-06T12:34:56Z"),
            messageCount: 3,
            permalink: "tpl",
            messages: [
              {
                bcc: "mbcc",
                cc: "mcc",
                date: new Date("2019-05-06T12:34:56Z"),
                from: "mfrom",
                id: "mid",
                replyTo: "mrt",
                subject: "msj",
                to: "mto",
                attachments: [
                  {
                    contentType: "act",
                    hash: "ah",
                    isGoogleType: true,
                    name: "aname",
                    size: 12345,
                  },
                ],
              },
            ],
          }),
        ),
      ),
    ).toBe(
      "tfms,true,tid,true,true,l1,l2,2019-05-06 12:34:56,3,tpl," +
        "mbcc,mcc,2019-05-06 12:34:56,mfrom,mid,mrt,msj,mto," +
        "act,ah,true,aname,12345",
    )
  })
})
describe("Handle multiple attachments", () => {
  const thread = MockFactory.newThreadMock({
    messages: [
      {
        attachments: [
          {
            contentType: "act1",
            hash: "ah1",
            isGoogleType: true,
            name: "aname1",
            size: 12345,
          },
          {
            contentType: "act2",
            hash: "ah2",
            isGoogleType: false,
            name: "aname2",
            size: 23456,
          },
        ],
      },
    ],
  })
  it("should handle a thread with one message and attachment 1 of 2", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(thread),
      ),
    ).toBe("act1,ah1,true,aname1,12345")
  })
  it("should handle a thread with one message and attachment 2 of 2", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(thread, 0, 0, 1),
      ),
    ).toBe("act2,ah2,false,aname2,23456")
  })
})
describe("Handle multiple messages", () => {
  const thread = MockFactory.newThreadMock({
    firstMessageSubject: "tfms",
    hasStarredMessages: true,
    id: "tid",
    isImportant: true,
    isInPriorityInbox: true,
    labels: ["l1", "l2"],
    lastMessageDate: new Date("2019-05-06T12:34:56Z"),
    messageCount: 3,
    permalink: "tpl",
    messages: [
      {
        bcc: "mbcc1",
        cc: "mcc1",
        date: new Date("2019-05-06T01:23:45Z"),
        from: "mfrom1",
        id: "mid1",
        replyTo: "mrt1",
        subject: "msj1",
        to: "mto1",
        attachments: [
          {
            contentType: "act1",
            hash: "ah1",
            isGoogleType: true,
            name: "aname1",
            size: 12345,
          },
        ],
      },
      {
        bcc: "mbcc2",
        cc: "mcc2",
        date: new Date("2019-05-06T12:34:56Z"),
        from: "mfrom2",
        id: "mid2",
        replyTo: "mrt2",
        subject: "msj2",
        to: "mto2",
        attachments: [
          {
            contentType: "act2",
            hash: "ah2",
            isGoogleType: false,
            name: "aname2",
            size: 23456,
          },
        ],
      },
    ],
  })
  it("should handle a thread with message 1 of 2 and one attachment", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${thread.firstMessageSubject},${thread.hasStarredMessages},${thread.id},${thread.isImportant}," +
          "${thread.isInPriorityInbox},${thread.labels},${thread.lastMessageDate:dateformat:YYYY-MM-DD " +
          "HH:mm:ss},${thread.messageCount},${thread.permalink}," +
          "${message.bcc},${message.cc},${message.date:dateformat:YYYY-MM-DD HH:mm:ss},${message.from}," +
          "${message.id},${message.replyTo},${message.subject},${message.to}," +
          "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(thread),
      ),
    ).toBe(
      "tfms,true,tid,true,true,l1,l2,2019-05-06 12:34:56,3,tpl," +
        "mbcc1,mcc1,2019-05-06 01:23:45,mfrom1,mid1,mrt1,msj1,mto1," +
        "act1,ah1,true,aname1,12345",
    )
  })
  it("should handle a thread with message 2 of 2 and one attachment", () => {
    expect(
      PatternUtil.substituteFromAttachmentContext(
        "${thread.firstMessageSubject},${thread.hasStarredMessages},${thread.id},${thread.isImportant}," +
          "${thread.isInPriorityInbox},${thread.labels},${thread.lastMessageDate:dateformat:YYYY-MM-DD " +
          "HH:mm:ss},${thread.messageCount},${thread.permalink}," +
          "${message.bcc},${message.cc},${message.date:dateformat:YYYY-MM-DD HH:mm:ss},${message.from}," +
          "${message.id},${message.replyTo},${message.subject},${message.to}," +
          "${attachment.contentType},${attachment.hash},${attachment.isGoogleType},${attachment.name}," +
          "${attachment.size}",
        MockFactory.newAttachmentContext(thread, 0, 1),
      ),
    ).toBe(
      "tfms,true,tid,true,true,l1,l2,2019-05-06 12:34:56,3,tpl," +
        "mbcc2,mcc2,2019-05-06 12:34:56,mfrom2,mid2,mrt2,msj2,mto2," +
        "act2,ah2,false,aname2,23456",
    )
  })
})
describe("Matching", () => {
  test.todo("should handle a thread with matched messages")
  test.todo("should handle a thread with one message and matched attachments")
})
describe("Compatibility", () => {
  it("should support old date format", () => {
    expect(PatternUtil.convertDateFormat("yyyy-MM-dd HH-mm-ss")).toBe(
      "YYYY-MM-DD HH-mm-ss",
    )
  })
  it("should support old filename pattern (type: 'string'format'string')", () => {
    expect(
      PatternUtil.convertFromV1Pattern(
        "'file-'yyyy-MM-dd-'%s.txt'",
        "message.date",
      ),
    ).toBe("file-${message.date:dateformat:YYYY-MM-DD-}${message.subject}.txt")
  })
  it("should support old filename pattern (type: 'string'format)", () => {
    expect(
      PatternUtil.convertFromV1Pattern("'file-'yyyy-MM-dd", "message.date"),
    ).toBe("file-${message.date:dateformat:YYYY-MM-DD}")
  })
  it("should support old filename pattern (type: format'string')", () => {
    expect(
      PatternUtil.convertFromV1Pattern("yyyy-MM-dd'-%s.txt'", "message.date"),
    ).toBe("${message.date:dateformat:YYYY-MM-DD}-${message.subject}.txt")
  })
  it("should support old filename pattern (type: format)", () => {
    expect(PatternUtil.convertFromV1Pattern("yyyy-MM-dd", "message.date")).toBe(
      "${message.date:dateformat:YYYY-MM-DD}",
    )
  })
  it("should support old filename pattern (type: 'string')", () => {
    expect(PatternUtil.convertFromV1Pattern("'%s.txt'", "message.date")).toBe(
      "${message.subject}.txt",
    )
  })
  it("should support all old filename substitution parameters (type: '%s','%o','%filename','#SUBJECT#','#FILE#',yyyy-mm-dd)", () => {
    expect(
      PatternUtil.convertFromV1Pattern(
        "'%s,%o,%filename,#SUBJECT#,#FILE#,'yyyy-MM-dd",
        "message.date",
      ),
    ).toBe(
      "${message.subject},${attachment.name},${attachment.name},${message.subject},${attachment.name},${message.date:dateformat:YYYY-MM-DD}",
    )
  })
})
describe("Timezone Handling", () => {
  it("should handle UTC dates and format as UTC", () => {
    expect(
      PatternUtil.formatDate(
        new Date("2022-07-30T16:26:00Z"),
        "YYYY MM DD HH mm ss",
        "UTC",
      ),
    ).toBe("2022 07 30 16 26 00")
  })
  it("should handle UTC dates and format as other timezone", () => {
    expect(
      PatternUtil.formatDate(
        new Date("2022-07-30T16:26:00Z"),
        "YYYY MM DD HH mm ss",
        "Europe/Vienna",
      ),
    ).toBe("2022 07 30 18 26 00")
  })
  it("should handle dates in other timezones and format as UTC", () => {
    expect(
      PatternUtil.formatDate(
        new Date("2022-07-30T18:26:00+02:00"),
        "YYYY MM DD HH mm ss",
        "UTC",
      ),
    ).toBe("2022 07 30 16 26 00")
  })
  it("should handle dates in other timezones and format as the same other timezone", () => {
    expect(
      PatternUtil.formatDate(
        new Date("2022-07-30T18:26:00+02:00"),
        "YYYY MM DD HH mm ss",
        "Europe/Vienna",
      ),
    ).toBe("2022 07 30 18 26 00")
  })
  it("should handle dates in other timezones and format as yet another timezone", () => {
    expect(
      PatternUtil.formatDate(
        new Date("2022-07-30T18:26:00+02:00"),
        "YYYY MM DD HH mm ss",
        "America/New_York",
      ),
    ).toBe("2022 07 30 12 26 00")
  })
})
