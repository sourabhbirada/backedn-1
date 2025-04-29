
const {Schema , model} = require("mongoose")

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    createby: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: [
      {
        body: { type: String, required: true },
        createby: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Blog = model('Blog', blogSchema);

module.exports = Blog;