const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
const Classroom = require('./models/Classroom');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/schoolCatalog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Маппинг предметов с русского на английский
const subjectMapping = {
  'Математика': 'Mathematics',
  'Информатика': 'Computer Science',
  'Румынский язык': 'Romanian',
  'Английский язык': 'English',
  'Физкультура': 'Physical Education',
  'История': 'History',
  'Литература': 'Literature',
  'Биология': 'Biology',
  'География': 'Geography',
  'Химия': 'Chemistry',
  'Физика': 'Physics',
  'Французский язык': 'French',
  'Музыка': 'Music',
  'ИЗО': 'Art'
};

// Маппинг учителей - сначала найдем соответствие в базе
const teacherMapping = {
  'Teacher_Math': 'Mathematics',
  'Teacher_IT_1': 'Computer Science',
  'Teacher_IT_2': 'Computer Science',
  'Teacher_Rom_1': 'Romanian',
  'Teacher_Rom_2': 'Romanian',
  'Teacher_Eng_1': 'English',
  'Teacher_Eng_2': 'English',
  'Teacher_PE_1': 'Physical Education',
  'Teacher_PE_2': 'Physical Education',
  'Teacher_Bio': 'Biology',
  'Teacher_Chem': 'Chemistry',
  'Teacher_Phys': 'Physics',
  'Teacher_Fr': 'French',
  'Teacher_Geo': 'Geography',
  'Teacher_Hist': 'History',
  'Teacher_Lit': 'Literature',
  'Teacher_Music': 'Music',
  'Teacher_Art': 'Art'
};

// Временные слоты
const timeSlots = [
  { start: '08:00', end: '08:45' },
  { start: '09:00', end: '09:45' },
  { start: '10:00', end: '10:45' },
  { start: '11:00', end: '11:45' },
  { start: '12:00', end: '12:45' },
  { start: '13:00', end: '13:45' },
  { start: '14:00', end: '14:45' },
  { start: '15:00', end: '15:45' },
];

