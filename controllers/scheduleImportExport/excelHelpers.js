const XLSX = require('xlsx');

const ORAR_SHEET = 'Orar';
const CLASSES_SHEET = 'Clase';
const TEACHERS_SHEET = 'Profesori';
const SUBJECTS_SHEET = 'Materii';

const DAY_NAMES = {
    0: 'Duminică',
    1: 'Luni',
    2: 'Marți',
    3: 'Miercuri',
    4: 'Joi',
    5: 'Vineri',
    6: 'Sâmbătă',
};

const DAY_ALIASES = {
    luni: 1,
    monday: 1,
    понедельник: 1,
    пн: 1,
    'marți': 2,
    marti: 2,
    tuesday: 2,
    вторник: 2,
    вт: 2,
    miercuri: 3,
    wednesday: 3,
    среда: 3,
    ср: 3,
    joi: 4,
    thursday: 4,
    четверг: 4,
    чт: 4,
    vineri: 5,
    friday: 5,
    пятница: 5,
    пт: 5,
    sâmbătă: 6,
    sambata: 6,
    saturday: 6,
    duminică: 0,
    duminica: 0,
    sunday: 0,
};

const ORAR_HEADERS = [
    'Clasă',
    'Zi',
    'Ora început',
    'Ora sfârșit',
    'Materie',
    'Profesor',
    'Email profesor',
    'Sală',
    'Săptămână',
    'Semestru',
    'An',
];

const HEADER_ALIASES = {
    clasă: 'Clasă',
    clasa: 'Clasă',
    class: 'Clasă',
    класс: 'Clasă',
    zi: 'Zi',
    day: 'Zi',
    день: 'Zi',
    'ora început': 'Ora început',
    'ora inceput': 'Ora început',
    start: 'Ora început',
    'ora sfârșit': 'Ora sfârșit',
    'ora sfarsit': 'Ora sfârșit',
    end: 'Ora sfârșit',
    materie: 'Materie',
    subject: 'Materie',
    предмет: 'Materie',
    profesor: 'Profesor',
    teacher: 'Profesor',
    учитель: 'Profesor',
    'email profesor': 'Email profesor',
    email: 'Email profesor',
    sală: 'Sală',
    sala: 'Sală',
    room: 'Sală',
    кабинет: 'Sală',
    'săptămână': 'Săptămână',
    saptamana: 'Săptămână',
    week: 'Săptămână',
    неделя: 'Săptămână',
    semestru: 'Semestru',
    semester: 'Semestru',
    семестр: 'Semestru',
    an: 'An',
    year: 'An',
    год: 'An',
};

function normalizeHeader(value) {
    const key = String(value || '').trim().toLowerCase();
    return HEADER_ALIASES[key] || String(value || '').trim();
}

function parseDayOfWeek(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return value;
    const asNumber = parseInt(value, 10);
    if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber <= 6) {
        return asNumber;
    }
    const normalized = String(value).trim().toLowerCase();
    return DAY_ALIASES[normalized] ?? null;
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = String(timeStr).split(':').map(Number);
    return hours * 60 + minutes;
}

function timesOverlap(startA, endA, startB, endB) {
    const aStart = timeToMinutes(startA);
    const aEnd = timeToMinutes(endA);
    const bStart = timeToMinutes(startB);
    const bEnd = timeToMinutes(endB);
    return aStart < bEnd && aEnd > bStart;
}

function flattenSchedulesToRows(schedules) {
    const rows = [];

    for (const schedule of schedules) {
        const className = schedule.classId?.name || schedule.className || '';
        const dayLabel = DAY_NAMES[schedule.dayOfWeek] || String(schedule.dayOfWeek);

        for (const period of schedule.periods || []) {
            const teacher = period.teacherId;
            const isObj = typeof teacher === 'object' && teacher !== null;

            rows.push({
                Clasă: className,
                Zi: dayLabel,
                'Ora început': period.startTime,
                'Ora sfârșit': period.endTime,
                Materie: period.subject,
                Profesor: isObj ? teacher.name : '',
                'Email profesor': isObj ? teacher.email : '',
                Sală: period.room || '',
                Săptămână: schedule.week,
                Semestru: schedule.semester,
                An: schedule.year,
            });
        }
    }

    return rows.sort((a, b) => {
        const classCmp = String(a.Clasă).localeCompare(String(b.Clasă));
        if (classCmp !== 0) return classCmp;
        const dayCmp = (DAY_ALIASES[String(a.Zi).toLowerCase()] || 0) - (DAY_ALIASES[String(b.Zi).toLowerCase()] || 0);
        if (dayCmp !== 0) return dayCmp;
        return timeToMinutes(a['Ora început']) - timeToMinutes(b['Ora început']);
    });
}

