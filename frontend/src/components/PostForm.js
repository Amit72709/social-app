import { useState } from 'react';

const PostForm = ({ post, onSubmit, onCancel }) => {
  const [text, setText] = useState(post?.text || '');
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('text', text);
    if (media) formData.append('media', media);
    try {
      if (post) {
        await onSubmit(post._id, formData);
      } else {
        await onSubmit(formData);
      }
      setText('');
      setMedia(null);
      if (onCancel) onCancel();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-item" style={{ margin: '10px' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        required
        rows={3}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setMedia(e.target.files[0])}
        style={{ marginBottom: '10px' }}
      />
      <div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : (post ? 'Update' : 'Post')}
        </button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
};

export default PostForm;