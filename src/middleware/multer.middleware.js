import multer from "multer";

const profilePictureStorage = multer.diskStorage(
    {
        destination: function(req,file,cb){
            cb(null,"./public/uploadprofilepic")
        },
        filename: function(req,file,cb){
            cb(null,`${Date.now()}-${file.originalname}`)
        }
    }
)

const postImageStorage = multer.diskStorage(
    {
        destination: function(req,file,cb){
            cb(null,"./public/uploadposts")
        },
        filename: function(req,file,cb){
            cb(null,`${Date.now()}-${file.originalname}`)
        }
    }
)

const uploadProfilePicture = multer({storage:profilePictureStorage})
const uploadPostImages = multer({storage:postImageStorage})


export {uploadProfilePicture,uploadPostImages}