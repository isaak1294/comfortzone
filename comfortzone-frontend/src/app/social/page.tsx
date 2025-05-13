'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'
import GroupsDisplay from '@/components/GroupDisplay';
import CreateGroupModal from '@/components/CreateGroupModal';

interface Post {
  id: number;
  text: string;
  image?: string;
  timestamp: Date;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    currentChallenge?: {
        id: string;
        title: string;
        description: string;
        date: Date;
    };
}

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserGroups();
    }
  }, [isAuthenticated]);

  const fetchUserGroups = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:4000/api/groups/my-groups', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        console.error('Failed to fetch groups:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if(!newGroupName.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, newGroup]);
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupDescription('');
      }
    } catch (error) {
      console.error('Error creating group:', error)
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

      <div className='mb-8'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-semibold text-gray-800'>My Groups</h2>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
          >
            Create New Group
          </button>
        </div>

        <GroupsDisplay groups={groups} />
      </div>

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={handleCreateGroup}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        newGroupDescription={newGroupDescription}
        setNewGroupDescription={setNewGroupDescription}
      />

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
