import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;


interface Post {
  id: string;
  content: string;
  image?: string | null;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    username?: string;
    profilePicture?: string | null;
  };
}

export default function CreatePost(){
    const [posts, setPosts] = useState<Post[]>([]);
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const { isAuthenticated, token } = useAuth();
    const [isPublic, setIsPublic] = useState(true);

    const handlePost = async () => {
        if (!text && !image) return;
        if (!token) return;

        try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            content: text,
            image,
            isPublic,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setText('');
        setImage(null);
        setIsPublic(true);
        } catch (err) {
        console.error('Error creating post:', err);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
        setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!text && !image) return;
        if (!token) return;

        try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            content: text,
            image,
            isPublic,
            }),
        });

                if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setText('');
        setImage(null);
        setIsPublic(true);
        } catch (err) {
        console.error('Error creating post:', err);
        }
    };

    return(
        <div className="relative w-full">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="...Start a post"
            className="w-full h-40 p-3 border-3 border-gray-800 resize-none bg-green-900 text-white rounded-md"
        />

        {/* Image upload button */}
        <div className="absolute bottom-4 left-4">
            <label className="cursor-pointer inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
            <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 4 4m4-4l4 4m-8-12h.01M4 4h16v16H4V4z" />
            </svg>
            </label>
        </div>

        {/* Post button */}
        <button
            onClick={handleSubmit}
            className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
            Post
        </button>
        </div>
    )
}