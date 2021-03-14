

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('movies', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING
    },
    totalAvgRating: {
      type: Sequelize.DECIMAL(10, 2)
    },
    totalRatingCount: {
      type: Sequelize.INTEGER
    },
    totalCommentCount: {
      type: Sequelize.INTEGER
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('movies')
};
