import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const vidoeSchema=new Schema({
    videoFile:{
        type :string,//cloudinary url
        required:true
    },
    thumbnail:{
        type :string,//cloudinary url
        required:true
    },
    title:{
        type :string,
        required:true
    },
    description:{
        type :string,
        required:true
    },
    duration:{
        type :Number,
        required:true
    },
    views:{
        type :Number ,//cloudinary url
        default:true
    },
    ispublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }






},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)



export const vidoe=mongoose.model("vidoe",videoSchema)