import { asynchandler } from "../utils/aysnchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/apiresponse.js";
import { genSalt } from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessTokenANDRefeshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.log("TOKEN ERROR:", error);   // 👈 VERY IMPORTANT
        throw new ApiError(500, "something went wrong while generating refresh and access token");
    }
};

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

    if((!username) && (!email)){
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
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new Apiresponse(200,{},"user logged out"));

})
const refreshaccesToken=asynchandler(async(req,res)=>{
    const incomingrefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingrefreshToken){
        throw new ApiError(401,"unauthorize access");
    }
    try{
        const decodedtokenn=jwt.verify(
        incomingrefreshToken,
        process.env.REFRESH_TOKEN_SECRETS
    )
    const user=await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"invalid refresh token");
    }
    if(incomingrefreshToken!== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used ")
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newrefreshToken}=await generateAccessTokenANDRefeshToken(user._id)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
        new ApiError(
            200,
            {accessToken,refreshToken:newrefreshToken},
            "access token refreshed succesfully"
        )
    )
    }
    catch(error){
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
    

    


})

const changecurrentpassword = asynchandler(async(req,res)=>{
    const{oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
    const ispasswordcorrect=await user.ispasswordCorrect(oldpassword);
    if(!ispasswordcorrect){
        throw new ApiError(400,"invalid password")
    }
    user.password=newpassword
    await users.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new Apiresponse(200,{},"PASSWORD CHANGE SUCCESFULLY MY BOI"))


})
const getcurrentuser=asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})
const updateAccountdetails=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email
            }
        },
        {new:true}

    ).select("-password")
    return res
    .status(200)
    .json(new Apiresponse(200,user,"acccount detail update successfully"))
})
const updateAvatardetails=asynchandler(async(req,res)=>{
    const avatarLocalpath=req.file?.path

    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar file is missing");
    }
    const avatar=await uploadOnCloudinary(avatarLocalpath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading the avatar")
    }
    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}

    ).select("-password")
    return res.status(200).json(new Apiresponse(200,user,"avatar image updated succesfully"))
})
const updateCoverImagedetails=asynchandler(async(req,res)=>{
    const coverImageLocalpath=req.file?.path

    if(!coverImageLocalpath){
        throw new ApiError(400,"coverimage file is missing");
    }
    const coverImage=await uploadOnCloudinary(avatarLocalpath)
    if(!coverImage.url){
        throw new ApiError(400,"error while uploading the coverimage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}

    ).select("-password")
    return res.status(200).json(new Apiresponse(200,user,"cover image updated succesfully"))
})
const getUserChannelProfile=asynchandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing");
    }
    const channel =await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()

            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"._id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"._id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribercount:{
                    $size:"$subscribers"
                },
                channelsubscribedTocount:{
                    $size:"$subscribedTo"
                },
                issubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribercount:1,
                channelsubscribedTocount:1,
                issubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
            
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"chanel does not exist");
    }
    return res.status(200).json(new Apiresponse(200,channel[0],"user channel fethecd succesfuly"))
})
const getwatchhistory=asynchandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"vidoes",
                localField:"watchHistory",
                foreignField:"_id",
                as:"WatchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"Users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        avatar:1,
                                        username:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]

            }

        }
    ])
    return 
    res.status(200).json(new Apiresponse(200,user[0].WatchHistory,"watch hsitory fetched successfully"))

})


export {
    registeruser,
    loginUser,
    logOutuser,
    refreshaccesToken,
    changecurrentpassword,
    getcurrentuser,
    updateAccountdetails,
    updateAvatardetails,
    updateCoverImagedetails,
    getUserChannelProfile,
    getwatchhistory
}
