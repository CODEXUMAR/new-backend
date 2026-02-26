import { asynchandler } from "../utils/aysnchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/apiresponse.js";
import { genSalt } from "bcrypt";


const generateAccessTokenANDRefeshToken=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false });

        return {accessToken,refreshToken};
    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access token")

    }
}

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

    const{fullname,email,username,password}=req.body
    console.log("email",email)


    if(
        [fullname,email,username,password].some((field)=>
            field?.trim()==="")
        ){
            throw new ApiError(400,"All fields are required")
        }

    const  existeduser=await User.findOne({
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
    const createduser=await User.findById(user._id).select(
        "-password -refreshToken"

    )
    if(!createduser){
        throw new ApiError(500,"someting went wrong while registring a user")
    }
    return res.status(201).json(
        new Apiresponse(200,createduser,"user registered succcesfully")
    )

})   
const loginUser=asynchandler(async(req,res)=>{
    const {email,username,password}=req.body

    if((!username) || (!email)){
        throw new ApiError(400,"username or email is required")
    }
    const user =await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"username does not exist")
    }
    const ispasswordValid=await user.ispasswordCorrect(password)
        
    if(!ispasswordValid){
        throw new ApiError(401,"invalid user credentials")

    }
    const {refreshToken,accessToken}=await generateAccessTokenANDRefeshToken(user._id)

    const loggedInUser=await User.findById(user._id).
    select("-password -refreshToken")
    
    const option={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new Apiresponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken

            },
            "user logged in succesfully"
        )
    )
})
const logOutuser =asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }


    )
    const option={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearcookie("accessToken",option)
    .clearcookie("refreshToken",option)
    .json(new Apiresponse(200,{},"user logged out"));

})



export {
    registeruser,
    loginUser,
    logOutuser
}
