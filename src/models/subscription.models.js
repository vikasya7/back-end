import { Schema } from "mongoose";
import mongoose from "mongoose";

const subscriptionSchema= new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,   // one who is suscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,   // one to whom suscriber is suscribing
        ref: "User"
    }
},{timestamps:true})

export const Subscription= mongoose.model("Subscription",subscriptionSchema)
