import { Router } from "express";
import { registeruser,logOutuser,loginUser,refreshaccesToken } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.js";
import { verifyJWT } from "../middleware/auth.middleare.js";



const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar", 
            maxCount:1
        
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),

    
    registeruser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logOutuser)
router.route("/refresh-token").post(refreshaccesToken)


export default router