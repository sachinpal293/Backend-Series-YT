import { Router } from "express";
import { 
    UserRegister,
    changeCurrentPassword,
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage
 } from "../controllers/user.controller.js";
 
import {upload} from "../middelwears/multer.middelware.js"
import { verifyJWT } from "../middelwears/auth.middelware.js";
const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount : 1,
        },{
            name:"coverImage",
            maxCount : 1
        }
    ]),
    UserRegister)

router.route("/login").post(loginUser)
// secured routes
router.route("/logout").get(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/changepassword").post(verifyJWT,changeCurrentPassword)
router.route("/getprofile").get(verifyJWT,getCurrentUser)
router.route("/updateprofile").post(verifyJWT, updateAccountDetails)
router.route("/updateprofileImage").post(verifyJWT,updateUserAvatar)
router.route("/updatecoverImage").post(verifyJWT,updateUserCoverImage)

export default router;