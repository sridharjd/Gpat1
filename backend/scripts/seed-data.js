const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedData() {
  try {
    console.log('Starting to seed data...');

    // Check if test user exists
    const [existingUser] = await db.query('SELECT username FROM users WHERE username = ?', ['testuser']);
    
    if (!existingUser.length) {
      // Create a test user
      const hashedPassword = await bcrypt.hash('test123', 10);
      await db.query(
        `INSERT INTO users (username, email, password, first_name, last_name, is_verified) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['testuser', 'test@example.com', hashedPassword, 'Test', 'User', true]
      );
      console.log('Created test user');
    } else {
      console.log('Test user already exists');
    }

    // Clear existing performance data for test user
    await db.query('DELETE FROM user_performance WHERE username = ?', ['testuser']);

    // Add some sample performance data
    const testScores = [75, 82, 68, 90, 85];
    for (const score of testScores) {
      await db.query(
        `INSERT INTO user_performance (username, score, total_questions, correct_answers, incorrect_answers) 
         VALUES (?, ?, ?, ?, ?)`,
        ['testuser', score, 50, Math.round((score/100) * 50), Math.round((1 - score/100) * 50)]
      );
    }
    console.log('Added sample performance data');

    // Add sample questions
    // First get subject IDs
    const [subjects] = await db.query('SELECT id, name FROM subjects');
    const subjectMap = subjects.reduce((acc, subject) => {
      acc[subject.name] = subject.id;
      return acc;
    }, {});

    // Sample questions for each subject
    const sampleQuestions = [
      {
        subject: 'Pharmaceutical Chemistry',
        questions: [
          {
            text: 'Which functional group is responsible for the analgesic activity of paracetamol?',
            options: ['Hydroxyl', 'Amine', 'Amide', 'Carboxyl'],
            correct: 'C',
            year: 2023
          },
          {
            text: 'What is the primary mechanism of action of aspirin?',
            options: ['COX inhibition', 'Beta-blocking', 'ACE inhibition', 'Channel blocking'],
            correct: 'A',
            year: 2023
          }
        ]
      },
      {
        subject: 'Pharmaceutics',
        questions: [
          {
            text: 'Which type of flow is exhibited by pseudoplastic materials?',
            options: ['Newtonian', 'Non-newtonian', 'Dilatant', 'Plastic'],
            correct: 'B',
            year: 2024
          },
          {
            text: 'What is the purpose of a disintegrant in tablet formulation?',
            options: ['Binding', 'Breaking', 'Flowing', 'Lubricating'],
            correct: 'B',
            year: 2024
          }
        ]
      }
    ];

    // Insert sample questions
    for (const subjectData of sampleQuestions) {
      const subjectId = subjectMap[subjectData.subject];
      if (subjectId) {
        for (const q of subjectData.questions) {
          await db.query(
            `INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, year) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [subjectId, q.text, q.options[0], q.options[1], q.options[2], q.options[3], q.correct, q.year]
          );
        }
      }
    }
    console.log('Added sample questions');

    console.log('Data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
