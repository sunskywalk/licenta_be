# JMeter — load test API (Licenta backend)

## Fișiere

| Fișier | Rol |
|--------|-----|
| `school-catalog-load-test.jmx` | Plan JMeter gata configurat |
| `fetch-test-ids.js` | Ia `STUDENT_ID` și `CLASS_ID` din API |

## Pregătire (o singură dată)

```bash
brew install jmeter   # dacă nu e instalat
cd licenta_be
npm run seed          # date de test
npm run dev           # server pe port 5050
```

## Pas 1 — ID-uri pentru teste

În alt terminal:

```bash
cd licenta_be
node jmeter/fetch-test-ids.js
```

Copiază `STUDENT_ID` și `CLASS_ID` în JMeter:

**Test Plan** → **User Defined Variables** → înlocuiește `REPLACE_WITH_STUDENT_ID` și `REPLACE_WITH_CLASS_ID`.

## Pas 2 — Deschide planul

```bash
jmeter
```

**File → Open** → `licenta_be/jmeter/school-catalog-load-test.jmx`

## Pas 3 — Prima rulare (debug)

1. Setează **THREADS** = `1`, **LOOPS** = `1`
2. Apasă ▶️ (Start)
3. **View Results Tree** → `POST Login` trebuie **200** cu `token`
4. Celelalte request-uri trebuie **200** (nu 401)

## Pas 4 — Scenarii pentru diplomă

În **User Defined Variables**:

| Variabilă | 50 users | 200 users | 500 users |
|-----------|----------|-----------|-----------|
| THREADS | 50 | 200 | 500 |
| RAMP_UP | 60 | 60 | 60 |
| LOOPS | 5 | 5 | 5 |

Rulează de 3 ori, notează coloana **Average** din **Summary Report** pentru fiecare request.

## Ce testează planul

**Thread Group 01 — Admin read load** (activ):

- `POST /api/users/login`
- `GET /api/ping`
- `GET /api/schedule/current-week`
- `GET /api/notifications`
- `GET /api/grades`
- `GET /api/grades/student/{id}/stats`
- `GET /api/stats/classes`
- `GET /api/classes`

**Thread Group 02 — Teacher write** (dezactivat implicit):

- Login `teacher1@school.com` / `teacher123`
- `POST /api/attendance/mark`

Activează-l după ce ai setat `STUDENT_ID`, `CLASS_ID`.

## Rulare fără GUI (opțional)

```bash
node jmeter/fetch-test-ids.js   # notează ID-urile
jmeter -n -t jmeter/school-catalog-load-test.jmx \
  -l jmeter/results.jtl \
  -JTHREADS=50 -JRAMP_UP=60 -JLOOPS=5 \
  -JSTUDENT_ID=... -JCLASS_ID=...
```

## Variabile (Test Plan)

| Nume | Implicit | Descriere |
|------|----------|-----------|
| HOST | localhost | |
| PORT | 5050 | din `.env` |
| EMAIL | admin@school.com | |
| PASSWORD | admin123 | |
| THREADS | 50 | utilizatori virtuali |
| RAMP_UP | 60 | secunde |
| LOOPS | 5 | repetări per user |
| STUDENT_ID | (din script) | |
| CLASS_ID | (din script) | |

## Pentru tabelul din diplomă

Folosește rutele **reale** din acest plan, de exemplu:

- `GET /api/schedule/current-week` (nu `/api/schedules/week`)
- `GET /api/stats/classes` (nu `/api/stats/class`)
- `GET /api/grades/student/{id}/stats`
- `POST /api/attendance/mark` (thread group 02)

Adaugă captură de ecran **Summary Report** ca anexă.
