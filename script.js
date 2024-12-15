// Funzione di esempio per mostrare un messaggio quando la pagina è caricata
document.addEventListener('DOMContentLoaded', function() {
    console.log('La pagina è stata completamente caricata.');
});

// Funzione di esempio per aggiornare dinamicamente una sezione della pagina (es. ultimi segnali)
function aggiornaUltimiSegnali() {
    const ultimiSegnaliSection = document.querySelector('main section:nth-child(2)'); // Ottieni la seconda sezione (ultimi segnali)
    if (ultimiSegnaliSection) {
        // Invece di scrivere HTML staticamente, potremmo fare una chiamata API per recuperare i segnali
        // Esempio con dei dati statici:
        const segnali = [
            { tipo: 'Acquista', prezzo: '2.85', stopLoss: '2.80', targetPrice: '2.90' },
            { tipo: 'Vendi', prezzo: '2.95', stopLoss: '2.98', targetPrice: '2.90' },
        ];

        let html = '<h3>Ultimi Segnali:</h3>';
        html += '<table class="segnali-table">';
        html += '<thead><tr><th>Tipo</th><th>Prezzo</th><th>Stop Loss</th><th>Target Price</th></tr></thead>';
        html += '<tbody>';
        segnali.forEach(segnale => {
            html += `<tr><td>${segnale.tipo}</td><td>${segnale.prezzo}</td><td>${segnale.stopLoss}</td><td>${segnale.targetPrice}</td></tr>`;
        });
        html += '</tbody></table>';


        ultimiSegnaliSection.innerHTML = html;
    }
}


// Chiamata alla funzione per aggiornare i segnali (potrebbe essere ripetuta periodicamente)
aggiornaUltimiSegnali(); //chiamata iniziale
//setInterval(aggiornaUltimiSegnali, 60000); // aggiorna i segnali ogni 60 secondi, commentare se non si vuole l'aggiornamento automatico

// Funzione di esempio per gestire l'invio di un form (se ne hai uno)
const form = document.querySelector('form'); // Assumi di avere un form nel tuo HTML
if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Impedisce l'invio standard del form
        // Qui puoi aggiungere il codice per gestire l'invio dei dati (es. invio a un server)
        console.log('Form inviato (simulato)');
    });
}

//Funzione per la visualizzazione delle testimonianze
function mostraTestimonianze(){

  const testimonianzeSection = document.querySelector('main section:nth-child(3)'); // Selezioniamo la terza section (testimonianze)
  if(testimonianzeSection){
        const testimonianze =[
        {testo : "Il miglior servizio di segnali sul gas naturale che ho mai provato! ", autore: "Mario Rossi"},
        {testo: "Segnali chiari e puntuali, il mio trading ne ha beneficiato enormemente!", autore: "Francesca Verdi"},
        {testo:"Ho iniziato a guadagnare grazie a questi segnali. Consigliatissimo!", autore: "Gino Bianchi"}
      ];

    let html = '<h3>Cosa Dicono i Nostri Clienti:</h3>';
        testimonianze.forEach(testimonianza => {
          html += '<div class="testimonianza">';
          html += `<p>${testimonianza.testo}</p>`;
          html += `<cite>- ${testimonianza.autore}</cite>`;
          html += '</div>';
          });


          testimonianzeSection.innerHTML = html;

  }
}
 mostraTestimonianze(); //chiamata iniziale
