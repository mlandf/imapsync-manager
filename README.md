# imapsync Manager

> [!WARNING]
> **Diese App hat keine Authentifizierung.** Wer die Weboberfläche erreicht, kann alle Server-Profile und Jobs sehen, Jobs mit den gespeicherten Postfach-Zugangsdaten starten und über die Zusatzoptionen beliebige imapsync-Parameter übergeben – inklusive Löschoptionen wie `--delete1`/`--delete2`.
>
> - Betreibe das Tool **nur lokal auf deinem eigenen Rechner**. `docker-compose.yml` bindet den Port deshalb bewusst nur an `127.0.0.1:8192`.
> - **Nicht ins Internet oder ins Firmen-/Heimnetz exponieren**: kein Port-Forwarding, kein `0.0.0.0`-Binding, kein öffentlicher Reverse-Proxy, kein Tunnel (ngrok, Cloudflare Tunnel o. ä.).
> - Wenn du es doch auf einem anderen Host betreibst, nur hinter einem Reverse-Proxy mit eigener Authentifizierung (z. B. Basic Auth, OAuth2-Proxy) und mit TLS.
> - Nach Abschluss der Migration Container stoppen (`docker compose down`) und gespeicherte Jobs mit Zugangsdaten löschen.
>
> Nutzung auf eigene Gefahr, ohne Gewähr.

## 1. Was macht diese App?

