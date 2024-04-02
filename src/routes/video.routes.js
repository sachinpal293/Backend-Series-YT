import { Router } from "express";
import { upload } from "../middelwears/multer.middelware.js";
import { verifyJWT } from "../middelwears/auth.middelware.js";
import { getAllVideo, uploadVideo } from "../controllers/video.controller.js";

const router = Router();
router.route("/upload").post(verifyJWT, 
    upload.fields([
        {
            name:"videofile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    uploadVideo)

router.route("/getAllVideo").get(verifyJWT,getAllVideo)
export default router;