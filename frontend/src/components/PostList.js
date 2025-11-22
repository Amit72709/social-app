import { useState } from 'react';
import MediaItem from './MediaItem';
import PostForm from './PostForm';

const PostList = ({ posts, onUpdate, onDelete, onChat }) => {
  const [editingPost, setEditingPost] = useState(null);

  const handleChatClick = (targetUserId, postId) => {
    onChat(targetUserId, postId);
  };

  if (!posts.length) return <p>No posts yet. Create one!</p>;

  return (
    <div>
      {posts.map(post => (
        <div
          key={post._id}
          style={{
            border: '1px solid #ddd',
            margin: '10px',
            padding: '10px',
            borderRadius: '5px'
          }}
        >
          {/* Post Owner */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <img
              src={post.owner.photo}
              alt={post.owner.name}
              width="40"
              height="40"
              style={{ borderRadius: '50%', marginRight: '10px' }}
            />
            <strong>{post.owner.name}</strong>
          </div>

          {/* Edit Mode OR Display Mode */}
          {editingPost === post._id ? (
            <PostForm post={post} onSubmit={onUpdate} onCancel={() => setEditingPost(null)} />
          ) : (
            <>
              <p>{post.text}</p>

              {/* Media */}
              {post.media?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {post.media.map((url, idx) => (
                    <MediaItem key={idx} url={url} />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => setEditingPost(post._id)}>Edit</button>
                <button onClick={() => onDelete(post._id)}>Delete</button>
                <button onClick={() => handleChatClick(post.owner._id, post._id)}>💬 Chat</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList;
