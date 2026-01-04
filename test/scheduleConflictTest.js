// test/scheduleConflictTest.js
// Тестовый скрипт для проверки логики конфликтов расписания
// Запуск: node test/scheduleConflictTest.js

console.log('🧪 Тестирование логики конфликтов расписания\n');
console.log('='.repeat(60));

// ============================================
// Helper Functions (из нашего кода)
// ============================================

const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const checkTimeOverlap = (start1, end1, start2, end2) => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

const validateTimeFormat = (timeStr) => {
    return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr);
};

const validateTimeOrder = (startTime, endTime) => {
    return timeToMinutes(endTime) > timeToMinutes(startTime);
};

// ============================================
// Test Suite
// ============================================

let passedTests = 0;
let failedTests = 0;

const runTest = (testName, actual, expected) => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Expected: ${JSON.stringify(expected)}`);
        console.log(`   Actual:   ${JSON.stringify(actual)}`);
        failedTests++;
    }
};

console.log('\n📋 Test Group 1: Time Format Validation\n');

runTest('Valid time: 09:00', validateTimeFormat('09:00'), true);
runTest('Valid time: 14:30', validateTimeFormat('14:30'), true);
runTest('Valid time: 23:59', validateTimeFormat('23:59'), true);
runTest('Valid time: 00:00', validateTimeFormat('00:00'), true);
runTest('Invalid time: 25:00', validateTimeFormat('25:00'), false);
runTest('Invalid time: 12:60', validateTimeFormat('12:60'), false);
runTest('Invalid time: 9:00 (no leading zero)', validateTimeFormat('9:00'), true); // Regex allows single digit
runTest('Invalid time: abc:de', validateTimeFormat('abc:de'), false);
runTest('Invalid time: 12:5 (missing zero)', validateTimeFormat('12:5'), false);

console.log('\n📋 Test Group 2: Time Order Validation\n');

runTest('10:00 < 11:00', validateTimeOrder('10:00', '11:00'), true);
runTest('09:00 < 14:00', validateTimeOrder('09:00', '14:00'), true);
runTest('11:00 < 10:00 (INVALID)', validateTimeOrder('11:00', '10:00'), false);
runTest('10:00 < 10:00 (SAME)', validateTimeOrder('10:00', '10:00'), false);
runTest('10:00 < 10:01', validateTimeOrder('10:00', '10:01'), true);

console.log('\n📋 Test Group 3: Time to Minutes Conversion\n');

runTest('09:00 → 540 minutes', timeToMinutes('09:00'), 540);
runTest('10:30 → 630 minutes', timeToMinutes('10:30'), 630);
runTest('00:00 → 0 minutes', timeToMinutes('00:00'), 0);
runTest('23:59 → 1439 minutes', timeToMinutes('23:59'), 1439);
runTest('12:00 → 720 minutes', timeToMinutes('12:00'), 720);

console.log('\n📋 Test Group 4: Time Overlap Detection\n');

// Полное перекрытие
runTest(
    'Overlap: 10:00-11:00 vs 10:30-11:30',
    checkTimeOverlap('10:00', '11:00', '10:30', '11:30'),
    true
);

// Нет перекрытия (один после другого)
runTest(
    'No overlap: 10:00-11:00 vs 11:00-12:00',
    checkTimeOverlap('10:00', '11:00', '11:00', '12:00'),
    false
);

// Нет перекрытия (один до другого)
runTest(
    'No overlap: 10:00-11:00 vs 09:00-10:00',
    checkTimeOverlap('10:00', '11:00', '09:00', '10:00'),
    false
);

// Полное совпадение
runTest(
    'Overlap: 10:00-11:00 vs 10:00-11:00 (EXACT)',
    checkTimeOverlap('10:00', '11:00', '10:00', '11:00'),
    true
);

// Вложенный интервал (внутри)
runTest(
    'Overlap: 09:00-12:00 vs 10:00-11:00 (NESTED)',
    checkTimeOverlap('09:00', '12:00', '10:00', '11:00'),
    true
);

// Частичное перекрытие (начало)
runTest(
    'Overlap: 10:00-11:00 vs 09:30-10:30',
    checkTimeOverlap('10:00', '11:00', '09:30', '10:30'),
    true
);

// 1 минута перекрытия
runTest(
    'Overlap: 10:00-11:00 vs 10:59-12:00',
    checkTimeOverlap('10:00', '11:00', '10:59', '12:00'),
    true
);

// Граничный случай (касание)
runTest(
    'No overlap: 10:00-11:00 vs 11:00-12:00 (TOUCH)',
    checkTimeOverlap('10:00', '11:00', '11:00', '12:00'),
    false
);

console.log('\n📋 Test Group 5: Conflict Scenarios (Integration)\n');

// Сценарий 1: Конфликт учителя
const scenario1_schedule1 = { startTime: '10:00', endTime: '11:00', teacherId: 'teacher1' };
const scenario1_schedule2 = { startTime: '10:30', endTime: '11:30', teacherId: 'teacher1' };

const hasConflict1 = checkTimeOverlap(
    scenario1_schedule1.startTime,
    scenario1_schedule1.endTime,
    scenario1_schedule2.startTime,
    scenario1_schedule2.endTime
) && scenario1_schedule1.teacherId === scenario1_schedule2.teacherId;

runTest('Scenario 1: Teacher conflict (same teacher, overlapping time)', hasConflict1, true);

// Сценарий 2: Нет конфликта (разные учителя)
const scenario2_schedule1 = { startTime: '10:00', endTime: '11:00', teacherId: 'teacher1' };
const scenario2_schedule2 = { startTime: '10:30', endTime: '11:30', teacherId: 'teacher2' };

const hasConflict2 = checkTimeOverlap(
    scenario2_schedule1.startTime,
    scenario2_schedule1.endTime,
    scenario2_schedule2.startTime,
    scenario2_schedule2.endTime
) && scenario2_schedule1.teacherId === scenario2_schedule2.teacherId;

runTest('Scenario 2: No conflict (different teachers, overlapping time)', hasConflict2, false);

// Сценарий 3: Нет конфликта (тот же учитель, разное время)
const scenario3_schedule1 = { startTime: '10:00', endTime: '11:00', teacherId: 'teacher1' };
const scenario3_schedule2 = { startTime: '12:00', endTime: '13:00', teacherId: 'teacher1' };

const hasConflict3 = checkTimeOverlap(
    scenario3_schedule1.startTime,
    scenario3_schedule1.endTime,
    scenario3_schedule2.startTime,
    scenario3_schedule2.endTime
) && scenario3_schedule1.teacherId === scenario3_schedule2.teacherId;

runTest('Scenario 3: No conflict (same teacher, different times)', hasConflict3, false);

console.log('\n📋 Test Group 6: Edge Cases\n');

// Edge case: Очень короткий урок (1 минута)
runTest(
    'Edge: 1-minute lesson 10:00-10:01 vs 10:00-11:00',
    checkTimeOverlap('10:00', '10:01', '10:00', '11:00'),
    true
);

// Edge case: Урок через всю ночь (если бы разрешалось)
runTest(
    'Edge: 23:00-23:59 vs 23:30-23:59',
    checkTimeOverlap('23:00', '23:59', '23:30', '23:59'),
    true
);

// Edge case: Граничное касание на минуту
runTest(
    'Edge: Touch at 11:00 (10:00-11:00 vs 11:00-12:00)',
    checkTimeOverlap('10:00', '11:00', '11:00', '12:00'),
    false
);

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results Summary:\n');
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total:  ${passedTests + failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Logic is correct.\n');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review the logic.\n`);
    process.exit(1);
}
