// [AI] GAS Webアプリのスクリプトプロパティに次の値を設定してください。
// GAS_SHARED_TOKEN: Workerと共有する長いランダム文字列

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var properties = PropertiesService.getScriptProperties();
    if (request.token !== properties.getProperty('GAS_SHARED_TOKEN')) {
      return response({ ok: false, error: 'unauthorized' });
    }
    if (request.action === 'schedule') return response({ ok: true, label: getScheduleLabel(request.date), events: getSchedule(request.date) });
    if (request.action === 'mail') return response({ ok: true, messages: getUnreadMessages() });
    return response({ ok: false, error: 'unsupported_action' });
  } catch (error) {
    console.error(error);
    return response({ ok: false, error: 'internal_error' });
  }
}

function getSchedule(dateOption) {
  var calendar = CalendarApp.getDefaultCalendar();
  var timezone = Session.getScriptTimeZone() || 'Asia/Tokyo';
  var now = new Date();
  var start;
  var end;
  if (dateOption === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateOption))) {
    var parts = String(dateOption).split('-').map(Number);
    start = new Date(parts[0], parts[1] - 1, parts[2]);
    if (start.getFullYear() !== parts[0] || start.getMonth() !== parts[1] - 1 || start.getDate() !== parts[2]) return [];
    end = new Date(parts[0], parts[1] - 1, parts[2] + 1);
  } else {
    var offset = dateOption === 'tomorrow' ? 1 : 0;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }
  return calendar.getEvents(start, end).map(function (event) {
    return {
      start: formatDate(event.getStartTime(), timezone),
      end: formatDate(event.getEndTime(), timezone),
      title: event.getTitle(),
      location: event.getLocation() || ''
    };
  });
}

function getScheduleLabel(dateOption) {
  if (dateOption === 'tomorrow') return '明日';
  if (dateOption === 'this_month') return '今月';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateOption))) return String(dateOption);
  return '今日';
}

function getUnreadMessages() {
  var timezone = Session.getScriptTimeZone() || 'Asia/Tokyo';
  return GmailApp.search('is:unread', 0, 10).map(function (thread) {
    var message = thread.getMessages()[thread.getMessageCount() - 1];
    return {
      receivedAt: formatDate(message.getDate(), timezone),
      sender: extractSenderName(message.getFrom()),
      senderAddress: extractSenderAddress(message.getFrom()),
      subject: message.getSubject() || '(件名なし)',
      body: message.getPlainBody() || '(本文なし)',
      url: 'https://mail.google.com/mail/u/0/#inbox/' + thread.getId()
    };
  });
}

function extractSenderName(from) {
  var match = String(from).match(/^\s*(.*?)\s*<[^>]+>\s*$/);
  return match ? (match[1].replace(/^"|"$/g, '') || extractSenderAddress(from)) : String(from);
}

function extractSenderAddress(from) {
  var match = String(from).match(/<([^>]+)>/);
  return match ? match[1] : String(from).trim();
}

function formatDate(date, timezone) {
  return Utilities.formatDate(date, timezone, 'M/d HH:mm');
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