function buildWorkbook({ schedules = [], classes = [], teachers = [], subjects = [] }) {
    const workbook = XLSX.utils.book_new();

    const orarRows = flattenSchedulesToRows(schedules);
    const orarSheet = XLSX.utils.json_to_sheet(orarRows, { header: ORAR_HEADERS });
    XLSX.utils.book_append_sheet(workbook, orarSheet, ORAR_SHEET);

    const classesSheet = XLSX.utils.json_to_sheet(
        classes.map((c) => ({ Clasă: c.name, ID: String(c._id || c.id) }))
    );
    XLSX.utils.book_append_sheet(workbook, classesSheet, CLASSES_SHEET);

    const teachersSheet = XLSX.utils.json_to_sheet(
        teachers.map((t) => ({
            Profesor: t.name,
            Email: t.email,
            Materii: (t.subjects || []).join(', '),
            ID: String(t._id || t.id),
        }))
    );
    XLSX.utils.book_append_sheet(workbook, teachersSheet, TEACHERS_SHEET);

    const subjectsSheet = XLSX.utils.json_to_sheet(subjects.map((s) => ({ Materie: s })));
    XLSX.utils.book_append_sheet(workbook, subjectsSheet, SUBJECTS_SHEET);

    const instructions = [
        ['Instrucțiuni'],
        ['1. Completați foaia "Orar" — câte un rând per lecție.'],
        ['2. Folosiți numele exacte din foile Clase / Profesori / Materii.'],
        ['3. Zi: Luni, Marți, Miercuri, Joi, Vineri.'],
        ['4. Ore: format HH:mm (ex. 08:00).'],
        ['5. Un profesor nu poate avea două lecții suprapuse.'],
        ['6. Un clasă nu poate avea două lecții suprapuse.'],
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucțiuni');

    return workbook;
}

function workbookToBuffer(workbook) {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function readOrarSheet(workbook) {
    const sheet = workbook.Sheets[ORAR_SHEET] || workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
        throw new Error('Fișierul Excel nu conține foaia "Orar"');
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rawRows.map((row) => {
        const normalized = {};
        Object.entries(row).forEach(([key, value]) => {
            normalized[normalizeHeader(key)] = value;
        });
        return normalized;
    });
}

function groupRowsIntoSchedules(rows) {
    const grouped = new Map();
    const errors = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        const className = String(row['Clasă'] || '').trim();
        const dayOfWeek = parseDayOfWeek(row.Zi);
        const week = parseInt(row['Săptămână'], 10);
        const semester = parseInt(row.Semestru, 10);
        const year = parseInt(row.An, 10) || new Date().getFullYear();
        const startTime = String(row['Ora început'] || '').trim();
        const endTime = String(row['Ora sfârșit'] || '').trim();
        const subject = String(row.Materie || '').trim();
        const teacherName = String(row.Profesor || '').trim();
        const teacherEmail = String(row['Email profesor'] || '').trim();
        const room = String(row.Sală || '').trim();

        if (!className && !subject && !startTime) {
            return;
        }

        if (!className || dayOfWeek === null || !week || !semester || !subject || !startTime || !endTime) {
            errors.push({
                row: rowNum,
                message: `Rând ${rowNum}: lipsesc câmpuri obligatorii (Clasă, Zi, ore, Materie, Săptămână, Semestru)`,
            });
            return;
        }

        if (!teacherName && !teacherEmail) {
            errors.push({
                row: rowNum,
                message: `Rând ${rowNum}: specificați Profesor sau Email profesor`,
            });
            return;
        }

        const key = `${className}|${dayOfWeek}|${week}|${semester}|${year}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                className,
                dayOfWeek,
                week,
                semester,
                year,
                periods: [],
                sourceRows: [],
            });
        }

        const entry = grouped.get(key);
        entry.periods.push({
            subject,
            startTime,
            endTime,
            room,
            teacherName,
            teacherEmail,
        });
        entry.sourceRows.push(rowNum);
    });

    return { schedules: Array.from(grouped.values()), errors };
}

function detectBatchConflicts(resolvedSchedules) {
    const conflicts = [];
    const slots = [];

    resolvedSchedules.forEach((entry, entryIndex) => {
        entry.periods.forEach((period, periodIndex) => {
            slots.push({
                entryIndex,
                periodIndex,
                className: entry.className,
                dayOfWeek: entry.dayOfWeek,
                week: entry.week,
                semester: entry.semester,
                year: entry.year,
                teacherId: String(period.teacherId),
                teacherName: period.teacherName || period.teacherEmail,
                subject: period.subject,
                startTime: period.startTime,
                endTime: period.endTime,
            });
        });
    });

    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            const a = slots[i];
            const b = slots[j];

            if (
                a.dayOfWeek !== b.dayOfWeek ||
                a.week !== b.week ||
                a.semester !== b.semester ||
                a.year !== b.year
            ) {
                continue;
            }

            if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
                continue;
            }

            if (a.teacherId === b.teacherId) {
                conflicts.push({
                    type: 'teacher_conflict',
                    message: `Profesorul ${a.teacherName} este alocat simultan la ${a.className} (${a.subject}) și ${b.className} (${b.subject}), ${a.startTime}-${a.endTime}`,
                    teacher: a.teacherName,
                    class1: a.className,
                    class2: b.className,
                    time: `${a.startTime}-${a.endTime}`,
                });
            }

            if (a.className === b.className) {
                conflicts.push({
                    type: 'class_conflict',
                    message: `Clasa ${a.className} are două lecții suprapuse: ${a.subject} și ${b.subject}, ${a.startTime}-${a.endTime}`,
                    class: a.className,
                    subject1: a.subject,
                    subject2: b.subject,
                    time: `${a.startTime}-${a.endTime}`,
                });
            }
        }
    }

    return conflicts;
}

function parseExcelBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows = readOrarSheet(workbook);
    return groupRowsIntoSchedules(rows);
}

function buildExcelFilename(prefix, classLabel, dateStr) {
    const safeLabel = String(classLabel || 'all').replace(/[^\w.-]+/g, '_');
    return `${prefix}_${safeLabel}_${dateStr}.xlsx`;
}

module.exports = {
    ORAR_SHEET,
    ORAR_HEADERS,
    DAY_NAMES,
    buildWorkbook,
    workbookToBuffer,
    parseExcelBuffer,
    flattenSchedulesToRows,
    groupRowsIntoSchedules,
    parseDayOfWeek,
    detectBatchConflicts,
    buildExcelFilename,
    timesOverlap,
    timeToMinutes,
};
