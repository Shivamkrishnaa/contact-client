'use strict';
module.exports = (sequelize, DataTypes) => {
  const movieRating = sequelize.define('movieRating', {
    movieId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    rating: DataTypes.INTEGER
  }, {});
  movieRating.associate = function(models) {
    // associations can be defined here
    models.movieRating.belongsTo(models.User, { foreignKey: 'userId' });
    models.movieRating.belongsTo(models.movie, { foreignKey: 'movieId' });
  };
  return movieRating;
};