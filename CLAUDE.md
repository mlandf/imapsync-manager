# CLAUDE.md

  # CLAUDE.md

  

> Lies diese Datei vollständig bevor du mit irgendeiner Aufgabe beginnst.

> Bei jeder Änderung an der App: README.md aktualisieren.

  

---

  

## Stack

  

### Backend

| Komponente | Wahl |

|------------------|-----------------------------|

| Language | Python 3.12+ |

| Framework | FastAPI |

| Validation | Pydantic v2 |

| Settings | pydantic-settings (via env) |

| ORM (optional) | SQLModel |

| Package Manager | uv |

| Linter/Formatter | Ruff |

| Logging | structlog |

| Testing | pytest + httpx |



  

### Frontend

| Komponente | Wahl |

|------------------|-----------------------------|

| Framework | Next.js 15 (App Router) |

| Language | TypeScript (strict) |

| Styling | Tailwind CSS |

| Components | shadcn/ui |

| Icons | lucide-react |

| Forms | react-hook-form + zod |

| Data Fetching | TanStack Query v5 |

| Theme | next-themes (system default)|

| Container | Docker (Port: 8192, nur Frontend exponiert) |

  

---

  

## Projektstruktur

  

```

backend/

src/

api/ # Router & Endpunkte

core/ # Business-Logik (framework-unabhängig)

services/ # Externe Dienste (DB, APIs, etc.)

models/ # Pydantic-Schemas & SQLModel-Tabellen

config.py # Settings via pydantic-settings

main.py # App-Entrypoint

tests/ # Spiegelt src/-Struktur

frontend/

app/ # Next.js App Router (pages & layouts)

components/

ui/ # shadcn/ui Komponenten (auto-generiert, nicht manuell editieren)

[feature]/ # Feature-spezifische Komponenten

lib/ # Utilities & API-Client

hooks/ # Custom React Hooks

types/ # Globale TypeScript-Typen

docker-compose.yml

.env.example

README.md

CLAUDE.md

```

  

---

  

## Architektur-Regeln

  

- **Kein Monolith** — kein File über 300 Zeilen, keine God-Classes

- **Single Responsibility** — jedes Modul hat genau eine Aufgabe

- **Konfiguration ausschließlich via Umgebungsvariablen** — nie hardcoded

- **Typen immer annotieren** — mypy-kompatibel

- **Fehlerbehandlung explizit** — kein nacktes `except:`

- **Kein print()** — immer `structlog`

- **Secrets niemals in Code oder Git**

  

---

  

## Frontend-Regeln

  

- **Nur shadcn/ui Komponenten** — keine eigenen bauen wenn shadcn etwas hat

- **Kein inline-style** — ausschließlich Tailwind-Klassen

- **Kein hardcoded Hex** — nur Tailwind-Tokens / CSS-Variablen

- **Typen immer** — kein `any`, kein `// @ts-ignore`

- **Server Components by default** — `"use client"` nur wenn wirklich nötig (Interaktivität, Browser-APIs)

- **API-Calls immer über `lib/api.ts`** — nie direkt fetch() in Komponenten

- **Formulare immer mit react-hook-form + zod** — kein manuelles State-Management für Forms

  

---

  

## Docker

  

- Multi-stage Build (builder + runtime stage)

- Non-root User im Container

- Health-Check im Dockerfile definieren

- `.dockerignore` für beide Services pflegen

- `docker-compose.yml` orchestriert beide Services

  

---

  

## Testing

  

### Backend

- Jede neue Funktion bekommt einen Unit-Test

- Tests in `tests/` spiegeln `src/`-Struktur

- Async-Tests via `pytest-asyncio`

- HTTP-Tests via `httpx.AsyncClient`

  

### Frontend

- Komponenten-Tests via Vitest + Testing Library

- Kein Test für shadcn/ui Komponenten (die sind bereits getestet)

  

---

  

## README.md — wird bei jeder Änderung gepflegt

  

Die README enthält immer diese Abschnitte:

  

1. **Was macht diese App?** (2-3 Sätze, klar und konkret)

2. **Quickstart** — von 0 auf laufend in unter 5 Minuten

3. **Umgebungsvariablen** — Name, Pflicht/Optional, Default, Beschreibung

4. **API-Endpunkte** — Methode, Pfad, kurze Beschreibung

5. **Architektur** — Modulstruktur kurz erklärt

6. **Abhängigkeiten & Begründung** — warum diese Library?

7. **Bekannte Limitierungen / TODOs**

  

---

  

## Bei jeder Aufgabe

  

1. README.md aktualisieren wenn sich Verhalten, Konfiguration oder Struktur ändert

2. Bestehende Konventionen beibehalten — nie ohne Grund abweichen

3. Bei Unklarheiten fragen, nicht raten

4. Keine neuen Dependencies ohne kurze Begründung