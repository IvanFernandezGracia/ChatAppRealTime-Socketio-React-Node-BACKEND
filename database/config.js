const mongoose = require("mongoose");

const dbConnection = async () => {
  const username = encodeURIComponent(process.env.MONGO_USER);
  const password = encodeURIComponent(process.env.MONGO_PASSWORD);
  const cluster = process.env.MONGO_CLUSTER;
  const folder = process.env.MONGO_FOLDER;

  const uri = `mongodb+srv://${username}:${password}@${cluster}/${folder}`;

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    console.log("DB online");
  } catch (error) {
    console.log(error);
    throw new Error("Error en la base de datos - vea logs : " + error);
  }
};

module.exports = {
  dbConnection,
};
