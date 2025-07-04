import multer from 'multer';


const storage=multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,"./public/temp")
    },
    filename:function (req,file,cb) {
       
        cb(null, file.originalname);
        
    }
    
})
export const upload=multer({  // stores file on disks instead of RAM due to storage written
    storage,
})


// User uploads file via form → multer saves to ./public/temp/
//                                   ↓
//                  Server validates, maybe compresses it
//                                   ↓
//               File is uploaded to Cloudinary / S3 / Firebase
//                                   ↓
//             After success, temp file is deleted from local
