import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  Jwt  from "jsonwebtoken";


const generateAccessTokenAndRefereshTokens = async(userId)=>{
    try{
            const user = await User.findById(userId);
           const accessToken =  user.generateAccessToken()
            const refreshtoken = user.generateRefreshToken()

            user.refreshToken = refreshtoken;
            await user.save({validateBeforeSave:false});

            return {accessToken, refreshtoken}
    }catch(error)
    {
      throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const UserRegister = asyncHandler( async (req, res) =>{
    // res.status(200).json({
    //     message: "ok"
    // })

    const {email, username, password, fullname} = req.body
    // Another way to check or validate all the fields so that
    if([fullname,email,username,password].some((field)=> field?.trim()===""))
    {
        throw new ApiError(400,"All fields are required and compulsory")
    }
    // Task 1: write code for validation
    // if(fullname === "")
    // {
    //      throw new ApiError(400, "Fullname is required")
    // }

   const existedUser =  await User.findOne({
        $or :[{username}, {email}]
    })

  if(existedUser)
  {
    throw new ApiError(409,"user with email or Username exist")
  }
 const avatarLocalPath =  req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  if(!avatarLocalPath)
  {
    throw new ApiError(400,"Avatar file is required")
  }

 const avatar= await uploadCloudinary(avatarLocalPath)
 const coverImage = await uploadCloudinary(coverImageLocalPath)

 if(!avatar)
 {
    throw new ApiError(400, "Avatar required!")
 }
  
 const user = await User.create({fullname,
    avatar:avatar.url,
    coverImage: coverImage?.url|| "",
     email, 
     username: username.toLowerCase(),
     password
    })

 const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!createdUser)
 {
    throw new ApiError(500, "Something went wrong while registering a user")
 }
  
 return res.status(201).json(
    new ApiResponse(200,createdUser, "User registed Successfully")
 )
})

// Login User
const loginUser = asyncHandler(async (req, res)=>{
   
   // req body -> data
   // username or email
   // find the user 
   // password check
   // access and refresh token
   // send cookie

   const {username, email, password}= req.body
   if(!(username || email))
   {
      throw new ApiError(400,"username or password is required");
   }

   const user = await User.findOne({
      $or : [{username}, {email}]
   })

   if(!user)
   {
      throw new ApiError(404, "User does not exist")
   }

   const ispasswordValid = await user.isPasswordCorrect(password)
   if(!ispasswordValid)
   {
      throw new ApiError(401,"Invalid user credentials ")
   }

   const {accessToken, refreshtoken} =await generateAccessTokenAndRefereshTokens(user._id)

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken")

   const options = {
      httpOnly:true,
      secure: true
   }

   return res.status(200).cookie("accessToken", accessToken, options)
   .cookie("refreshToken" ,refreshtoken, options)
   .json(
      new ApiResponse(200,
         {
            user:loggedInUser, accessToken, refreshtoken
         },
         "user logged in Successfully"
         )
   )
})

// Logout user 
const logoutUser = asyncHandler(async(req, res)=>{
     await User.findByIdAndUpdate(
         req.user._id,{
            $set : {
               refreshToken:undefined
            }
         },
         {
            new : true
         }
      )

      const options = {
         httpOnly:true,
         secure: true
      }
      
      return res
      .status(200)
      .clearCookie("accessToken", options).
      clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"))
})

// RefreshAccessToken
const refreshAccessToken  = asyncHandler(async(req, res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken)
   {
      throw new ApiError(401,"UnAuthorized Request" )
   }

  try {
   const decodedToken = Jwt.verify(
       incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user)
    {
       throw new ApiError(401, "Invalid Refresh Token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken)
    {
       throw new ApiError(401, "Refresh token is expired or used")
    }
 
    const options ={
       httpOnly:true,
       secure:true
    }
 
    const {accessToken, newrefreshtoken} = await generateAccessTokenAndRefereshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",  accessToken, options)
    .cookie("refreshToken", newrefreshtoken, options)
    .json(
       new ApiResponse(
          200,
          {accessToken, newrefreshtoken},
          "Access Token refreshed"
       )
    )
 
  } catch (error) {
     throw new ApiError(401, error?.message||"Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler( async(req, res)=>{

    const {oldPassword, newPassword , confirmPassword} = req.body 
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
      throw new ApiError(401,"Invalid old password")
    }

    if(newPassword !== confirmPassword)
    {
      throw new ApiError(400, "confirm Password Mismatch")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
   
   return res
   .status(200)
   .json(200, {}, "Current user Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
   
   const {fullname, email} = req.body

   if(!fullname || !email)
   {
       throw new ApiError(400, "All fields are required")
   }

   const user = User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullname,
            email: email,

         }
      },
      {new : true}
   ).select("-password ")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updates successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res)=>{

   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath)
   {
      throw new ApiError(400, "Avatar fill is missing")
   }

   const avatar = await uploadCloudinary(avatarLocalPath)

   if(!avatar.url)
   {
      throw new ApiError(400,"Error while uploading avatar")
   }

  const user =  await User.findByIdAndUpdate(req.user?._id,
      {
        $set: {
         avatar : avatar.url
        }
      },
      {
         new : true
      }
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{

   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath)
   {
      throw new ApiError(400, "coverImage fill is missing")
   }

   const coverImage = await uploadCloudinary(coverImageLocalPath)

   if(!coverImage.url)
   {
      throw new ApiError(400,"Error while uploading coverImage")
   }

  const avatar =  await User.findByIdAndUpdate(req.user?._id,
      {
        $set: {
         coverImage : coverImage.url
        }
      },
      {
         new : true
      }
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "coverImage updated successfully"))
})


const getUserChannelProfile = asyncHandler(async(req, res)=>{
   const {username}=req.params

   if(!username?.trim())
   {
      throw new ApiError(400, "Username is missing")
   }

   const channel = await User.aggregate([
      {
         $match :{
            username:username?.toLowerCase()
         }
      },
      {
         $lookup :{
            from:"Subscription",
            localField:"_id",
            foreignField:"channel",
            as : "Subcribers"
         }
      },
      {
         $lookup:{
            from:"Subscription",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
         }
      },
      {
         $addFields:{
            subscribersCount : {
               $size:"$Subcribers"
            },
            channelsSubscribedToCount : {
               $size: "$subscribedTo"
            },
            isSubscriber :{
               $condition:{
                  if:{$in:[req.user?._id, "$Subcribers.subscriber"]},
                  then:true,
                  else : false
               }
            }
         }
      },
      {
         $project : {
            fullname : 1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount :1,
            isSubscriber:1,
            avatar:1,
            coverImage : 1,
            email:1

         }
      }
   ])


   if(!channel?.length)
   {
      throw new ApiError(404, "Channel does'nt exists")
   }

   return res.status(200)
   .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})


export {
   UserRegister, 
   loginUser, 
   logoutUser, 
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile
};