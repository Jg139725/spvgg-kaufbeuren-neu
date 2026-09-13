# SVK Frauen – Schärfe-Fix V8

Wichtig: Dieses Paket erzeugt keine neuen Bilder.

Problem:
Die bisher verwendete FuPa-URL mit `512x512.jpeg` liefert sichtbar weiche/pixelige
Spielerinnenbilder.

Fix:
- Die Seite fragt jetzt zuerst die Originaldatei des jeweiligen FuPa-Spielerbildes ab.
- Falls FuPa für ein Bild keine Originaldatei über diesen Endpunkt liefert, fällt die
  Seite automatisch auf die bisher funktionierende 512px-Datei zurück.
- Bei Trainer/Kapitäninnen entsprechend Original -> 256px-Fallback.
- Keine 1280px-URLs und kein srcset mehr, die in V6 zu kaputten Bildern geführt hatten.
- Keine Spielerinnenbilder wurden ersetzt oder künstlich neu generiert.

Upload:
ZIP entpacken -> Inhalt in `spvgg-kaufbeuren-neu` -> gleichnamige Dateien ersetzen
-> Commit Changes -> danach Cmd + Shift + R.
