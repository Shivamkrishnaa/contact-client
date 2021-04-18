

module.exports = (sequelize, DataTypes) => {
  const project = sequelize.define('project', {
    projectName: DataTypes.STRING,
    clientName: DataTypes.STRING,
    startDate: DataTypes.DATE,
    numberOfEmployee: DataTypes.INTEGER,
    experienceRequired: DataTypes.INTEGER,
    skillsRequired: DataTypes.STRING,
    location: DataTypes.STRING
  }, {});
  project.associate = function (models) {
    // associations can be defined here
  };
  return project;
};
