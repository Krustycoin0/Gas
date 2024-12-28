const API_KEY = 'UUJ6SAVF20BOYYPM';
const SYMBOL = 'NG';
const TIME_PERIOD_RSI = 14;
const TIME_PERIOD_EMA = 250;
const TIME_PERIOD_STOCH = 10;
const STOCH_OVERBOUGHT = 94;
const STOCH_OVERSOLD = 10;
const TAKE_PROFIT_PERCENT = 0.02;
const STOP_LOSS_PERCENT = 0.01;
const UPDATE_INTERVAL = 10000;

let myChart;
let previousClose = null;
let previousData = null;
const RSI_OVERBOUGHT = 70;
const RSI_OVERSOLD = 30;
// Funzione per ottenere i dati da Alpha Vantage
async function getGasData() {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Errore HTTP nella chiamata API:", response.status, response.statusText);
            return null;
        }
        const data = await response.json();
         if (!data || !data["Time Series (Daily)"]) {
            console.error("Errore: i dati API sono vuoti o hanno un formato inaspettato.");
            return null;
        }
        return data;
    } catch (error) {
        console.error("Errore nel recupero dei dati da Alpha Vantage:", error);
        return null;
    }
}

// Funzione per calcolare la media mobile semplice (SMA)
function calculateSMA(data, timePeriod) {
     if (!data || !data["Time Series (Daily)"]) {
        console.error("Errore: i dati necessari per l'SMA non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series (Daily)"];
     const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();


    if (dailyPrices.length < timePeriod) {
        console.warn("Avviso: Dati insufficienti per calcolare l'SMA.");
        return null;
    }

    let sum = 0;
    for (let i = dailyPrices.length - timePeriod; i < dailyPrices.length; i++) {
        sum += dailyPrices[i];
    }
    const sma = sum / timePeriod;
    return sma;
}

// Funzione per calcolare l'EMA
function calculateEMA(data, timePeriod) {
    if (!data || !data["Time Series (Daily)"]) {
        console.error("calculateEMA: Errore: i dati necessari per l'EMA non sono stati restituiti dall'API");
        return null;
    }
   const timeSeries = data["Time Series (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();


    if (dailyPrices.length < timePeriod) {
        console.warn("calculateEMA: Avviso: Dati insufficienti per calcolare l'EMA.");
        return null;
    }

      let ema = 0;
     let k = 2 / (timePeriod + 1);

    for (let i = 0; i < dailyPrices.length; i++) {
        ema = (dailyPrices[i] * k) + (ema * (1 - k))
    }
    return ema;
}
// Funzione per calcolare l'RSI
function calculateRSI(data, timePeriod) {
    if (!data || !data["Time Series (Daily)"]) {
        console.error("Errore: i dati necessari per l'RSI non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

    if (dailyPrices.length < timePeriod + 1) {
        console.warn("Avviso: Dati insufficienti per calcolare l'RSI.");
        return null;
    }

   let gains = [];
    let losses = [];

    for (let i = 1; i < dailyPrices.length; i++) {
        const change = dailyPrices[i] - dailyPrices[i - 1];
        if (change > 0) {
            gains.push(change);
            losses.push(0);
        } else {
            losses.push(Math.abs(change));
            gains.push(0);
        }
    }
    if (gains.length < timePeriod) {
      console.warn("Avviso: Dati insufficienti per calcolare l'RSI.");
       return null;
     }
     let avgGain = gains.slice(gains.length - timePeriod).reduce((a, b) => a + b, 0) / timePeriod;
     let avgLoss = losses.slice(losses.length - timePeriod).reduce((a, b) => a + b, 0) / timePeriod;

     for (let i = gains.length - timePeriod; i > 0; i--) {
        let currentAvgGain =  gains.slice(i - timePeriod, i).reduce((a,b) => a + b, 0) / timePeriod;
        let currentAvgLoss = losses.slice(i - timePeriod, i).reduce((a,b) => a + b, 0) / timePeriod;
        
        avgGain = (avgGain * (timePeriod -1) + gains[i-1]) / timePeriod;
        avgLoss = (avgLoss * (timePeriod -1) + losses[i-1]) / timePeriod;

     }

    if (avgLoss === 0) {
       console.warn("Avviso: avgLoss = 0, RSI = 100.");
       return 100;
    }
   const rs = avgGain / avgLoss;
   const rsi = 100 - (100 / (1 + rs));
   return rsi;
}

// Funzione per calcolare lo Stocastico
function calculateStochastic(data, timePeriod) {
   if (!data || !data["Time Series (Daily)"]) {
        console.error("calculateStochastic: Errore: i dati necessari per lo stocastico non sono stati restituiti dall'API");
        return null;
    }
    const timeSeries = data["Time Series (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => ({
        close: parseFloat(dayData['4. close']),
        low: parseFloat(dayData['3. low']),
        high: parseFloat(dayData['2. high'])
     })).reverse();

    if (dailyPrices.length < timePeriod) {
        console.warn("calculateStochastic: Avviso: Dati insufficienti per calcolare lo Stocastico.");
        return null;
    }
    const periodPrices = dailyPrices.slice(0, timePeriod)
    const highestHigh = Math.max(...periodPrices.map(day => day.high));
    const lowestLow = Math.min(...periodPrices.map(day => day.low));
    const currentClose = dailyPrices[0].close
    const stochastic = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    return stochastic;
}

// Funzione per simulare l'analisi fondamentale con un indicatore di sentiment
function simulateFundamentalAnalysis() {
    const sentiment = Math.random() < 0.6 ? "positivo" : "negativo";
    return sentiment;
}

// Funzione per calcolare il trend
function calculateTrend(price, ema) {
    if (price > ema) {
        return "uptrend";
    } else if (price < ema) {
        return "downtrend";
    } else {
        return "sideways";
    }
}

// Funzione per determinare i livelli di supporto e resistenza
function calculateSupportResistance(data) {
    if (!data || !data["Time Series (Daily)"]) {
        console.error("Errore: i dati necessari per il supporto e la resistenza non sono stati restituiti dall'API");
        return null;
    }
    const timeSeries = data["Time Series (Daily)"];
     const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

    if (dailyPrices.length < 20) {
        console.warn("Avviso: Dati insufficienti per calcolare supporto e resistenza.");
        return {support: null, resistance: null};
    }
    const last20Prices = dailyPrices.slice(-20);
    const support = Math.min(...last20Prices);
    const resistance = Math.max(...last20Prices);
    return { support, resistance };
}
// Funzione per generare i segnali
function generateSignal(price, ema, rsi, stochastic, fundamentalSentiment, trend, support, resistance) {
   if (!price || !ema || !rsi || !trend || stochastic == null) {
        return null;
    }

     let signal = null;

   if (trend === "uptrend" &&  rsi < RSI_OVERBOUGHT  && stochastic < STOCH_OVERSOLD && price > support) {
        signal = {
            type: 'Acquista',
            entryPrice: price,
             stopLoss: Math.max(support, price * (1 - STOP_LOSS_PERCENT)),
            takeProfit: resistance ? Math.min(resistance, price * (1 + TAKE_PROFIT_PERCENT)) : price * (1 + TAKE_PROFIT_PERCENT)
         };
    }
     else if (trend === "downtrend" && rsi > RSI_OVERSOLD && stochastic > STOCH_OVERBOUGHT  && price < resistance ) {
        signal = {
           type: 'Vendi',
            entryPrice: price,
             stopLoss: Math.min(resistance, price * (1 + STOP_LOSS_PERCENT)),
           takeProfit: support ? Math.max(support, price * (1 - STOP_LOSS_PERCENT)) : price * (1 - STOP_LOSS_PERCENT)
        };
    }
    return signal;
}

// Funzione per visualizzare il grafico
async function aggiornaGrafico(data, signal) {
    if (!data || !data["Time Series (Daily)"]) {
        console.error("Errore: i dati necessari per visualizzare il grafico non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();
    const ema = calculateEMA(data, TIME_PERIOD_EMA);
     const { support, resistance } = calculateSupportResistance(data);

    const chartData = {
         labels: Array.from({ length: dailyPrices.length }, (_, i) => i + 1),
        datasets: [{
            label: 'Prezzo Gas Naturale',
            data: dailyPrices,
             borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
           }]
    };
    if(ema) {
          chartData.datasets.push({
               label: 'EMA 250',
            data: dailyPrices.map(() => ema),
              borderColor: 'yellow',
               borderDash: [5, 5],
           })
    }


    if (support) {
         chartData.datasets[0].annotations = [{
            type: 'line',
            yMin: support,
            yMax: support,
            borderColor: 'blue',
             borderWidth: 2,
            label: {
                 content: 'Supporto',
               display: true,
            }
        }];
    }
    if(resistance){
         if (!chartData.datasets[0].annotations) {
              chartData.datasets[0].annotations = [];
          }
         chartData.datasets[0].annotations.push({
            type: 'line',
            yMin: resistance,
            yMax: resistance,
            borderColor: 'purple',
              borderWidth: 2,
            label: {
                 content: 'Resistenza',
                 display: true,
            }
        });
    }

    if (signal) {
        chartData.datasets[0].pointBackgroundColor = dailyPrices.map((price, index) => {
            if (signal.entryPrice && index === dailyPrices.length - 1) {
                return signal.type === "Acquista" ? 'green' : 'red';
            } else {
                return 'rgba(0, 0, 0, 0)';
            }
        });
         chartData.datasets[0].pointRadius = dailyPrices.map((price, index) => {
            if (signal.entryPrice && index === dailyPrices.length - 1) {
                return 5;
            } else {
                return 0;
            }
        });
         if (!chartData.datasets[0].annotations) {
              chartData.datasets[0].annotations = [];
          }
            chartData.datasets[0].annotations.push({
                type: 'line',
                xMin: dailyPrices.length - 1,
                xMax: dailyPrices.length - 1,
                yMin: signal.takeProfit,
                yMax: signal.takeProfit,
                borderColor: 'green',
                borderWidth: 2,
                label: {
                   content: 'Take Profit',
                    display: true,
                }
            }, {
                type: 'line',
                xMin: dailyPrices.length - 1,
                xMax: dailyPrices.length - 1,
               yMin: signal.stopLoss,
                yMax: signal.stopLoss,
                borderColor: 'red',
                borderWidth: 2,
                label: {
                    content: 'Stop Loss',
                   display: true,
               }
             });
    }

    const chartConfig = {
         type: 'line',
        data: chartData,
        options: {
            responsive: true,
             plugins: {
                 annotation: {
                     annotations: chartData.datasets[0].annotations
                 }
             }
         }
    };

    const chartCanvas = document.getElementById("myChart");
     if (chartCanvas) {
         if (myChart) {
             myChart.destroy();
         }
         myChart = new Chart(chartCanvas, chartConfig);
    }
}
// Funzione per aggiornare la pagina dei segnali
async function aggiornaSegnaliPagina() {
    let data;
    if (previousData) {
        const latestData = await getGasData();
        if (JSON.stringify(latestData) === JSON.stringify(previousData)) {
            data = previousData;
        } else {
            data = latestData;
            previousData = latestData;
        }
    } else {
        data = await getGasData();
         previousData = data;
    }
   if (!data) {
        console.error("Errore: dati API nulli, impossibile aggiornare la pagina.");
        const segnaliContainer = document.getElementById('segnali-container');
        if (segnaliContainer) {
            segnaliContainer.innerHTML = "<p>Nessun segnale generato al momento (errore API)</p>";
        }
        return;
    }
    const timeSeries = data["Time Series (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

    const ema = calculateEMA(data, TIME_PERIOD_EMA);
    const rsi = calculateRSI(data, TIME_PERIOD_RSI);
    const stochastic = calculateStochastic(data, TIME_PERIOD_STOCH);
    const fundamentalSentiment = simulateFundamentalAnalysis();
    const { support, resistance } = calculateSupportResistance(data);
   const price = dailyPrices[dailyPrices.length - 1];
     const trend = calculateTrend(price, ema);
    const signal = generateSignal(price, ema, rsi, stochastic, fundamentalSentiment, trend, support, resistance);
    const segnaliContainer = document.getElementById('segnali-container');

     if (segnaliContainer) {
         if (signal) {
             segnaliContainer.innerHTML = `<p>Segnale: <span style="font-weight: bold; color: ${signal.type === 'Acquista' ? 'green' : 'red'};">${signal.type}</span> a ${signal.entryPrice.toFixed(2)} con TP: ${signal.takeProfit.toFixed(2)} e SL: ${signal.stopLoss.toFixed(2)}</p>`;
         } else {
             segnaliContainer.innerHTML = "<p>Nessun segnale generato al momento</p>";
         }
     }
    aggiornaGrafico(data, signal);
}

// Aggiorna i segnali al caricamento della pagina e imposta l'intervallo per gli aggiornamenti futuri
document.addEventListener('DOMContentLoaded', () => {
    aggiornaSegnaliPagina();
    setInterval(aggiornaSegnaliPagina, UPDATE_INTERVAL);
});
