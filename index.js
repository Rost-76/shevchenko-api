const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

// Реєструємо військове розширення
shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Мапа виклику правильних методів бібліотеки shevchenko.js
const caseMethods = {
  'genitive': 'inGenitive',
  'dative': 'inDative',
  'accusative': 'inAccusative',
  'ablative': 'inAblative',
  'locative': 'inLocative',
  'vocative': 'inVocative',
  'родовий': 'inGenitive',
  'давальний': 'inDative',
  'знахідний': 'inAccusative',
  'орудний': 'inAblative',
  'місцевий': 'inLocative',
  'кличний': 'inVocative'
};

async function handleDecline(req, res) {
  try {
    const data = Object.keys(req.body).length > 0 ? req.body : req.query;
    const { type, text, caseName, gender } = data;
    
    if (!text) return res.json({ result: "" });

    const inputCase = (caseName || 'genitive').toLowerCase().trim();
    const methodName = caseMethods[inputCase] || 'inGenitive';
    
    const g = gender || 'masculine';
    const t = (type || 'звання').toLowerCase().trim();
    const cleanText = text.toString().trim();

    // 1. ОФІЦІЙНА ОБРОБКА ПІБ (familyName, givenName, patronymicName)
    if (t === 'піб' || t === 'pib') {
      const parts = cleanText.split(/\s+/);
      let input = { gender: g };
      
      if (parts.length >= 3) {
        input.familyName = parts[0];
        input.givenName = parts[1];
        input.patronymicName = parts.slice(2).join(" ");
      } else if (parts.length === 2) {
        input.familyName = parts[0];
        input.givenName = parts[1];
      } else {
        input.familyName = cleanText;
      }

      // Викликаємо правильний метод (наприклад, inGenitive)
      const output = await shevchenko[methodName](input);
      
      let resParts = [];
      if (output.familyName) resParts.push(output.familyName);
      if (output.givenName) resParts.push(output.givenName);
      if (output.patronymicName) resParts.push(output.patronymicName);
      
      return res.json({ result: resParts.join(" ").trim() || cleanText });
    }

    // 2. ОФІЦІЙНА ОБРОБКА ЗВАНЬ
    if (t === 'звання' || t === 'rank') {
      const output = await shevchenko[methodName]({ gender: g, militaryRank: cleanText });
      return res.json({ result: output.militaryRank || cleanText });
    }

    // 3. ОФІЦІЙНА ОБРОБКА ПОСАД
    if (t === 'посада' || t === 'job') {
      const output = await shevchenko[methodName]({ gender: g, militaryAppointment: cleanText });
      return res.json({ result: output.militaryAppointment || cleanText });
    }

    return res.json({ result: cleanText });
  } catch (error) {
    return res.json({ result: (req.body.text || req.query.text || "").toString().trim() });
  }
}

app.post('/api/decline', handleDecline);
app.get('/api/decline', handleDecline);
app.post('/', handleDecline);
app.get('/', handleDecline);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
