

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('movieRatings', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    movieId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'movies',
        key: 'id'
      }
    },
    userId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    rating: {
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
  down: queryInterface => queryInterface.dropTable('movieRatings')
};