// Готовое расписание
const manualSchedule = {
  "monday": {
    "lesson_1": {
      "5A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "5B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "6A": {"subject": "Английский язык", "teacher": "Teacher_Eng_1"},
      "6B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "7A": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "7B": {"subject": "История", "teacher": "Teacher_Hist"},
      "8A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "8B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "9A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "9B": {"subject": "Информатика", "teacher": "Teacher_IT_2"}
    },
    "lesson_2": {
      "5A": {"subject": "Английский язык", "teacher": "Teacher_Eng_1"},
      "5B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "6A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "6B": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "7A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "7B": {"subject": "Английский язык", "teacher": "Teacher_Eng_2"},
      "8A": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "8B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "9B": {"subject": "Математика", "teacher": "Teacher_Math"}
    },
    "lesson_3": {
      "5A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "5B": {"subject": "Английский язык", "teacher": "Teacher_Eng_1"},
      "6A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "6B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "7A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7B": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "8A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "8B": {"subject": "Английский язык", "teacher": "Teacher_Eng_2"},
      "9A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"}
    },
    "lesson_4": {
      "5A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "5B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6A": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "6B": {"subject": "Английский язык", "teacher": "Teacher_Eng_1"},
      "7A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "7B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8A": {"subject": "Английский язык", "teacher": "Teacher_Eng_2"},
      "8B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "9A": {"subject": "Английский язык", "teacher": "Teacher_Eng_2"},
      "9B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"}
    },
    "lesson_5": {
      "5A": {"subject": "История", "teacher": "Teacher_Hist"},
      "5B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "6A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6B": {"subject": "История", "teacher": "Teacher_Hist"},
      "7A": {"subject": "Английский язык", "teacher": "Teacher_Eng_1"},
      "7B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "8A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "8B": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "9A": {"subject": "История", "teacher": "Teacher_Hist"},
      "9B": {"subject": "Английский язык", "teacher": "Teacher_Eng_2"}
    },
    "lesson_6": {
      "5A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "5B": {"subject": "История", "teacher": "Teacher_Hist"},
      "6A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "6B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "7B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "8A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8B": {"subject": "История", "teacher": "Teacher_Hist"},
      "9A": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "9B": {"subject": "История", "teacher": "Teacher_Hist"}
    },
    "lesson_7": {
      "8A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "8B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9B": {"subject": "Литература", "teacher": "Teacher_Lit"}
    },
    "lesson_8": {
      "8A": {"subject": "История", "teacher": "Teacher_Hist"},
      "8B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9B": {"subject": "Физика", "teacher": "Teacher_Phys"}
    }
  },
  "tuesday": {
    "lesson_1": {
      "5A": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "5B": {"subject": "География", "teacher": "Teacher_Geo"},
      "6A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "6B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "7A": {"subject": "География", "teacher": "Teacher_Geo"},
      "7B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "8A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "8B": {"subject": "География", "teacher": "Teacher_Geo"},
      "9A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "9B": {"subject": "Химия", "teacher": "Teacher_Chem"}
    },
    "lesson_2": {
      "5A": {"subject": "География", "teacher": "Teacher_Geo"},
      "5B": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "6A": {"subject": "География", "teacher": "Teacher_Geo"},
      "6B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "7A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "7B": {"subject": "География", "teacher": "Teacher_Geo"},
      "8A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "8B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9A": {"subject": "География", "teacher": "Teacher_Geo"},
      "9B": {"subject": "Биология", "teacher": "Teacher_Bio"}
    },
    "lesson_3": {
      "5A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "5B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "6A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "6B": {"subject": "География", "teacher": "Teacher_Geo"},
      "7A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "7B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "8A": {"subject": "География", "teacher": "Teacher_Geo"},
      "8B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "9A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9B": {"subject": "География", "teacher": "Teacher_Geo"}
    },
    "lesson_4": {
      "5A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "5B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "6A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "6B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "7A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "7B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "8A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "8B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9B": {"subject": "Французский язык", "teacher": "Teacher_Fr"}
    },
    "lesson_5": {
      "5A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "5B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "7A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "7B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "9A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "9B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"}
    },
    "lesson_6": {
      "5A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "5B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9B": {"subject": "ИЗО", "teacher": "Teacher_Art"}
    },
    "lesson_7": {
      "8A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "8B": {"subject": "История", "teacher": "Teacher_Hist"},
      "9A": {"subject": "История", "teacher": "Teacher_Hist"},
      "9B": {"subject": "Литература", "teacher": "Teacher_Lit"}
    },
    "lesson_8": {
      "8A": {"subject": "История", "teacher": "Teacher_Hist"},
      "8B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9B": {"subject": "История", "teacher": "Teacher_Hist"}
    }
  },
  "wednesday": {
    "lesson_1": {
      "5A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "5B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "6A": {"subject": "История", "teacher": "Teacher_Hist"},
      "6B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "7A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "7B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "8A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "8B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "9A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9B": {"subject": "Математика", "teacher": "Teacher_Math"}
    },
    "lesson_2": {
      "5A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "5B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "6A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "6B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "7A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "7B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "8A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "8B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "9A": {"subject": "Математика", "teacher": "Teacher_Math"},
      "9B": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"}
    },
    "lesson_3": {
      "5A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "5B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "6A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_1"},
      "6B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "7A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "7B": {"subject": "Математика", "teacher": "Teacher_Math"},
      "8A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "8B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9A": {"subject": "Румынский язык", "teacher": "Teacher_Rom_2"},
      "9B": {"subject": "Физика", "teacher": "Teacher_Phys"}
    },
    "lesson_4": {
      "5A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "5B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "6A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "6B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "7A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "7B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "8A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "8B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9B": {"subject": "Физика", "teacher": "Teacher_Phys"}
    },
    "lesson_5": {
      "5A": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "5B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "6A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "6B": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "7A": {"subject": "Информатика", "teacher": "Teacher_IT_1"},
      "7B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "8A": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "8B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9B": {"subject": "Информатика", "teacher": "Teacher_IT_2"}
    }
  },
  "thursday": {
    "lesson_1": {
      "5A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "5B": {"subject": "История", "teacher": "Teacher_Hist"},
      "6A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "6B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "7A": {"subject": "История", "teacher": "Teacher_Hist"},
      "7B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "8A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "8B": {"subject": "История", "teacher": "Teacher_Hist"},
      "9A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9B": {"subject": "Литература", "teacher": "Teacher_Lit"}
    },
    "lesson_2": {
      "5A": {"subject": "История", "teacher": "Teacher_Hist"},
      "5B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "6A": {"subject": "История", "teacher": "Teacher_Hist"},
      "6B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "7A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "7B": {"subject": "История", "teacher": "Teacher_Hist"},
      "8A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "8B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9A": {"subject": "История", "teacher": "Teacher_Hist"},
      "9B": {"subject": "Физика", "teacher": "Teacher_Phys"}
    },
    "lesson_3": {
      "5A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "5B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "6A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "6B": {"subject": "История", "teacher": "Teacher_Hist"},
      "7A": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "7B": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "8A": {"subject": "История", "teacher": "Teacher_Hist"},
      "8B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "9A": {"subject": "Информатика", "teacher": "Teacher_IT_2"},
      "9B": {"subject": "История", "teacher": "Teacher_Hist"}
    },
    "lesson_4": {
      "5A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "5B": {"subject": "Физика", "teacher": "Teacher_Phys"},
      "6A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "7A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "7B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8B": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9A": {"subject": "Химия", "teacher": "Teacher_Chem"},
      "9B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"}
    },
    "lesson_5": {
      "5A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "5B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "7A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "7B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9B": {"subject": "ИЗО", "teacher": "Teacher_Art"}
    }
  },
  "friday": {
    "lesson_1": {
      "5A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "5B": {"subject": "География", "teacher": "Teacher_Geo"},
      "6A": {"subject": "География", "teacher": "Teacher_Geo"},
      "6B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "7A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "7B": {"subject": "География", "teacher": "Teacher_Geo"},
      "8A": {"subject": "География", "teacher": "Teacher_Geo"},
      "8B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "9A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "9B": {"subject": "География", "teacher": "Teacher_Geo"}
    },
    "lesson_2": {
      "5A": {"subject": "География", "teacher": "Teacher_Geo"},
      "5B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "6A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "6B": {"subject": "География", "teacher": "Teacher_Geo"},
      "7A": {"subject": "География", "teacher": "Teacher_Geo"},
      "7B": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "8A": {"subject": "Биология", "teacher": "Teacher_Bio"},
      "8B": {"subject": "География", "teacher": "Teacher_Geo"},
      "9A": {"subject": "География", "teacher": "Teacher_Geo"},
      "9B": {"subject": "Биология", "teacher": "Teacher_Bio"}
    },
    "lesson_3": {
      "5A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "5B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "6A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "6B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "7A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "7B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "8A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "8B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "9A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "9B": {"subject": "Музыка", "teacher": "Teacher_Music"}
    },
    "lesson_4": {
      "5A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "5B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "6A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "6B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "7A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "7B": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "8A": {"subject": "Французский язык", "teacher": "Teacher_Fr"},
      "8B": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9A": {"subject": "Музыка", "teacher": "Teacher_Music"},
      "9B": {"subject": "Французский язык", "teacher": "Teacher_Fr"}
    },
    "lesson_5": {
      "5A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "5B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "6B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "7A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "7B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "8B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "9A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "9B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"}
    },
    "lesson_6": {
      "5A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "5B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "6B": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7A": {"subject": "Физкультура", "teacher": "Teacher_PE_1"},
      "7B": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8A": {"subject": "ИЗО", "teacher": "Teacher_Art"},
      "8B": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9A": {"subject": "Физкультура", "teacher": "Teacher_PE_2"},
      "9B": {"subject": "ИЗО", "teacher": "Teacher_Art"}
    },
    "lesson_7": {
      "8A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "8B": {"subject": "История", "teacher": "Teacher_Hist"},
      "9A": {"subject": "История", "teacher": "Teacher_Hist"},
      "9B": {"subject": "Литература", "teacher": "Teacher_Lit"}
    },
    "lesson_8": {
      "8A": {"subject": "История", "teacher": "Teacher_Hist"},
      "8B": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9A": {"subject": "Литература", "teacher": "Teacher_Lit"},
      "9B": {"subject": "История", "teacher": "Teacher_Hist"}
    }
  }
};

