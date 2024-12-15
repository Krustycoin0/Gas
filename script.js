    // Funzione di esempio per aggiornare dinamicamente una sezione della pagina (es. ultimi segnali)
   function aggiornaSegnaliPagina() {
       const segnaliContainer = document.getElementById('segnali-container');
       if (segnaliContainer) {
           // Invece di scrivere HTML staticamente, potremmo fare una chiamata API per recuperare i segnali
           // Esempio con dei dati statici:
           const segnali = [
               { tipo: 'Acquista', prezzo: '2.85', stopLoss: '2.80', targetPrice: '2.90' },
               { tipo: 'Vendi', prezzo: '2.95', stopLoss: '2.98', targetPrice: '2.90' },
              { tipo: 'Acquista', prezzo: '2.75', stopLoss: '2.70', targetPrice: '2.80' },
              { tipo: 'Vendi', prezzo: '2.80', stopLoss: '2.85', targetPrice: '2.70' },
              { tipo: 'Acquista', prezzo: '2.90', stopLoss: '2.88', targetPrice: '2.95' },

           ];

           let html = '<table class="segnali-table">';
           html += '<thead><tr><th>Tipo</th><th>Prezzo</th><th>Stop Loss</th><th>Target Price</th></tr></thead>';
           html += '<tbody>';
           segnali.forEach(segnale => {
               html += `<tr><td>${segnale.tipo}</td><td>${segnale.prezzo}</td><td>${segnale.stopLoss}</td><td>${segnale.targetPrice}</td></tr>`;
           });
           html += '</tbody></table>';

           segnaliContainer.innerHTML = html;
       }
   }
   aggiornaSegnaliPagina();
