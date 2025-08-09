import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME;

  if (!uri) {
    throw new Error("MONGODB_URI is not Defined in environment variables");
  }

  try {
    await mongoose.connect(uri, {
      dbName: "Chat-App",
    });
    console.log(`Connected to MongoDB database`);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
