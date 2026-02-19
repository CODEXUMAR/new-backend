import { asynchandler } from "../utils/aysnchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/apiresponse.js";

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

    const{fullname,email,username}=req.body
    console.log("email",email)


    if(
        [fullname,email,username,password].some((field)=>
            field?.trim()==="")
        ){
            throw new ApiError(400,"All fields are required")
        }

    const  existeduser=User.findOne({
        $or:[{username},{email}]

    })
    if(existeduser){
        throw new ApiError(409,"user with email or username alredy existed")
        
    }  
    const avatarLocalpath=req.files?.avatar[0]?.path;
    const coverimageLocalpath=req.files?.coverImage[0]?.path;
    if(!avatarLocalpath){
        throw new  ApiError(400,"avatar image is required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalpath);
    const coverImage=await uploadOnCloudinary(coverimageLocalpath);
    if(!avatar){
        throw new ApiError(400,"avatar image is required");
    }
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createduser=await user.findById(user_id).select(
        "-password -refreshToken"

    )
    if(!createduser){
        throw new ApiError(500,"someting went wrong while registring a user")
    }
    return res.status(201).json(
        new Apiresponse(200,createduser,"user registered succcesfully")
    )

})   




export {registeruser}
