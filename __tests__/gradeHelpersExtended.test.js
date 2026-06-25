const {
  cloneEmptyGradeStats,
  cloneEmptySubjectStats,
  buildClassroomFlags,
  appendHomeroomClassIfMissing,
  buildGradeRankingItem,
  buildAttendanceRankingItem,
} = require('../controllers/gradeController/helpers');

describe('gradeController/helpers (extended)', () => {
  describe('cloneEmptyGradeStats', () => {
    it('returns fresh empty stats object', () => {
      const stats = cloneEmptyGradeStats();
      expect(stats.averageGrade).toBe(0);
      expect(stats.subjects).toEqual([]);
      stats.subjects.push('x');
      expect(cloneEmptyGradeStats().subjects).toEqual([]);
    });
  });

  describe('cloneEmptySubjectStats', () => {
    it('returns empty subject stats with name', () => {
      const stats = cloneEmptySubjectStats('Math');
      expect(stats.subject).toBe('Math');
      expect(stats.grades).toEqual([]);
      expect(stats.finalGrade).toBeNull();
      expect(stats.totalClassmates).toBe(0);
    });
  });

  describe('buildClassroomFlags', () => {
    it('marks homeroom class for teacher', () => {
      const classrooms = [{
        _id: 'c1',
        name: '7A',
        homeroomTeacher: { _id: 't1' },
        toObject() {
          return { _id: this._id, name: this.name, homeroomTeacher: this.homeroomTeacher };
        },
      }];
      const result = buildClassroomFlags(classrooms, 't1');
      expect(result[0].isHomeroom).toBe(true);
    });

    it('marks non-homeroom class as false', () => {
      const classrooms = [{
        _id: 'c1',
        homeroomTeacher: { _id: 't2' },
        toObject() {
          return { _id: this._id, homeroomTeacher: this.homeroomTeacher };
        },
      }];
      const result = buildClassroomFlags(classrooms, 't1');
      expect(result[0].isHomeroom).toBe(false);
    });
  });

  describe('appendHomeroomClassIfMissing', () => {
    it('appends homeroom class when not in list', () => {
      const homeroom = {
        _id: 'c2',
        name: '8B',
        toObject() {
          return { _id: this._id, name: this.name };
        },
      };
      const result = appendHomeroomClassIfMissing([], [], homeroom, true);
      expect(result).toHaveLength(1);
      expect(result[0].isHomeroom).toBe(true);
      expect(result[0].isHomeroomOnly).toBe(true);
    });

    it('does not duplicate class already in list', () => {
      const homeroom = { _id: 'c1', toObject() { return { _id: 'c1' }; } };
      const list = [{ _id: 'c1' }];
      const classrooms = [{ _id: 'c1' }];
      const result = appendHomeroomClassIfMissing(classrooms, list, homeroom, false);
      expect(result).toBe(list);
    });

    it('returns list unchanged when no homeroom class', () => {
      const list = [{ _id: 'c1' }];
      expect(appendHomeroomClassIfMissing([], list, null, false)).toBe(list);
    });
  });

  describe('buildGradeRankingItem', () => {
    it('builds ranking entry', () => {
      const classmate = { _id: 's1', name: 'Ana' };
      expect(buildGradeRankingItem(classmate, 9.5)).toEqual({
        studentId: 's1',
        name: 'Ana',
        average: 9.5,
      });
    });
  });

  describe('buildAttendanceRankingItem', () => {
    it('builds attendance ranking entry', () => {
      const classmate = { _id: 's1', name: 'Ana' };
      expect(buildAttendanceRankingItem(classmate, 95)).toEqual({
        studentId: 's1',
        name: 'Ana',
        rate: 95,
      });
    });
  });
});
