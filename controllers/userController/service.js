// barrel so routes/controller stay thin; split files keep each service file under the line budget
module.exports = {
  ...require('./userRead.service'),
  ...require('./userWrite.service'),
};
