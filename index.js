const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

// Реєструємо військове розширення
shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());

app.post('/api/decline', async (req, res) => {
  try {
    const { type, text, caseName, gender } = req.body;
    if (!text) return res.status(400).json({ error: "Параметр text є обов'язковим" });

    const targetCase = caseName || 'genitive';
    const g = gender || 'masculine';
    const t = (type || 'звання').toLowerCase().trim();
    const cleanText = text.toString().trim();

    console.log(`[API Запит] Тип: ${t}, Текст: "${cleanText}", Відмінок: ${targetCase}`);

    // 1. Обробка ПІБ
    if (t === 'піб' || t === 'pib') {
      const parts = cleanText.split(/\s+/);
      let input = { gender: g };
      
      if (parts.length >= 3) {
        input.lastName = parts[0];
        input.firstName = parts[1];
        input.middleName = parts.slice(2).join(" ");
      } else if (parts.length === 2) {
        input.lastName = parts[0];
        input.firstName = parts[1];
      } else {
        input.lastName = cleanText;
      }

      const output = await shevchenko.decline(input, targetCase);
      let resParts = [];
      if (output.lastName) resParts.push(output.lastName);
      if (output.firstName) resParts.push(output.firstName);
      if (output.middleName) resParts.push(output.middleName);
      
      const finalResult = resParts.join(" ").trim();
      return res.json({ result: finalResult || cleanText });
    }

    // 2. Обробка Звань
    if (t === 'звання' || t === 'rank') {
      const output = await shevchenko.decline({ gender: g, militaryRank: cleanText }, targetCase);
      return res.json({ result: output.militaryRank || cleanText });
    }

    // 3. Обробка Посад
    if (t === 'посада' || t === 'job') {
      const output = await shevchenko.decline({ gender: g, militaryAppointment: cleanText }, targetCase);
      return res.json({ result: output.militaryAppointment || cleanText });
    }

    return res.json({ result: cleanText });
  } catch (error) {
    console.error(`[ПОМИЛКА СЕРВЕРА]: ${error.message}`);
    // Навіть у разі критичної помилки повертаємо оригінальний текст, щоб клітина не була пустою
    return res.json({ result: text.toString().trim() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
