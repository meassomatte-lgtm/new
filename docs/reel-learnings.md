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
