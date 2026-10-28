const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Мапа перекладу відмінків для повної сумісності
const caseMap = {
  'genitive': 'родовий',
  'dative': 'давальний',
  'accusative': 'знахідний',
  'ablative': 'орудний',
  'locative': 'місцевий',
  'vocative': 'кличний',
  'родовий': 'родовий',
  'давальний': 'давальний',
  'знахідний': 'знахідний',
  'орудний': 'орудний',
  'місцевий': 'місцевий',
  'кличний': 'кличний'
};

async function handleDecline(req, res) {
  try {
    const data = Object.keys(req.body).length > 0 ? req.body : req.query;
    const { type, text, caseName, gender } = data;
    
    if (!text) return res.json({ result: "" });

    // Перекладаємо англійську назву відмінка в українську для shevchenko.js
    const inputCase = (caseName || 'genitive').toLowerCase().trim();
    const targetCase = caseMap[inputCase] || 'родовий';
    
    const g = gender || 'masculine';
    const t = (type || 'звання').toLowerCase().trim();
    const cleanText = text.toString().trim();

    // 1. Обробка ПІБ
    if (t === 'піб' || t === 'pib') {
      const parts = cleanText.split(/\s+/);
      let input = { gender: g };
      
      if (parts.length >= 3) {
        input.lastName = parts;
        input.firstName = parts;
        input.middleName = parts.slice(2).join(" ");
      } else if (parts.length === 2) {
        input.lastName = parts;
        input.firstName = parts;
      } else {
        input.lastName = cleanText;
      }

      const output = await shevchenko.decline(input, targetCase);
      let resParts = [];
      if (output.lastName) resParts.push(output.lastName);
      if (output.firstName) resParts.push(output.firstName);
      if (output.middleName) resParts.push(output.middleName);
      
      return res.json({ result: resParts.join(" ").trim() || cleanText });
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
    return res.json({ result: (req.body.text || req.query.text || "").toString().trim() });
  }
}

app.post('/api/decline', handleDecline);
app.get('/api/decline', handleDecline);
app.post('/', handleDecline);
app.get('/', handleDecline);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