Eine Web-Oberfläche für [imapsync](https://imapsync.lamiral.info/), mit der sich IMAP-Postfächer zwischen verschiedenen Servern synchronisieren lassen. IMAP-Server werden einmalig als **Profil** angelegt (Hostname/IP, Port, Verschlüsselung). **Sync-Jobs** greifen auf diese Profile zurück und laufen parallel (Standard: max. 5, weitere warten in der Warteschlange). Für jeden Job gibt es eine Live-Fortschrittsanzeige und ein Live-Log. Die Oberfläche ist auf Deutsch, Englisch ist umschaltbar.

## 2. Quickstart

Voraussetzung: Docker mit Docker Compose.

```bash
cp .env.example .env
# Schlüssel erzeugen und in .env bei ENCRYPTION_KEY eintragen:
docker compose build backend
docker compose run --rm --no-deps backend python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
docker compose up -d --build
```

Danach **http://localhost:8192** öffnen (nur vom eigenen Rechner aus erreichbar):

1. Unter **Server-Profile** Quell- und Zielserver anlegen. Ein leerer Port bedeutet Standard-Port: 993 bei SSL, 143 bei STARTTLS oder ohne Verschlüsselung.
2. Unter **Sync-Jobs → Neuer Job** Profile wählen, Benutzer und Passwort eintragen und Optionen setzen.
3. Mit **Speichern & starten** den Job starten. Der Fortschritt aktualisiert sich jede Sekunde.

> ⚠️ Den `ENCRYPTION_KEY` sichern. Geht er verloren, lassen sich gespeicherte Passwörter nicht mehr entschlüsseln. Die Jobs müssen dann mit neuen Passwörtern gespeichert werden.

## 3. Umgebungsvariablen

Backend (`.env`):

| Name | Pflicht | Default | Beschreibung |
|---|---|---|---|
| `ENCRYPTION_KEY` | ja | – | Fernet-Key zur Verschlüsselung der Postfach-Passwörter |
| `MAX_CONCURRENT_JOBS` | nein | `5` | Maximal gleichzeitig laufende Jobs (1–50) |
| `DATA_DIR` | nein | `/data` | SQLite-DB, Logs, temporäre Passwortdateien |
| `LOG_LEVEL` | nein | `INFO` | Log-Level des Backends |
| `CANCEL_GRACE_SECONDS` | nein | `10` | Wartezeit nach SIGTERM bis SIGKILL beim Abbrechen |
| `IMAPSYNC_BIN` | nein | `imapsync` | Pfad zum imapsync-Binary |

Frontend:

| Name | Pflicht | Default | Beschreibung |
|---|---|---|---|
| `BACKEND_URL` | nein | `http://localhost:8000` | Interne Adresse des Backends (in Compose gesetzt) |

## 4. API-Endpunkte

Das Backend ist nur intern erreichbar. Das Frontend leitet `/api/*` über `app/api/[...path]/route.ts` weiter.

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/health` | Health-Check |
| GET | `/api/info` | Konfiguration (z. B. `max_concurrent_jobs`) |
| GET / POST | `/api/profiles` | Profile auflisten / anlegen |
| GET / PUT / DELETE | `/api/profiles/{id}` | Profil lesen / ändern / löschen. Löschen ergibt 409, wenn ein Job das Profil nutzt |
| GET / POST | `/api/jobs` | Jobs auflisten (inkl. Fortschritt) / anlegen |
| GET / PUT / DELETE | `/api/jobs/{id}` | Job lesen / ändern / löschen. Ergibt 409, solange der Job aktiv ist. Ein leeres Passwort bleibt unverändert |
| POST | `/api/jobs/{id}/start` | Job starten oder neu starten (geht in die Warteschlange) |
| POST | `/api/jobs/{id}/cancel` | Laufenden oder wartenden Job abbrechen |
| POST | `/api/jobs/{id}/duplicate` | Job inkl. Zugangsdaten kopieren |
| GET | `/api/jobs/{id}/log?lines=500` | Letzte Log-Zeilen |

Passwörter werden von der API nie zurückgegeben.

## 5. Architektur

```
backend/src/
  api/        profiles.py, jobs.py (CRUD), job_actions.py (start/cancel/duplicate/log), deps.py
  core/       command_builder.py – baut die imapsync-Kommandozeile
              progress_parser.py  – leitet den Fortschritt aus der imapsync-Ausgabe ab
  services/   job_manager.py     – Warteschlange, Semaphore für Parallelität, Status
              process_runner.py  – Subprozess, zeilenweises Lesen, Abbruch der Prozessgruppe
              job_files.py       – Log-Datei, temporäre Passwortdateien (0600)
              crypto.py          – Fernet-Verschlüsselung
  models/     SQLModel-Tabellen (Profile, Job) und Pydantic-Schemas
frontend/
  app/        Seiten: / (Jobs), /jobs/new, /jobs/[id], /jobs/[id]/edit, /profiles, API-Proxy
  components/ jobs/ (Liste, Karte, Fortschritt, Log, Formular), profiles/, layout/, common/
  hooks/      TanStack-Query-Hooks (Polling jede Sekunde), i18n
  lib/        api.ts (einziger API-Client), schemas.ts (zod), i18n/ (de, en), format.ts
```

- **Passwörter** werden mit Fernet verschlüsselt in SQLite gespeichert. imapsync bekommt sie über `--passfile1/2` (temporäre Dateien mit Rechten 0600, nach dem Lauf gelöscht). Dadurch tauchen sie nicht in der Prozessliste oder im Log auf.
- **Fortschritt:** Ausgewertet werden die Zeilen `Host1 Nb messages`, `Folder x/y` und `… msgs left`. Der Stand wird höchstens einmal pro Sekunde in die DB geschrieben, das Frontend fragt jede Sekunde ab. Die Anzeige läuft deshalb auch nach dem Schließen des Browsers weiter.
- **Neustart des Backends:** Laufende Jobs werden als „Fehlgeschlagen“ markiert, wartende Jobs neu eingereiht.

## 6. Abhängigkeiten & Begründung

| Library | Warum |
|---|---|
| FastAPI, Pydantic v2, pydantic-settings, SQLModel | Vorgaben aus dem Projekt-Stack |
| uvicorn | ASGI-Server für FastAPI |
| cryptography (Fernet) | Bewährte symmetrische Verschlüsselung für gespeicherte Passwörter |
| structlog | Vorgabe; strukturiertes JSON-Logging |
| imapsync (GitHub, Perl) | Das eigentliche Sync-Werkzeug; Perl-Module kommen aus Debian-Paketen |
| Next.js 15, shadcn/ui, Tailwind v4, TanStack Query, react-hook-form, zod, next-themes, lucide-react | Vorgaben aus dem Projekt-Stack |
| sonner | Toast-Komponente von shadcn/ui |
| vitest, Testing Library, jsdom | Vorgabe für Frontend-Tests |

## Entwicklung & Tests

```bash
docker build --target test backend          # ruff + pytest
cd frontend && npm install && npm test      # vitest (bzw. via Docker-Build: typecheck, lint, test)
```

Die Backend-Tests verwenden ein gefälschtes imapsync (`backend/tests/fake_imapsync.sh`). Ende-zu-Ende wurde gegen zwei GreenMail-Server mit echtem imapsync getestet.

## 7. Bekannte Limitierungen / TODOs

- **Keine Authentifizierung** – siehe Warnung oben. Nur lokal betreiben.
- Nur Benutzer und Passwort, kein OAuth2 (Microsoft 365, Google).
- Keine zeitgesteuerten Jobs; Jobs starten nur manuell.
- Kein CSV-Massenimport.
- imapsync wird beim Build vom GitHub-`master` geladen. Für reproduzierbare Builds die Build-Arg `IMAPSYNC_URL` auf eine feste Version setzen.
- Der Fortschritt basiert auf den Nachrichtenzahlen von Host1 und ist bei `--folder`/`--include`-Filtern nur ungefähr.
- Bei `--dry`, `--justfolders` oder sehr schnellen Läufen gibt es kaum Zwischenstände.
- Freitext-Zusatzoptionen werden ungeprüft an imapsync übergeben.

## Lizenz

[MIT](LICENSE) – gilt für den Code dieses Repos. imapsync selbst wird beim Docker-Build von [github.com/imapsync/imapsync](https://github.com/imapsync/imapsync) geladen und steht unter seiner eigenen Lizenz (NOLIMIT Public License). Es ist nicht Teil dieses Repos.
