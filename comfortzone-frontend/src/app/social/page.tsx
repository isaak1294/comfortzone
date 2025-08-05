'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'
import GroupsDisplay from '@/components/GroupDisplay';
import CreateGroupModal from '@/components/CreateGroupModal';
import CreatePost from '@/components/CreatePost';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// interface for post when I retrieve it
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

// interface for group when I retrieve it
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

// main page component
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



  // if the user is signed in, fetch the groups that they are a part of.
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserGroups();
    }
  }, [isAuthenticated]);

  // function to get groups
  const fetchUserGroups = async () => {
    if (!token) return;

    try {
      // uses the api route defined at this path
      const response = await fetch(`${API_BASE}/api/groups/my-groups`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // use the setGroups method to save the results
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

  // If signed in, fetch groups and fetch posts?
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
    <>
        <CreatePost/>

    </>
  );
}
