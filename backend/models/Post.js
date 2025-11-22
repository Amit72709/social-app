import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  text: { type: String, required: true },
  media: [{ type: String }],  // Image/video URLs
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Post', postSchema);