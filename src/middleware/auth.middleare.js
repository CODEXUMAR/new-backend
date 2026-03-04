import { ApiError } from "../utils/apierror.js";
import { asynchandler } from "../utils/aysnchandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/users.model.js";
export const verifyJWT=asynchandler(async(req,res,next)=>{
    const token=req.cookies?.accessToken || req.header
    ("Authorization")?.replace("Bearer","")
    try{
        if(!token){
        throw new ApiError(401,"unauthorized request")

    }
    const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRETS)
    const user=await User.findById(decodedtoken?._id).select("-password -refreshToken")

    if(!user){
        //discuss about front end later
        throw new ApiError(401,"Invalid Access token")
    }
    req.user=user
    next();
    }
    catch(error){
        throw new ApiError(401,error?.message || "invalid acces token")

    }
    


})