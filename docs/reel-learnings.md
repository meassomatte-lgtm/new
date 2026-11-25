# Reel learnings (raccolte durante il progetto Caffetteria d'Arte)

Note grezze da trasformare in una skill di progetto quando l'utente approva il prodotto finale.
Fonti: ogni file modello che l'utente invia + le sue correzioni.

## Modelli ricevuti
- Pinterest 1008454541576181955, "Creative Instagram Motion Graphics Reel for Marketing" (ref/pin_reference.mp4,
  77.6 s, 22 shot, mediana 2.8 s). Analisi: caffetteria-arte/docs/style_guide.md.

## Preferenze dell'utente (dalle sue correzioni)
- Il prodotto si vende a un cliente: tono formale, serio, realistico; niente look da cartone.
- Movimento continuo: niente schermate ferme; foto con pan/zoom, card che entrano, transizioni a spinta/whip.
- Apertura con zoom dall'alto sulla città/indirizzo: piace, va tenuta e resa realistica (vista aerea con
  tetti, ombre, alberi, auto, nuvole), non illustrata.
- Mostrare il social del cliente dentro un telefono, con invito a seguire.
- Foto realistiche per prodotti/occasioni (colazione, pranzo, aperitivo); se generate con AI, dirlo al cliente.
- Voce narrante maschile, professionale (ElevenLabs "Tommy", eleven_v4), testo formale che segue le scritte a schermo.
- Niente persone riconoscibili senza consenso (foto di gruppo esclusa, sfocata anche nella griglia Instagram).
- Non inventare fatti: orari/indirizzo solo da fonti dell'utente; frasi promozionali verificabili evitate.

## Tecniche che hanno funzionato
- Coppia tipografica: parola piccola corsiva + parola enorme in grassetto nel colore d'accento.
- Fondi alternati nero-griglia / grigio chiaro con ombre di foglie; curve sottili disegnate in scena.
- Card foto con bordo bianco, inclinate, oggetti in primo piano (chicchi) a più profondità di sfocatura.
- iPhone con screenshot reale del profilo: pan dentro lo schermo, zoom sul pulsante Segui, tocco.
- Scene tagliate sulle frasi della voce (silencedetect per trovare gli attacchi).

## Vincoli tecnici dell'ambiente
- Rete: mappe/tiles bloccate; Pinterest e elevenlabsusercontent.com consentiti su richiesta.
- ElevenLabs piano gratuito: code occupate frequenti, limite giornaliero immagini; immagini escono 16:9.

## Reel "Pranzo" (stesso stile v3, stessa voce)
- Brief dell'utente: domanda iniziale + personaggio stilizzato che si gratta la testa con "?", poi logo, poi elenco piatti animato.
- Foto vere dei piatti fornite dall'utente: preferirle sempre alle immagini AI.
- Nomi piatti: solo quelli riconoscibili con certezza; chiedere conferma al cliente.
- Elenco piatti: un taglio per piatto esattamente sulla parola detta dalla voce (silencedetect -30 dB, 0.1 s),
  card foto + contatore "01 / 06" + nome su due righe (prima riga rossa).
- Tenere tutto il testo sopra y=1490 (zona pulsanti Instagram in 9:16).
- Colori: usare SEMPRE i colori del locale (qui arancione #E07A2B + marrone #5B3A24, dal logo) per omino,
  titoli evidenziati e bordi foto; bianco/nero solo per fondi e testi secondari. Il rosso del modello non va copiato.
- Gancio: niente frasi piatte ("stai cercando un pranzo a..."). Meglio una situazione riconoscibile + domanda
  ("Pordenone, pausa pranzo. La solita domanda: dove pranzo oggi?"), con la parola chiave su barra colorata.
- Apertura: l'utente preferisce una clip reale (persona che cerca sul telefono, volto non visibile) a un personaggio
  disegnato; personaggi in codice solo se molto curati. Sopra la clip: barra di ricerca che "scrive" la domanda.
- Clip da Pinterest = solo segnaposto (diritti ignoti). Per il cliente: girarla o usare stock con licenza.
  ElevenLabs video richiede piano a pagamento.
