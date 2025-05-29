'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'
import GroupsDisplay from '@/components/GroupDisplay';
import CreateGroupModal from '@/components/CreateGroupModal';

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
  const [friendUsername, setFriendUsername] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [friendRequestStatus, setFriendRequestStatus] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [postFilter, setPostFilter] = useState<'public' | 'private' | 'all'>('all');



  useEffect(() => {
    if (isAuthenticated) {
      fetchUserGroups();
    }
  }, [isAuthenticated]);

  const fetchUserGroups = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/my-groups`, {
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserGroups();
      fetchPosts();
    }
  }, [isAuthenticated, postFilter]);

  const fetchPosts = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/posts?filter=${postFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (err) {
      console.error('Post fetch error:', err);
    }
  };


  const handleCreateGroup = async () => {
    if(!newGroupName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups`, {
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



  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim() || !token) {
      setFriendRequestStatus("Please enter a username.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: friendUsername }),
      });

      const data = await response.json();

      if (response.ok) {
        setFriendRequestStatus('Friend request sent successfully!');
        setFriendUsername('');
      } else {
        setFriendRequestStatus(data.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setFriendRequestStatus('Something went wrong.');
    }
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

          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Add a Friend</h2>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Enter their username"
                className="flex-1 p-2 border rounded-md"
              />
              <button
                onClick={handleSendFriendRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
            {friendRequestStatus && (
              <p className="mt-2 text-sm text-gray-600">{friendRequestStatus}</p>
            )}
          </div>

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

        <div className="mb-2 flex items-center space-x-3">
          <label className="text-sm text-gray-700 font-medium">Post visibility:</label>
          <select
            value={isPublic ? 'public' : 'private'}
            onChange={(e) => setIsPublic(e.target.value === 'public')}
            className="border border-gray-300 p-1 rounded-md"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Post
        </button>
      </div>

      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={() => setPostFilter('all')}
          className={`px-3 py-1 rounded ${postFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setPostFilter('public')}
          className={`px-3 py-1 rounded ${postFilter === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Public
        </button>
        <button
          onClick={() => setPostFilter('private')}
          className={`px-3 py-1 rounded ${postFilter === 'private' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Friends Only
        </button>
      </div>



      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <p className="text-gray-700 whitespace-pre-line mb-2">{post.content}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Uploaded"
                className="max-h-64 rounded-md object-cover mb-2"
              />
            )}
            <p className="text-xs text-gray-500">
              Posted at {new Date(post.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
