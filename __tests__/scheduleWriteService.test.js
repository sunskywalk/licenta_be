jest.mock('../controllers/scheduleController/repository');

const repository = require('../controllers/scheduleController/repository');
const {
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController/scheduleWrite.service');

const baseBody = {
  classId: 'class5A',
  dayOfWeek: 1,
  week: 1,
  semester: 1,
  year: 2024,
  periods: [{ startTime: '08:00', endTime: '09:00', teacherId: 't1' }],
};

describe('scheduleWrite.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repository.findSchedulesForConflictCheck.mockResolvedValue([]);
  });

  describe('createSchedule', () => {
    it('creates schedule when no conflicts', async () => {
      const inserted = { _id: 's1', ...baseBody };
      const populated = {
        _id: 's1',
        periods: [
          { startTime: '09:00', endTime: '10:00' },
          { startTime: '08:00', endTime: '09:00' },
        ],
      };
      repository.insertSchedule.mockResolvedValue(inserted);
      repository.findByIdWithClassAndTeachers.mockResolvedValue(populated);

      const result = await createSchedule(baseBody);

      expect(result.ok).toBe(true);
      expect(result.schedule.periods[0].startTime).toBe('08:00');
      expect(repository.insertSchedule).toHaveBeenCalled();
    });

    it('returns conflicts without inserting', async () => {
      repository.findSchedulesForConflictCheck.mockResolvedValue([{
        classId: { _id: 'class5A', name: '5A' },
        periods: [{
          startTime: '08:30',
          endTime: '09:30',
          teacherId: { _id: 't1', name: 'Ion' },
          subject: 'Math',
        }],
      }]);

      const result = await createSchedule(baseBody);

      expect(result.ok).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(repository.insertSchedule).not.toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    it('updates schedule when no conflicts', async () => {
      const updated = {
        _id: 's1',
        periods: [{ startTime: '10:00', endTime: '11:00' }],
      };
      repository.updateScheduleById.mockResolvedValue(updated);

      const result = await updateSchedule('s1', baseBody);

      expect(result.ok).toBe(true);
      expect(repository.updateScheduleById).toHaveBeenCalledWith('s1', expect.objectContaining({
        classId: baseBody.classId,
      }));
    });

    it('returns notFound when schedule missing', async () => {
      repository.updateScheduleById.mockResolvedValue(null);

      const result = await updateSchedule('missing', baseBody);

      expect(result.ok).toBe(false);
      expect(result.notFound).toBe(true);
    });

    it('blocks update on conflicts', async () => {
      repository.findSchedulesForConflictCheck.mockResolvedValue([{
        classId: { _id: 'class5A', name: '5A' },
        periods: [{
          startTime: '08:30',
          endTime: '09:30',
          teacherId: { _id: 't2', name: 'Maria' },
          subject: 'Physics',
        }],
      }]);

      const result = await updateSchedule('s1', baseBody);

      expect(result.ok).toBe(false);
      expect(result.conflicts).toBeDefined();
    });
  });

  describe('deleteSchedule', () => {
    it('returns deleted true when schedule removed', async () => {
      repository.deleteScheduleById.mockResolvedValue({ _id: 's1' });
      const result = await deleteSchedule('s1');
      expect(result.deleted).toBe(true);
    });

    it('returns deleted false when schedule not found', async () => {
      repository.deleteScheduleById.mockResolvedValue(null);
      const result = await deleteSchedule('missing');
      expect(result.deleted).toBe(false);
    });
  });
});
