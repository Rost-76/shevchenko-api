const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

// Реєструємо військове розширення в оригінальній бібліотеці
shevchenko.registerExtension(militaryExtension);

const app = express();
app.use(express.json());

// Головний єдиний маршрут для відмінювання всього
app.post('/api/decline', async (req, res) => {
  try {
    const { type, text, caseName, gender } = req.body;
    if (!text) return res.status(400).json({ error: "Параметр text є обов'язковим" });

    const targetCase = caseName || 'genitive';
    const g = gender || 'masculine';
    
    // Формуємо структуру вхідних даних для бібліотеки shevchenko
    let input = { gender: g };
    const t = type.toLowerCase().trim();

    if (t === 'піб' || t === 'pib') {
      const parts = text.trim().split(/\s+/);
      if (parts.length === 3) {
        input.lastName = parts[0]; input.firstName = parts[1]; input.middleName = parts[2];
      } else if (parts.length === 2) {
        input.lastName = parts[0]; input.firstName = parts[1];
      } else {
        input.lastName = text;
      }
      const output = await shevchenko[targetCase](input);
      let resParts = [];
      if (output.lastName) resParts.push(output.lastName);
      if (output.firstName) resParts.push(output.firstName);
      if (output.middleName) resParts.push(output.middleName);
      return res.json({ result: resParts.join(" ") });
    } 
    
    if (t === 'звання' || t === 'rank') {
      input.militaryRank = text;
      const output = await shevchenko[targetCase](input);
      return res.json({ result: output.militaryRank });
    } 
    
    if (t === 'посада' || t === 'job') {
      input.militaryAppointment = text;
      const output = await shevchenko[targetCase](input);
      return res.json({ result: output.militaryAppointment });
    }

    return res.status(400).json({ error: "Невірний type. Введіть 'піб', 'звання' або 'посада'" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
