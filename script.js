const API_KEY = 'CM210I4ASAM1JF3M'; // Inserisci la tua API key qui!!!

const SYMBOL = 'NG'; // Simbolo del Gas Naturale
const TIME_PERIOD = 10; // Periodo per le medie mobili e RSI
const TAKE_PROFIT_PERCENT = 0.02; // 2% take profit
const STOP_LOSS_PERCENT = 0.01; // 1% stop loss

// Funzione per ottenere i dati da Alpha Vantage
async function getGasData() {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=NG&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
         const data = await response.json();

         return data;
    } catch (error) {
         console.error("Errore nel recupero dei dati da Alpha Vantage:", error);
         return null;
    }

}

// Funzione per calcolare le medie mobili
function calculateSMA(data, timePeriod) {
    const dailyPrices = Object.values(data["Time Series (Daily)"]).map(item => parseFloat(item["4. close"])).reverse();
    if (dailyPrices.length < timePeriod) return null;
    let sum = 0;
    for (let i = dailyPrices.length - timePeriod; i < dailyPrices.length; i++) {
        sum += dailyPrices[i];
    }

    return sum / timePeriod;
}

// Funzione per calcolare l'RSI
function calculateRSI(data, timePeriod) {
        const dailyPrices = Object.values(data["Time Series (Daily)"]).map(item => parseFloat(item["4. close"])).reverse();
        if (dailyPrices.length < timePeriod + 1) return null;


       let gains = [];
      let losses = [];

      for (let i=1; i < dailyPrices.length; i++){
          const change = dailyPrices[i] - dailyPrices[i - 1];
          if (change > 0){
              gains.push(change);
              losses.push(0)
          } else{
              losses.push(Math.abs(change));
              gains.push(0);
          }
      }
     if (gains.length < timePeriod) return null;
        const avgGain = gains.slice(gains.length - timePeriod).reduce((a,b) => a + b, 0) / timePeriod;
        const avgLoss = losses.slice(losses.length - timePeriod).reduce((a,b) => a + b, 0) / timePeriod;



        if(avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100/(1+rs));
        return rsi;

}

//Funzione per simulare l'analisi fondamentale con un indicatore di sentiment
function simulateFundamentalAnalysis(){
     //Implementiamo semplicemente un indicatore che ha il 60% di possibilità di essere positivo
    return Math.random() < 0.6 ? "positivo" : "negativo";
}

// Funzione per generare i segnali
function generateSignal(price, sma, rsi, fundamentalSentiment) {
    if (!price || !sma || !rsi) return null;
    let signal = null;
    if (price > sma && rsi < 70 && fundamentalSentiment == "positivo") { //Esempio di logica di segnale
        signal = { type: 'Acquista', entryPrice: price,
            stopLoss: price * (1 - STOP_LOSS_PERCENT),
            takeProfit: price * (1 + TAKE_PROFIT_PERCENT) };

    } else if (price < sma && rsi > 30 && fundamentalSentiment == "negativo" ) {
        signal = { type: 'Vendi', entryPrice: price,
            stopLoss: price * (1 + STOP_LOSS_PERCENT),
            takeProfit: price * (1 - TAKE_PROFIT_PERCENT)};
    }
      return signal;

}

// Funzione per aggiornare la pagina dei segnali
async function aggiornaSegnaliPagina() {
    const data = await getGasData();
      if(!data) return;
       const dailyPrices = Object.values(data["Time Series (Daily)"]).map(item => parseFloat(item["4. close"])).reverse();

    const sma = calculateSMA(data, TIME_PERIOD);
    const rsi = calculateRSI(data, TIME_PERIOD);
     const fundamentalSentiment = simulateFundamentalAnalysis();
     const price = dailyPrices[dailyPrices.length - 1];
    const signal = generateSignal(price, sma, rsi, fundamentalSentiment);



    const segnaliContainer = document.getElementById('segnali-container');

    if (segnaliContainer && signal) {
        let html = '<table class="segnali-table">';
        html += '<thead><tr><th>Tipo</th><th>Prezzo Ingresso</th><th>Stop Loss</th><th>Take Profit</th></tr></thead>';
        html += '<tbody>';
         html += `<tr><td>${signal.type}</td><td>${signal.entryPrice.toFixed(2)}</td><td>${signal.stopLoss.toFixed(2)}</td><td>${signal.takeProfit.toFixed(2)}</td></tr>`;

         html += '</tbody></table>';
        segnaliContainer.innerHTML = html;
    } else if (segnaliContainer){
         segnaliContainer.innerHTML = "<p>Nessun segnale generato al momento</p>";
    }
}

// Aggiorna i segnali al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    aggiornaSegnaliPagina();
});
