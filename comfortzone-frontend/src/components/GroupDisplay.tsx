import GroupCard from "./GroupCard";

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


interface GroupsDisplayProps {
    groups: Group[];
}


export default function GroupsDisplay({ groups }: GroupsDisplayProps) {
    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4">
                {groups.length > 0 ? (
                    groups.map((group) => (
                        <GroupCard key={group.id} {...group} />
                    ))
                ) : (
                    <p className="text-gray-500">
                        You're not part of any groups yet. Create one to get started!
                    </p>
                )}
            </div>
        </div>
    );
}