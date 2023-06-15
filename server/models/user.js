// User Model
import mongoose from "mongoose";
const { Schema, ObjectId } = mongoose; // const Schema = mongoose.Schema;

//create schema for the User model
const schema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      maxLength: 256,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    photo: {},
    role: {
      type: [String],
      default: ["Buyer"],
      enum: ["Buyer", "Seller", "Admin"],
    },
    enquiredProperties: [{ type: ObjectId, ref: "Ad" }],
    wishlist: [{ type: ObjectId, ref: "Ad" }],
    resetCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

//create User model
const model = mongoose.model("User", schema);

export default model;