async function loadManualSchedule() {
  try {
    console.log('🏫 Загрузка мануального расписания...\n');
    
    // 1. Получаем данные из базы
    const classrooms = await Classroom.find({}).sort({ name: 1 });
    const teachers = await User.find({ role: 'teacher' }).sort({ name: 1 });
    
    console.log(`Классы: ${classrooms.map(c => c.name).join(', ')}`);
    console.log(`Учителя: ${teachers.length}\n`);
    
    // 2. Создаем мапы для быстрого поиска
    const classroomMap = {};
    classrooms.forEach(classroom => {
      classroomMap[classroom.name] = classroom;
    });
    
    const teacherBySubject = {};
    teachers.forEach(teacher => {
      if (teacher.subjects && teacher.subjects.length > 0) {
        teacher.subjects.forEach(subject => {
          if (!teacherBySubject[subject]) teacherBySubject[subject] = [];
          teacherBySubject[subject].push(teacher);
        });
      }
    });
    
    // 3. Удаляем старые расписания
    console.log('🗑️  Удаляем старые расписания...');
    await Schedule.deleteMany({});
    console.log('✅ Старые расписания удалены\n');
    
    // 4. Загружаем новое расписание
    console.log('📅 Загружаем новое расписание...\n');
    
    const dayMapping = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5
    };
    
    let totalLessons = 0;
    let successLessons = 0;
    
    for (const [dayName, daySchedule] of Object.entries(manualSchedule)) {
      const dayOfWeek = dayMapping[dayName];
      console.log(`📋 ${dayName.toUpperCase()} (день ${dayOfWeek}):`);
      
      // Группируем уроки по классам
      const classSchedules = {};
      
      for (const [lessonSlot, lessonData] of Object.entries(daySchedule)) {
        const lessonNumber = parseInt(lessonSlot.split('_')[1]) - 1; // lesson_1 -> 0
        const timeSlot = timeSlots[lessonNumber];
        
        if (!timeSlot) continue;
        
        for (const [className, lessonInfo] of Object.entries(lessonData)) {
          if (!lessonInfo || !classroomMap[className]) continue;
          
          totalLessons++;
          
          if (!classSchedules[className]) {
            classSchedules[className] = [];
          }
          
          const englishSubject = subjectMapping[lessonInfo.subject];
          if (!englishSubject) {
            console.log(`❌ Неизвестный предмет: ${lessonInfo.subject}`);
            continue;
          }
          
          // Ищем учителя
          const availableTeachers = teacherBySubject[englishSubject];
          if (!availableTeachers || availableTeachers.length === 0) {
            console.log(`❌ Нет учителей для предмета: ${englishSubject}`);
            continue;
          }
          
          // Берем первого доступного учителя
          const teacher = availableTeachers[0];
          
          classSchedules[className].push({
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            subject: englishSubject,
            teacherId: teacher._id,
            room: `Room ${Math.floor(Math.random() * 25) + 1}`,
          });
          
          successLessons++;
        }
      }
      
      // Создаем расписания для каждого класса
      for (const [className, periods] of Object.entries(classSchedules)) {
        const classroom = classroomMap[className];
        if (!classroom) continue;
        
        const schedule = new Schedule({
          classId: classroom._id,
          dayOfWeek: dayOfWeek,
          year: 2025,
          semester: 1,
          week: 1,
          periods: periods,
        });
        
        await schedule.save();
        console.log(`   ✅ ${className}: ${periods.length} уроков`);
      }
      
      console.log('');
    }
    
    // 5. Проверяем результат
    console.log('🔍 Проверяем результат...\n');
    const finalSchedules = await Schedule.find({}).populate('classId', 'name');
    
    const classCounts = {};
    finalSchedules.forEach(schedule => {
      const className = schedule.classId.name;
      if (!classCounts[className]) classCounts[className] = 0;
      classCounts[className] += schedule.periods.length;
    });
    
    console.log('📊 Итоговая статистика:');
    Object.keys(classCounts).forEach(className => {
      console.log(`${className}: ${classCounts[className]} уроков в неделю`);
    });
    
    console.log(`\n✅ Загрузка завершена: ${successLessons}/${totalLessons} уроков успешно загружено`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    mongoose.connection.close();
  }
}

loadManualSchedule(); 