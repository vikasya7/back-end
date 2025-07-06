import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessTokenAndRefreshToken =async(userId)=>{
  try{
     const user =await User.findById(userId)
     const accessToken= user.generateAccessToken()

     const refreshToken= user.generateRefreshToken()

     user.refreshToken=refreshToken
     await user.save({validateBeforeSave: false})

     return {accessToken, refreshToken}





  }catch(error){
    throw new ApiError(500,"something went wrong while generating refresh and access tokens")
  }
}


const registerUser= asyncHandler(async (req,res)=>{
    // get user details from front-end
    // validation can be put on front-end also can be put on back-end
    // check if user already exist: username,email
    // check for images, check for avatar(compulsary)
    // upload them to cloudinary,avatar
    // create user object--> create entry in db
    // remove password and refresh token field
    // ckeck for user creation
    // return response


     const {fullname, email, username,password} =req.body
     //console.log("email:",email);

    if (
        [fullname,email,username,password].some((field)=>
              field?.trim()===""
        )
    ){
           throw new ApiError(400, "All fields are required")
    }

     const existingUser= await User.findOne({
        $or: [{username},{email}]
     })

     if (existingUser){
        throw new ApiError(409,"user with email or username already exist")
     }

     //console.log(req.files);
     

    const avatarLocalPath= req.files?.avatar[0]?.path
    //console.log("avatar local path :",avatarLocalPath);
    
    //const coverImageLocalPath=req.files?.coverImage[0]?.path
    //console.log("coverimagelocalpath :",coverImageLocalPath);
       
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0 ){
      coverImageLocalPath=req.files.coverImage[0].path

    }
   
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    //console.log("☁️ Cloudinary avatar upload response:", avatar);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    //console.log("☁️ Cloudinary coverImage upload response:", coverImage);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

     const user=  await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })

      const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
      )

      if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
      }

      return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
      )






})


const loginUser = asyncHandler(async (req,res)=>{
    // req body-->data
    // username or email
    // find the user
    // check password
    // access and refresh token
    // send cookie


    const {email,username,password}=req.body

    if(!username || !email){
      throw new ApiError(400,"username or email is required")

    }
    const user=await User.findOne({
      $or: [{username},{email}]
    })
     if(!user){
      throw new ApiError(404,"user does not exist")
     }

     const isPasswordValid= await user.isPasswordCorrect(password)

      if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials")
     }

     const {refreshToken,accessToken} = await generateAccessTokenAndRefreshToken(user._id)

     const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

     const options={
      httpOnly:true,
      secure:true
     }

     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
       new ApiResponse(
        200,
        {
          user:loggedInUser,
          refreshToken,accessToken
        },
        "User logged in successfully"
       )
     )
})


const logoutUser= asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }

    },
    {
      new:true
    }
  )
  const options={
      httpOnly:true,
      secure:true
     }
     return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{},"user logged out"))
   
})



export {registerUser, loginUser, logoutUser}
    
