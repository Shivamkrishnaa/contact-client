

const crypto = require('crypto');

const location = ['MUMBAI', 'DELHI', 'CHENNAI'];
module.exports = {
  up: queryInterface => queryInterface.bulkInsert('projects', [{
    projectName: crypto.randomBytes(10).toString('hex'),
    clientName: crypto.randomBytes(10).toString('hex'),
    startDate: new Date(),
    numberOfEmployee: '10',
    experienceRequired: 1,
    skillsRequired: crypto.randomBytes(10).toString('hex'),
    location: location[Math.floor(Math.random() * 3) + 0],
    createdAt: new Date(),
    updatedAt: new Date()
  }], {}),

  down: queryInterface => queryInterface.bulkDelete('projects', { }, {})
};
