import { Router } from "express";
import { registeruser,logOutuser,loginUser } from "../controllers/user.controllers.js";
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
routes.route("/login").post(loginUser)
routes.route("/logout").post(verifyJWT,logOutuser)


export default router