const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Універсальна функція обробки логіки відмінювання
async function handleDecline(req, res) {
  try {
    // Зчитуємо дані як з POST body, так і з GET query параметрів
    const data = Object.keys(req.body).length > 0 ? req.body : req.query;
    const { type, text, caseName, gender } = data;
    
    if (!text) return res.json({ result: "" });

    const targetCase = caseName || 'genitive';
    const g = gender || 'masculine';
    const t = (type || 'звання').toLowerCase().trim();
    const cleanText = text.toString().trim();

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
      
      return res.json({ result: resParts.join(" ").trim() || cleanText });
    }

    if (t === 'звання' || t === 'rank') {
      const output = await shevchenko.decline({ gender: g, militaryRank: cleanText }, targetCase);
      return res.json({ result: output.militaryRank || cleanText });
    }

    if (t === 'посада' || t === 'job') {
      const output = await shevchenko.decline({ gender: g, militaryAppointment: cleanText }, targetCase);
      return res.json({ result: output.militaryAppointment || cleanText });
    }

    return res.json({ result: cleanText });
  } catch (error) {
    return res.json({ result: (req.body.text || req.query.text || "").toString().trim() });
  }
}

// Приймаємо і POST, і GET на всіх можливих маршрутах хостингу Render
app.post('/api/decline', handleDecline);
app.get('/api/decline', handleDecline);
app.post('/', handleDecline);
app.get('/', handleDecline);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
