import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Video} from "../models/video.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const uploadVideo = asyncHandler(async(req, res)=>{
       const { _id} =  await User.findById(req.user?._id)
      
       const {title, description} = req.body
       const videofileLocalPath = req.files?.videofile[0].path
       const thumbnailLocalPath = req.files?.thumbnail[0].path

       if(!videofileLocalPath)
       {
         throw new ApiError(400, "Video file is mandtory")
       }

       if(!thumbnailLocalPath)
       {
        throw new ApiError(400,"Thumbnail file is required")
       }

       const uploadedvideo = await uploadCloudinary(videofileLocalPath)
       const uploadedthumbnail = await uploadCloudinary(thumbnailLocalPath)
        
       if(!uploadedvideo)
       {
        throw new ApiError(400,"Video file is required")
       }

       if(!uploadedthumbnail)
       {
         throw new ApiError(400, "Thumbnail file is required")
       }

       const {duration, url} = uploadedvideo
       
       const video = await Video.create(
        {
            videoFile: url,
            thumbnail: uploadedthumbnail.url,
            title,
            description,
            duration:Math.floor(duration),
            owner:_id
        }
       )

       const finaluploadedFile = await Video.findById(video._id)

       const {owner}= finaluploadedFile;

       const {username, avatar} = await User.findById(owner);

       if(!finaluploadedFile)
       {
        throw new ApiError(401, "something went wrong while uploading")
       }

    return res
    .status(200)
    .json(new ApiResponse(200, {username, avatar}, "Fine this is working upload"))
})

const getAllVideo = asyncHandler(async(req, res)=>{
     const {_id} = await User.findById(req.user?._id)

     if(!_id)
     {
      throw new ApiError(400, "User not login")
     }
     
    const videodata = await Video.find({owner:_id})

    return res
    .status(200)
    .json(new ApiResponse(200, {videodata}, "All Video data fetch from data base"))



})


export {
    uploadVideo,
    getAllVideo
}