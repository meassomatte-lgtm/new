# Istruzioni di progetto (reel e video)

## Video per il profilo personale dell'utente (@measso.mex)
- Quando l'utente dice che un video è per il SUO profilo (non per un cliente come la Caffetteria d'Arte),
  aggiungi SEMPRE in coda l'outro "Seguimi": `personale/outro/seguimi-measso-mex-9x16.mp4`
  (3 s, 1080x1920, 60 fps, "Ami il basket? SEGUIMI" + tap su Segui; sorgente in `follow-reel/`).
- Concatena con ffmpeg alla fine del video finito (stesso formato; riscala/adatta fps se serve) e dillo all'utente.
- Se il file manca, ricorda all'utente che ce l'ha e chiedigli di ricaricarlo.
- Non aggiungerlo ai video dei clienti. Per Rorai Grande esiste un outro dedicato: `consegna/seguici-rorai-grande-9x16.mp4` (sorgente `follow-rorai/`).

## Lezioni sui reel
- Vedi `docs/reel-learnings.md` (preferenze dell'utente, stile, suoni, vincoli). Leggilo prima di un nuovo reel.
