'use client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  newGroupDescription: string;
  setNewGroupDescription: (value: string) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreate,
  newGroupName,
  setNewGroupName,
  newGroupDescription,
  setNewGroupDescription,
}: CreateGroupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Group Name</label>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter group name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Describe your group"
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(newGroupName, newGroupDescription)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

