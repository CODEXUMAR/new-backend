import { Router } from "express";
import { registeruser, logOutuser, loginUser, refreshaccesToken, changecurrentpassword, getcurrentuser, updateAccountdetails, updateAvatardetails, updateCoverImagedetails, getUserChannelProfile, getwatchhistory } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.js";
import { verifyJWT } from "../middleware/auth.middleare.js";



const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1

        },
        {
            name: "coverImage",
            maxCount: 1
        }

    ]),


    registeruser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logOutuser)
router.route("/refresh-token").post(refreshaccesToken)
router.route("/change-password").post(verifyJWT,changecurrentpassword)
router.route("/current-user").get(verifyJWT,getcurrentuser)
router.route("/updateAccountdetails").patch(verifyJWT,updateAccountdetails)
router.route("/updateAvatar").patch(verifyJWT,upload.single("avatar"),updateAvatardetails)
router.route("/updatecoverimage").patch(verifyJWT,upload.single("/coverImage"),updateCoverImagedetails)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/wathchHistory").get(verifyJWT,getwatchhistory);



export default router