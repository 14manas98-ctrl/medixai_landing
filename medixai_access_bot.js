const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.ACCESS_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID; // твой Telegram ID

const bot = new TelegramBot(TOKEN, { polling: true });

// Хранилище состояний пользователей
const userState = {};

// Приветствие
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'language' };

  bot.sendMessage(chatId,
    `👋 Сәлем! / Привет!\n\n` +
    `🏥 *Medix AI* — скорой жәрдем бригадалары үшін цифрлық көмекші\n` +
    `🏥 *Medix AI* — цифровой ассистент для бригад скорой помощи\n\n` +
    `Тілді таңдаңыз / Выберите язык:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇰🇿 Қазақша', callback_data: 'lang_kaz' },
            { text: '🇷🇺 Русский', callback_data: 'lang_rus' }
          ]
        ]
      }
    }
  );
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!userState[chatId]) userState[chatId] = {};

  // Выбор языка
  if (data === 'lang_kaz') {
    userState[chatId].lang = 'kaz';
    userState[chatId].step = 'name';
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId,
      `✅ Қазақ тілі таңдалды!\n\n` +
      `Атыңызды жазыңыз 👇`,
      { parse_mode: 'Markdown' }
    );
  }

  else if (data === 'lang_rus') {
    userState[chatId].lang = 'rus';
    userState[chatId].step = 'name';
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId,
      `✅ Выбран русский язык!\n\n` +
      `Напишите ваше имя 👇`,
      { parse_mode: 'Markdown' }
    );
  }

  // Выбор профессии
  else if (data.startsWith('prof_')) {
    const prof = data.replace('prof_', '');
    userState[chatId].profession = prof;
    userState[chatId].step = 'city';
    bot.answerCallbackQuery(query.id);

    const isKaz = userState[chatId].lang === 'kaz';
    bot.sendMessage(chatId,
      isKaz ? `🏙 Қалаңызды жазыңыз 👇` : `🏙 Напишите ваш город 👇`
    );
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;
  if (!userState[chatId]) return;

  const state = userState[chatId];
  const isKaz = state.lang === 'kaz';

  // Шаг: имя
  if (state.step === 'name') {
    userState[chatId].name = text;
    userState[chatId].step = 'profession';

    bot.sendMessage(chatId,
      isKaz
        ? `Сәлем, *${text}*! 👋\n\nМамандығыңызды таңдаңыз:`
        : `Привет, *${text}*! 👋\n\nВыберите вашу профессию:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: isKaz ? '🚑 Фельдшер' : '🚑 Фельдшер', callback_data: 'prof_Фельдшер' },
              { text: isKaz ? '👨‍⚕️ Дәрігер' : '👨‍⚕️ Врач', callback_data: 'prof_Врач' }
            ],
            [
              { text: isKaz ? '🎓 Студент' : '🎓 Студент', callback_data: 'prof_Студент' },
              { text: isKaz ? '👩‍⚕️ Медбике' : '👩‍⚕️ Медсестра', callback_data: 'prof_Медсестра' }
            ]
          ]
        }
      }
    );
  }

  // Шаг: город
  else if (state.step === 'city') {
    userState[chatId].city = text;
    userState[chatId].step = 'done';

    // Сообщение пользователю
    bot.sendMessage(chatId,
      isKaz
        ? `✅ *Өтінішіңіз қабылданды!*\n\n` +
          `⏳ Жақын арада әкімші сізбен байланысады және қолжетімділік береді.\n\n` +
          `🏥 *Medix AI* — СМП бригадаларының сенімді көмекшісі!`
        : `✅ *Заявка принята!*\n\n` +
          `⏳ В ближайшее время администратор свяжется с вами и даст доступ.\n\n` +
          `🏥 *Medix AI* — надёжный помощник бригад СМП!`,
      { parse_mode: 'Markdown' }
    );

    // Уведомление админу
    const adminMsg =
      `🔔 *Новая заявка на Medix AI!*\n\n` +
      `👤 Имя: ${state.name}\n` +
      `💼 Профессия: ${state.profession}\n` +
      `🏙 Город: ${text}\n` +
      `🌐 Язык: ${isKaz ? 'Казахский' : 'Русский'}\n` +
      `📱 Username: @${msg.from.username || 'нет'}\n` +
      `🆔 Chat ID: ${chatId}`;

    bot.sendMessage(ADMIN_ID, adminMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Написать пользователю', url: `https://t.me/${msg.from.username || ''}` }]
        ]
      }
    });
  }
});

console.log('✅ Medix AI Access Bot запущен!');
