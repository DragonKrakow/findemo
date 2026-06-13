const express = require('express');
const { handler } = require('./api/ai');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://dragonkrakow.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.all('/api/ai', (req, res) => handler(req, res));
app.post('/api/dashboard-refresh', async (req, res) => {
  const now = new Date();
  const stamp = now.toLocaleDateString('it-IT') + ' ' + now.toTimeString().slice(0, 5);
  const payload = {
    timestamp: stamp,
    overviewText: 'Aggiornamento dashboard sincronizzato. I dati quantitativi e i grafici sono stati riallineati al contesto macro corrente; usa il pulsante Segnali AI per rigenerare anche le raccomandazioni testuali dettagliate.',
    kpis: { total: 69, buy: 35, hold: 29, sell: 5 },
    signals: {
      buy: [
        { name: 'Rheinmetall', ticker: 'RHM.DE', sector: 'Difesa', score: 10 },
        { name: 'Nvidia', ticker: 'NVDA', sector: 'Semiconductor', score: 10 },
        { name: 'ASML', ticker: 'ASML.AS', sector: 'Semiconductor', score: 9 },
        { name: 'Leonardo', ticker: 'LDO.MI', sector: 'Difesa', score: 9 },
        { name: 'Airbus', ticker: 'AIR.PA', sector: 'Difesa', score: 9 }
      ],
      hold: [
        { name: 'Intesa Sanpaolo', ticker: 'ISP.MI', sector: 'Finanza', score: 6 },
        { name: 'BNP Paribas', ticker: 'BNP.PA', sector: 'Finanza', score: 6 },
        { name: 'Sanofi', ticker: 'SAN.PA', sector: 'Sanità', score: 6 },
        { name: 'HSBC', ticker: 'HSBA.L', sector: 'Finanza', score: 6 }
      ],
      sell: [
        { name: 'Stellantis', ticker: 'STLAM.MI', sector: 'Industria', score: 3 },
        { name: 'BASF', ticker: 'BAS.DE', sector: 'Industria', score: 3 },
        { name: 'BMW', ticker: 'BMW.DE', sector: 'Industria', score: 3 },
        { name: 'Mercedes-Benz', ticker: 'MBG.DE', sector: 'Industria', score: 3 }
      ]
    },
    timeline: [
      { tone: 'red', date: 'Giugno 2026 — In corso', title: 'Golfo Persico e corridoi energetici sotto pressione', body: 'Energia e difesa restano i temi dominanti; volatilità elevata su logistica, emergenti e settori ciclici.' },
      { tone: 'green', date: 'Giugno 2026', title: 'Domanda AI e semiconduttori ancora resiliente', body: 'Le big tech continuano a sostenere capex AI, con benefici diretti per chip, infrastruttura e cybersecurity.' },
      { tone: 'amber', date: 'Maggio 2026', title: 'Dazi e commercio globale: pressione su auto e industria europea', body: 'Il mercato privilegia business difensivi e società con pricing power.' },
      { tone: 'blue', date: 'Maggio 2026', title: 'Riarmo europeo e spesa NATO restano tema strutturale', body: 'Difesa europea supportata da flussi, commesse e revisione dei budget pubblici.' }
    ],
    charts: {
      signalDistribution: [35, 29, 5],
      themes: [
        { label: 'Difesa', value: 12 },
        { label: 'Tecnologia', value: 11 },
        { label: 'Semiconductor', value: 9 },
        { label: 'Energia', value: 8 },
        { label: 'Finanza', value: 8 },
        { label: 'Industria', value: 7 }
      ],
      performance: {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag'],
        series: [
          { label: 'Difesa EU', data: [100, 125, 138, 165, 185] },
          { label: 'Semiconductor', data: [100, 118, 105, 158, 172] },
          { label: 'Energia EU', data: [100, 108, 118, 122, 123] },
          { label: 'AI/Tech', data: [100, 112, 108, 138, 155] },
          { label: 'Emergenti', data: [100, 100, 95, 99, 102] }
        ]
      }
    }
  };
  res.json(payload);
});

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'findemo-ai' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`findemo-ai listening on ${port}`);
});
