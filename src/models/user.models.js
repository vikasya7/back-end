import mongoose, {Schema} from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcrypt"


const userSchema= new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true, // if you want to search that field
        },
         email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            
        },
        fullname:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            index:true
            
        },
        avatar:{
            type:String, //cloudinary or aws url
            required:true,
        },
        coverImage:{
            type:String,  //cloudinary or aws url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required: [true,'password is required']
        },
        refreshToken:{
            type:String
        }

        


    },
    {
        timestamps:true
    }
)


userSchema.pre("save", async function(next){  // do not use directly callback function as we cannot use this
     if(!this.isModified("password")) return next();

     
    return await bcrypt.hash(this.password,10)
     next()
} ) 

userSchema.methods.isPasswordCorrect= async function 
(password){
    bcrypt.compare(password,this.password)
}
    
userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
) 
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
) 
}
userSchema.methods.generateRefreshToken=function(){}


export const User=mongoose.model("User",userSchema)