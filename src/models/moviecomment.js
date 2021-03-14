'use strict';
module.exports = (sequelize, DataTypes) => {
  const movieComment = sequelize.define('movieComment', {
    movieId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    text: DataTypes.TEXT
  }, {});
  movieComment.associate = function(models) {
    // associations can be defined here
    models.movieComment.belongsTo(models.User, { foreignKey: 'userId' });
    models.movieComment.belongsTo(models.movie, { foreignKey: 'movieId' });
  };
  return movieComment;
};