'use strict';
module.exports = (sequelize, DataTypes) => {
  const movie = sequelize.define('movie', {
    name: DataTypes.STRING,
    totalAvgRating: DataTypes.INTEGER,
    totalRatingCount: DataTypes.INTEGER
  }, {});
  movie.associate = function(models) {
    // associations can be defined here
    models.movie.hasMany(models.movieComment, {foreignKey: 'userId'});
    models.movie.hasMany(models.movieRating, {foreignKey: 'movieId'});
  };
  return movie;
};