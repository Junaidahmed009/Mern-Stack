import mongoose from "mongoose";

const connectDb = async () => {
  mongoose.connection.on("connected", () => console.log("DataBase Connected"));
  //connecting to Db and putting URl from .env and mern-auth the DB name
  await mongoose.connect(`${process.env.MONGODB_URL}/mern-auth`);
};

export default connectDb;
