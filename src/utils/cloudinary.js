// it gives local file paths

import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // file system module to handle file operations

cloudinary.config({  // permission for 

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  
});

const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath)return null; // 
        // upload the file on cloudinary
       const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("file has uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch(error){
        console.log("upload failed",error);
        
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation failed
         return null;
    }
}
export {uploadOnCloudinary};