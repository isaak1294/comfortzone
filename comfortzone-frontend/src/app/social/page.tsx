'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'

interface Post {
  id: number;
  text: string;
  image?: string;
  timestamp: Date;
}

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const { isAuthenticated, login } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!text && !image) return;

    const newPost: Post = {
      id: Date.now(),
      text,
      image: image || undefined,
      timestamp: new Date(),
    };

    setPosts([newPost, ...posts]);
    setText('');
    setImage(null);
  };

  if(!isAuthenticated){
    return(
      <div className="text-center text-gray-700 mt-20">
        <p>You must sign in to view or post to the social feed.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 bg-white/80 rounded-xl shadow-md backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Social Feed</h1>

      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your challenge progress or thoughts..."
          className="w-full p-3 rounded-md border border-gray-300 mb-2"
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2" />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Post
        </button>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <p className="text-gray-700 whitespace-pre-line mb-2">{post.text}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Uploaded"
                className="max-h-64 rounded-md object-cover mb-2"
              />
            )}
            <p className="text-xs text-gray-500">
              Posted at {new Date(post.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
