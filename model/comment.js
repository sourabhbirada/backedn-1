const {Schema , model} = require("mongoose")


const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    blogid: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
    },
    createby: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Comment = model('Comment', commentSchema);

module.exports =Comment;