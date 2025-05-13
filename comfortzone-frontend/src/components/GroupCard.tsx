interface GroupCardProps {
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

export default function GroupCard({ name, description, currentChallenge }: GroupCardProps) {
    return (
        <div className="min-w[250px] border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            {description && (
                <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}

            {currentChallenge ? (
                <div className="mb-3">
                    <p className="text-sm font-medium">Today's Challenge:</p>
                    <p className="text-md">{currentChallenge.title}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-500 mb-3">No active challenge</p>
            )}
            
            <button className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                View Group
            </button>
        </div>
    );
}