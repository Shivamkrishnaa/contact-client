

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('projects', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    projectName: {
      type: Sequelize.STRING
    },
    clientName: {
      type: Sequelize.STRING
    },
    startDate: {
      type: Sequelize.DATE,
      default: Date.now()
    },
    numberOfEmployee: {
      type: Sequelize.INTEGER,
      default: 0
    },
    experienceRequired: {
      type: Sequelize.INTEGER
    },
    skillsRequired: {
      type: Sequelize.STRING
    },
    location: {
      type: Sequelize.ENUM('MUMBAI', 'DELHI', 'CHENNAI'),
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }),
  down: queryInterface => queryInterface.dropTable('projects')
};
