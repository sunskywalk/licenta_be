jest.mock('../controllers/scheduleController/repository');

const repository = require('../controllers/scheduleController/repository');
const { computeScheduleConflicts } = require('../controllers/scheduleController/scheduleWrite.service');

const teacher1 = { _id: 'teacher1', name: 'Иванов' };
const class5A = { _id: 'class5A', name: '5A' };
const class6C = { _id: 'class6C', name: '6C' };
const class7B = { _id: 'class7B', name: '7B' };

function makeSchedule({ id, classId, periods }) {
  return { _id: id, classId, periods };
}

describe('computeScheduleConflicts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects teacher conflict when same teacher overlaps in time', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Математика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class6C._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '10:30', endTime: '11:30', teacherId: teacher1._id }],
      null
    );

    expect(conflicts.some((c) => c.type === 'teacher_conflict')).toBe(true);
  });

  it('detects class conflict when same class overlaps in time', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Математика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class5A._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '10:30', endTime: '11:30', teacherId: 'teacher2' }],
      null
    );

    expect(conflicts.some((c) => c.type === 'class_conflict')).toBe(true);
  });

  it('returns no conflicts when times do not overlap', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Математика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class5A._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '11:00', endTime: '12:00', teacherId: teacher1._id }],
      null
    );

    expect(conflicts).toHaveLength(0);
  });

  it('returns no conflicts when teacher differs and class differs', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Математика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class7B._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '12:00', endTime: '13:00', teacherId: 'teacher2' }],
      null
    );

    expect(conflicts).toHaveLength(0);
  });

  it('passes excludeScheduleId to repository', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([]);

    await computeScheduleConflicts(class5A._id, 1, 2, 1, 2024, [], 'scheduleToExclude');

    expect(repository.findSchedulesForConflictCheck).toHaveBeenCalledWith(
      1,
      2,
      1,
      2024,
      'scheduleToExclude'
    );
  });

  it('filters conflicts per week/semester/year via repository query', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([]);

    await computeScheduleConflicts(class5A._id, 1, 2, 2, 2025, [], null);

    expect(repository.findSchedulesForConflictCheck).toHaveBeenCalledWith(
      1,
      2,
      2,
      2025,
      null
    );
  });

  it('can report both teacher and class conflict for same overlap', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Математика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class5A._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '10:15', endTime: '10:45', teacherId: teacher1._id }],
      null
    );

    const types = conflicts.map((c) => c.type);
    expect(types).toContain('teacher_conflict');
    expect(types).toContain('class_conflict');
  });

  it('includes conflict metadata in teacher_conflict entry', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Физика',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class6C._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '10:00', endTime: '11:00', teacherId: teacher1._id }],
      null
    );

    const conflict = conflicts.find((c) => c.type === 'teacher_conflict');
    expect(conflict.teacher).toBe('Иванов');
    expect(conflict.subject).toBe('Физика');
    expect(conflict.time).toBe('10:00-11:00');
  });

  it('handles multiple existing schedules and periods', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [
          { startTime: '08:00', endTime: '09:00', teacherId: teacher1, subject: 'A' },
          { startTime: '10:00', endTime: '11:00', teacherId: { _id: 't2', name: 'Maria' }, subject: 'B' },
        ],
      }),
      makeSchedule({
        id: 's2',
        classId: class7B,
        periods: [
          { startTime: '09:00', endTime: '10:00', teacherId: { _id: 't3', name: 'Petru' }, subject: 'C' },
        ],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class6C._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '08:30', endTime: '09:30', teacherId: teacher1._id }],
      null
    );

    expect(conflicts.filter((c) => c.type === 'teacher_conflict')).toHaveLength(1);
  });

  it('returns empty array when no existing schedules', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([]);
    const conflicts = await computeScheduleConflicts(
      class5A._id,
      1,
      1,
      1,
      2024,
      [{ startTime: '10:00', endTime: '11:00', teacherId: teacher1._id }],
      null
    );
    expect(conflicts).toEqual([]);
  });

  it('handles multiple new periods in one request', async () => {
    repository.findSchedulesForConflictCheck.mockResolvedValue([
      makeSchedule({
        id: 's1',
        classId: class5A,
        periods: [{
          startTime: '10:00',
          endTime: '11:00',
          teacherId: teacher1,
          subject: 'Math',
        }],
      }),
    ]);

    const conflicts = await computeScheduleConflicts(
      class5A._id,
      1,
      1,
      1,
      2024,
      [
        { startTime: '08:00', endTime: '09:00', teacherId: 't9' },
        { startTime: '10:30', endTime: '11:30', teacherId: 't9' },
      ],
      null
    );

    expect(conflicts.some((c) => c.type === 'class_conflict')).toBe(true);
  });
});
