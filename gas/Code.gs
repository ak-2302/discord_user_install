// [AI] GAS Webアプリのスクリプトプロパティに次の値を設定してください。
// GAS_SHARED_TOKEN: Workerと共有する長いランダム文字列
// DISCORD_ALLOWED_USER_ID: 利用を許可するDiscordユーザーID

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var properties = PropertiesService.getScriptProperties();
    if (request.token !== properties.getProperty('GAS_SHARED_TOKEN') ||
        request.discordUserId !== properties.getProperty('DISCORD_ALLOWED_USER_ID')) {
      return response({ ok: false, error: 'unauthorized' });
    }
    if (request.action === 'schedule') return response({ ok: true, events: getTodayEvents() });
    if (request.action === 'mail') return response({ ok: true, messages: getUnreadMessages() });
    return response({ ok: false, error: 'unsupported_action' });
  } catch (error) {
    console.error(error);
    return response({ ok: false, error: 'internal_error' });
  }
}

function getTodayEvents() {
  var calendar = CalendarApp.getDefaultCalendar();
  var timezone = Session.getScriptTimeZone() || 'Asia/Tokyo';
  var now = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return calendar.getEvents(start, end).map(function (event) {
    return {
      start: formatDate(event.getStartTime(), timezone),
      end: formatDate(event.getEndTime(), timezone),
      title: event.getTitle(),
      location: event.getLocation() || ''
    };
  });
}

function getUnreadMessages() {
  var timezone = Session.getScriptTimeZone() || 'Asia/Tokyo';
  return GmailApp.search('is:unread', 0, 10).map(function (thread) {
    var message = thread.getMessages()[thread.getMessageCount() - 1];
    return {
      receivedAt: formatDate(message.getDate(), timezone),
      from: message.getFrom(),
      subject: message.getSubject() || '(件名なし)',
      url: 'https://mail.google.com/mail/u/0/#inbox/' + thread.getId()
    };
  });
}

function formatDate(date, timezone) {
  return Utilities.formatDate(date, timezone, 'M/d HH:mm');
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
