const mongoose = require('mongoose');
const User = require('./models/User');

// Список правильных учителей
const properTeachers = [
  {
    code: 'Prof_Math_1',
    name: 'Prof. Maria Ionescu',
    email: 'maria.ionescu@school.ro',
    subject: 'Matematica',
    classes: ['5A', '5B']
  },
  {
    code: 'Prof_Math_2', 
    name: 'Prof. Alexandru Popescu',
    email: 'alexandru.popescu@school.ro',
    subject: 'Matematica',
    classes: ['6A', '6B']
  },
  {
    code: 'Prof_Math_3',
    name: 'Prof. Elena Marinescu',
    email: 'elena.marinescu@school.ro', 
    subject: 'Matematica',
    classes: ['7A', '7B', '8A', '8B']
  },
  {
    code: 'Prof_Math_4',
    name: 'Prof. Victor Radu',
    email: 'victor.radu@school.ro',
    subject: 'Matematica', 
    classes: ['9A', '9B']
  },
  {
    code: 'Prof_ROM_1',
    name: 'Prof. Ana Constantinescu',
    email: 'ana.constantinescu@school.ro',
    subject: 'Limba română',
    classes: ['5A', '5B', '6A', '6B']
  },
  {
    code: 'Prof_ROM_2',
    name: 'Prof. Mihai Georgescu',
    email: 'mihai.georgescu@school.ro',
    subject: 'Limba română',
    classes: ['7A', '7B', '8A']
  },
  {
    code: 'Prof_ROM_3',
    name: 'Prof. Daniela Vasile',
    email: 'daniela.vasile@school.ro',
    subject: 'Limba română',
    classes: ['9A', '9B']
  },
  {
    code: 'Prof_ENG_1',
    name: 'Prof. John Smith',
    email: 'john.smith@school.ro',
    subject: 'Engleză',
    classes: ['5A', '5B', '6A', '6B']
  },
  {
    code: 'Prof_ENG_2', 
    name: 'Prof. Sarah Johnson',
    email: 'sarah.johnson@school.ro',
    subject: 'Engleză',
    classes: ['7A', '7B', '8A', '8B']
  },
  {
    code: 'Prof_ENG_3',
    name: 'Prof. Michael Brown',
    email: 'michael.brown@school.ro',
    subject: 'Engleză',
    classes: ['9A', '9B']
  },
  {
    code: 'Prof_FR',
    name: 'Prof. Claire Dubois',
    email: 'claire.dubois@school.ro',
    subject: 'Franceză',
    classes: ['7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_IST',
    name: 'Prof. Constantin Iorga',
    email: 'constantin.iorga@school.ro',
    subject: 'Istorie',
    classes: ['5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_GEO',
    name: 'Prof. Georgeta Munteanu',
    email: 'georgeta.munteanu@school.ro',
    subject: 'Geografie',
    classes: ['5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_BIO',
    name: 'Prof. Laura Stefanescu',
    email: 'laura.stefanescu@school.ro',
    subject: 'Biologie',
    classes: ['5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_FIZ',
    name: 'Prof. Petru Antonescu',
    email: 'petru.antonescu@school.ro',
    subject: 'Fizică',
    classes: ['7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_CHIM',
    name: 'Prof. Carmen Vasilescu',
    email: 'carmen.vasilescu@school.ro',
    subject: 'Chimie',
    classes: ['7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_TIC',
    name: 'Prof. Adrian Pavel',
    email: 'adrian.pavel@school.ro',
    subject: 'TIC',
    classes: ['5A', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_ART',
    name: 'Prof. Ioana Cristea',
    email: 'ioana.cristea@school.ro',
    subject: 'Educație plastică',
    classes: ['5A', '5B', '6A', '6B']
  },
  {
    code: 'Prof_MUZ',
    name: 'Prof. Nicolae Dinu',
    email: 'nicolae.dinu@school.ro',
    subject: 'Educație muzicală',
    classes: ['5A', '5B', '6A', '6B']
  },
  {
    code: 'Prof_TECH',
    name: 'Prof. Radu Nicolaescu',
    email: 'radu.nicolaescu@school.ro',
    subject: 'Tehnologii',
    classes: ['5B', '6A', '6B', '8A']
  },
  {
    code: 'Prof_EF_1',
    name: 'Prof. Gheorghe Radulescu',
    email: 'gheorghe.radulescu@school.ro',
    subject: 'Educație fizică',
    classes: ['5A', '5B', '6A', '6B']
  },
  {
    code: 'Prof_EF_2',
    name: 'Prof. Doina Petrescu',
    email: 'doina.petrescu@school.ro',
    subject: 'Educație fizică',
    classes: ['7A', '7B', '8A', '8B', '9A', '9B']
  },
  {
    code: 'Prof_REL',
    name: 'Prof. Father Vasile',
    email: 'vasile.priest@school.ro',
    subject: 'Educație religioasă',
    classes: ['5B', '6B']
  },
  {
    code: 'Prof_EC',
    name: 'Prof. Lucia Mihalache',
    email: 'lucia.mihalache@school.ro',
    subject: 'Educație civică',
    classes: ['8A', '8B', '9B']
  }
];

async function createProperTeachers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/schoolCatalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Удалить всех существующих учителей
    console.log('🗑️ Deleting old teachers...');
    await User.deleteMany({ role: 'teacher' });
    console.log('✅ Old teachers deleted');

    // 2. Создать новых учителей
    console.log(`👨‍🏫 Creating ${properTeachers.length} proper teachers...`);
    
    for (let i = 0; i < properTeachers.length; i++) {
      const teacher = properTeachers[i];
      
      const newTeacher = {
        name: teacher.name,
        email: teacher.email,
        password: 'teacher123', // Пароль будет хэширован в схеме
        role: 'teacher',
        subjects: [teacher.subject], // Используем массив как в модели
        teacherCode: teacher.code
      };

      try {
        await User.create(newTeacher);
        console.log(`✅ Created teacher ${i + 1}/${properTeachers.length}: ${teacher.name} (${teacher.code})`);
      } catch (error) {
        console.error(`❌ Error creating teacher ${teacher.name}:`, error.message);
      }
    }

    console.log('🎉 All proper teachers created successfully!');
    
    // Проверка результата
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    console.log(`📊 Total teachers in database: ${totalTeachers}`);

    // Показать созданных учителей
    console.log('\n📋 Created teachers:');
    const teachers = await User.find({ role: 'teacher' }).select('name teacherCode subjects');
    teachers.forEach(teacher => {
      console.log(`  ${teacher.teacherCode}: ${teacher.name} - ${teacher.subjects[0]}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

// Запускаем скрипт
createProperTeachers(); 