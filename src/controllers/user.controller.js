import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

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


const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }
   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
    const user=await User.findById(decodedToken?._id)
    if(!user){
     throw new ApiError(401,"invalid refresh token")
    }
 
    if(incomingRefreshToken !==user?.refreshToken){
     throw new ApiError(401,"refresh token is expired or used")
    }
 
    const options={
     httppOnly:true,
     secure:true
    }
 
    const {accessToken, newRefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
       200,
       {accessToken,refreshToken:newRefreshToken},
       "access token refreshed"
     )
    )
   } catch (error) {
       throw new ApiError(401, error?.message || "invalid refresh token")
    
   }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword, newPassword}=req.body 

  const user=await User.findById(req.user?._id)
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400,"invalid old password")
   }

   user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})


const getCurrentUser= asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  const user=User.findByIdAndUpdate(req.user?._id,
      {
        $set:{fullname, email:email}
      },
      {new :true}
  ).select("-password ")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Accounts details successfully updated " ))
})


const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath= req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is missing")
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400,"error while updating on avatar")

  }
 const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {
      new :true
    }
  ).select("-password")
   return res.status(200).json(new ApiResponse(200,user,"avatar image updated"))
})

const updateCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath= req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"avatar file is missing")
  }

  const coverImage= await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(400,"error while updating on CoverImage")

  }
  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {
      new :true
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"cover image updated"))
})



export {registerUser, loginUser, logoutUser,refreshAccessToken,getCurrentUser,updateAccountDetails,updateUserAvatar,updateCoverImage}
    
