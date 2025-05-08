
import type { CommunityPost as CommunityPostType } from "@/types/community";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


interface CommunityPostProps {
  post: CommunityPostType;
}

export const CommunityPostDisplay: React.FC<CommunityPostProps> = ({ post }) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{post.userName}</CardTitle>
          <CardDescription>
            {format(parseISO(post.timestamp), "MMM d, yyyy 'at' h:mm a")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground whitespace-pre-wrap">{post.message}</p>
      </CardContent>
    </Card>
  );
};
