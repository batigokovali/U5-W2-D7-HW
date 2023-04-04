import mongoose from "mongoose"

const { Schema, model } = mongoose

const authorsSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        avatar: { type: String },
    },
    {
        timestamps: true,
    }
)

export default model("Author", authorsSchema)