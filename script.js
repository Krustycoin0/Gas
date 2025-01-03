const API_KEY = 'TUO_API_KEY_QUI'; // Inserisci qui la tua API Key di Alpha Vantage
const SYMBOL = 'EURUSD'; // Cambio coppia EUR/USD
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
async function getForexData() {
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Errore HTTP nella chiamata API:", response.status, response.statusText);
            const text = await response.text()
            console.error("API Error:", text);
            return null;
        }
        const data = await response.json();
        if (!data || !data["Time Series FX (Daily)"]) {
            console.log("API Response:", data)
            console.error("Errore: i dati API sono vuoti o hanno un formato inaspettato.");
            return null;
        }
        console.log("API Response:", data)
        return data;
    } catch (error) {
        console.error("Errore nel recupero dei dati da Alpha Vantage:", error);
        return null;
    }
}

// Funzione per calcolare la media mobile semplice (SMA)
function calculateSMA(data, timePeriod) {
    if (!data || !data["Time Series FX (Daily)"]) {
        console.error("Errore: i dati necessari per l'SMA non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series FX (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

    console.log("dailyPrices", dailyPrices);


    if (dailyPrices.length < timePeriod) {
        console.warn("Avviso: Dati insufficienti per calcolare l'SMA.");
        return null;
    }

    let sum = 0;
    for (let i = dailyPrices.length - timePeriod; i < dailyPrices.length; i++) {
        sum += dailyPrices[i];
    }
    const sma = sum / timePeriod;
    console.log("SMA:", sma);
    return sma;
}


// Funzione per calcolare l'EMA
function calculateEMA(data, timePeriod) {
    if (!data || !data["Time Series FX (Daily)"]) {
        console.error("calculateEMA: Errore: i dati necessari per l'EMA non sono stati restituiti dall'API");
        return null;
    }
   const timeSeries = data["Time Series FX (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

     console.log("dailyPrices", dailyPrices);

    if (dailyPrices.length < timePeriod) {
        console.warn("calculateEMA: Avviso: Dati insufficienti per calcolare l'EMA.");
        return null;
    }

      let ema = 0;
     let k = 2 / (timePeriod + 1);

    for (let i = 0; i < dailyPrices.length; i++) {
        ema = (dailyPrices[i] * k) + (ema * (1 - k))
    }
    console.log("EMA:", ema);
    return ema;
}
// Funzione per calcolare l'RSI
function calculateRSI(data, timePeriod) {
    if (!data || !data["Time Series FX (Daily)"]) {
        console.error("Errore: i dati necessari per l'RSI non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series FX (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();

    console.log("dailyPrices", dailyPrices);

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
    console.log("RSI:", rsi);
   return rsi;
}

// Funzione per calcolare lo Stocastico
function calculateStochastic(data, timePeriod) {
   if (!data || !data["Time Series FX (Daily)"]) {
        console.error("calculateStochastic: Errore: i dati necessari per lo stocastico non sono stati restituiti dall'API");
        return null;
    }
    const timeSeries = data["Time Series FX (Daily)"];
    const dailyPrices = Object.values(timeSeries).map(dayData => ({
        close: parseFloat(dayData['4. close']),
        low: parseFloat(dayData['3. low']),
        high: parseFloat(dayData['2. high'])
     })).reverse();

      console.log("dailyPrices", dailyPrices);

    if (dailyPrices.length < timePeriod) {
        console.warn("calculateStochastic: Avviso: Dati insufficienti per calcolare lo Stocastico.");
        return null;
    }
    const periodPrices = dailyPrices.slice(0, timePeriod)
    const highestHigh = Math.max(...periodPrices.map(day => day.high));
    const lowestLow = Math.min(...periodPrices.map(day => day.low));
    const currentClose = dailyPrices[0].close
    const stochastic = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
   console.log("Stochastic:", stochastic);
    return stochastic;
}

// Funzione per simulare l'analisi fondamentale con un indicatore di sentiment
function simulateFundamentalAnalysis() {
    const sentiment = Math.random() < 0.6 ? "positivo" : "negativo";
    console.log("Sentiment:", sentiment);
    return sentiment;
}

// Funzione per calcolare il trend
function calculateTrend(price, ema) {
    if (price > ema) {
      console.log("Trend: uptrend");
        return "uptrend";
    } else if (price < ema) {
         console.log("Trend: downtrend");
        return "downtrend";
    } else {
       console.log("Trend: sideways");
        return "sideways";
    }
}

// Funzione per determinare i livelli di supporto e resistenza
function calculateSupportResistance(data) {
    if (!data || !data["Time Series FX (Daily)"]) {
        console.error("Errore: i dati necessari per il supporto e la resistenza non sono stati restituiti dall'API");
        return {support: null, resistance: null};
    }
    const timeSeries = data["Time Series FX (Daily)"];
     const dailyPrices = Object.values(timeSeries).map(dayData => parseFloat(dayData['4. close'])).reverse();
      console.log("dailyPrices", dailyPrices);
    if (dailyPrices.length < 20) {
        console.warn("Avviso: Dati insufficienti per calcolare supporto e resistenza.");
       return {support: null, resistance: null};
    }
    const last20Prices = dailyPrices.slice(-20);
    const support = Math.min(...last20Prices);
    const resistance = Math.max(...last20Prices);
    console.log("Support:", support, "Resistance:", resistance);
    return { support, resistance };
}

// Funzione per generare i segnali
function generateSignal(price, ema, rsi, stochastic, fundamentalSentiment, trend, support, resistance) {
    if (!price || !ema || !rsi || !trend || stochastic == null) {
       console.log("Signal: null because a value is missing")
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
   console.log("Signal:", signal);
    return signal;
}

// Funzione per visualizzare il grafico
async function aggiornaGrafico(data, signal) {
    if (!data || !data["Time Series FX (Daily)"]) {
        console.error("Errore: i dati necessari per visualizzare il grafico non sono stati restituiti dall'API");
        return null;
    }

    const timeSeries = data["Time Series FX (Daily)"];
    const dailyData = Object.values(timeSeries).map(dayData => ({
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close'])
    })).reverse();
    console.log("dailyData", dailyData);
    const ema = calculateEMA(data, TIME_PERIOD_EMA);
     const { support, resistance } = calculateSupportResistance(data);

    const chartData = {
         labels: Array.from({ length: dailyData.length }, (_, i) => i + 1),
        datasets: [{
            label: 'Prezzo EUR/USD',
            data: dailyData.map(day => ({
                x:  Array.from({ length: dailyData.length }, (_, i) => i + 1)[dailyData.indexOf(day)],
                o: day.open,
                h: day.high,
                l: day.low,
                c: day.close
            })),
             borderColor: 'black',
             type: 'candlestick',

           }]
    };
   if(ema) {
          chartData.datasets.push({
               label: 'EMA 250',
                data: dailyData.map(() => ({ x: Array.from({ length: dailyData.length }, (_, i) => i + 1),y:ema})),
                borderColor: 'blue',
                type: 'line',

           })
    }

    if (support) {
           if (!chartData.datasets[0].annotations) {
             chartData.datasets[0].annotations = [];
            }
        chartData.datasets[0].annotations.push({
           type: 'line',
            yMin: support,
            yMax: support,
            borderColor: 'green',
             borderWidth: 2,
           label: {
                content: 'Supporto',
                display: true,
            }
        });
    }
    if(resistance){
        if (!chartData.datasets[0].annotations) {
             chartData.datasets[0].annotations = [];
        }
         chartData.datasets[0].annotations.push({
             type: 'line',
             yMin: resistance,
             yMax: resistance,
            borderColor: 'red',
              borderWidth: 2,
             label: {
                  content: 'Resistenza',
                  display: true,
             }
        });
    }
   if (signal) {
         if (!chartData.datasets[0].annotations) {
             chartData.datasets[0].annotations = [];
        }
           chartData.datasets[0].annotations.push(
                {
                type: 'line',
                    xMin:  dailyData.length - 1,
                    xMax: dailyData.length - 1,
                     yMin: signal.takeProfit,
                     yMax: signal.takeProfit,
                borderColor: 'green',
                borderDash: [5, 5],
                borderWidth: 2,
               label: {
                   content: 'Take Profit',
                   display: true,
                }
            },
           {
                type: 'line',
                xMin:  dailyData.length - 1,
                 xMax: dailyData.length - 1,
               yMin: signal.stopLoss,
                yMax: signal.stopLoss,
                 borderColor: 'red',
                 borderDash: [5, 5],
                borderWidth: 2,
               label: {
                    content: 'Stop Loss',
                   display: true,
              }
             },
               {
                type: 'point',
                xValue: dailyData.length - 1,
                yValue: signal.entryPrice,
                backgroundColor: signal.type === "Acquista" ? 'green' : 'red',
                radius: 8,
                    label:{
                        content: signal.type === "Acquista" ? '⬆️' : '⬇️',
                        display: true,
                         font:{
                           size: 14
                         }
                     }
             });

    }

    const chartConfig = {
        type: 'scatter',
        data: chartData,
        options: {
            responsive: true,
             scales: {
                x: {
                    title: {
                         display: true,
                         text: 'Giorni'
                  }
                 },
                y: {
                   title: {
                        display: true,
                        text: 'Prezzo'
                   }
                }
             },
             plugins: {
                 legend: {
                     display: true,
                 },
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
        const latestData = await getForexData();
        if (JSON.stringify(latestData) === JSON.stringify(previousData)) {
           console.log("No new data from the API, reusing the previous data");
            data = previousData;
        } else {
             console.log("New data from the API")
            data = latestData;
            previousData = latestData;
        }
    } else {
        console.log("First time getting data from the API")
        data = await getForexData();
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
    const timeSeries = data["Time Series FX (Daily)"];
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
             segnaliContainer.innerHTML = `<p>Segnale: <span style="font-weight: bold; color: ${signal.type === 'Acquista' ? 'green' : 'red'};">${signal.type}</span> a ${signal.entryPrice.toFixed(4)} con TP: ${signal.takeProfit.toFixed(4)} e SL: ${signal.stopLoss.toFixed(4)}</p>`;
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
