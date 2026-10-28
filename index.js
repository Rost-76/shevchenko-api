const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

// Реєструємо військове розширення
shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function handleDecline(req, res) {
  try {
    const data = Object.keys(req.body).length > 0 ? req.body : req.query;
    const { type, text, caseName, gender } = data;
    
    if (!text) return res.json({ result: "" });

    const targetCase = (caseName || 'genitive').toLowerCase().trim();
    const g = gender || 'masculine';
    const t = (type || 'звання').toLowerCase().trim();
    const cleanText = text.toString().trim();

    // 1. ОФІЦІЙНИЙ МЕТОД ДЛЯ ПІБ
    if (t === 'піб' || t === 'pib') {
      const parts = cleanText.split(/\s+/);
      let input = { gender: g };
      
      // Розбиваємо ПІБ на окремі текстові змінні (а не масиви!), як вимагає shevchenko
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

      // Викликаємо метод відмінювання безпосередньо для ПІБ
      const output = await shevchenko[targetCase](input);
      
      let resParts = [];
      if (output.lastName) resParts.push(output.lastName);
      if (output.firstName) resParts.push(output.firstName);
      if (output.middleName) resParts.push(output.middleName);
      
      return res.json({ result: resParts.join(" ").trim() || cleanText });
    }

    // 2. ОФІЦІЙНИЙ МЕТОД ДЛЯ ЗВАНЬ
    if (t === 'звання' || t === 'rank') {
      const output = await shevchenko[targetCase]({ gender: g, militaryRank: cleanText });
      return res.json({ result: output.militaryRank || cleanText });
    }

    // 3. ОФІЦІЙНИЙ МЕТОД ДЛЯ ПОСАД
    if (t === 'посада' || t === 'job') {
      const output = await shevchenko[targetCase]({ gender: g, militaryAppointment: cleanText });
      return res.json({ result: output.militaryAppointment || cleanText });
    }

    return res.json({ result: cleanText });
  } catch (error) {
    // Якщо сталася помилка, повертаємо оригінал, щоб клітина не була порожньою
    return res.json({ result: (req.body.text || req.query.text || "").toString().trim() });
  }
}

app.post('/api/decline', handleDecline);
app.get('/api/decline', handleDecline);
app.post('/', handleDecline);
app.get('/', handleDecline);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
