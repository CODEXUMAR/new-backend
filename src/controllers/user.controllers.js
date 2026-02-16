import { asynchandler } from "../utils/aysnchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/users.model.js";

const registeruser=asynchandler(async (req ,res)=>{
    //user details from frontend
    //validation -not empty
    //check if user alredy exist-email,username
    //check for images check for avatar
    //upload them to cloudinary,avatar
    //create user object-create entryin db
    //remove password and refresh token field from response
    //check for user creation
    //return res



})

export {registeruser}
