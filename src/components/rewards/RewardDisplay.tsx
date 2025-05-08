
import type { Reward } from "@/types/reward";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Lock, Unlock } from "lucide-react";

interface RewardDisplayProps {
  rewards: Reward[];
  neuroPoints: number; // Pass current neuro points to determine unlockable status
  onClaimReward?: (rewardId: string) => void; // Optional: for handling claim action
}

export function RewardDisplay({ rewards, neuroPoints, onClaimReward }: RewardDisplayProps) {
  if (!rewards || rewards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">No rewards available yet. Stay tuned!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-accent" />
          Available Rewards
        </CardTitle>
        <CardDescription>Unlock rewards by earning NeuroPoints through completing tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const canUnlock = neuroPoints >= reward.pointsRequired;
            return (
              <Card key={reward.id} className={`flex flex-col justify-between p-4 ${reward.isUnlocked ? 'border-green-500' : canUnlock ? 'border-yellow-500' : 'opacity-70'}`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-primary-foreground">{reward.name}</h3>
                    <Badge variant={reward.type === 'virtual' ? 'secondary' : 'outline'}>
                      {reward.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{reward.description}</p>
                  <p className="text-sm font-medium">
                    Points: <span className="text-accent">{reward.pointsRequired} NP</span>
                  </p>
                </div>
                <div className="mt-3">
                  {reward.isUnlocked ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                      <Unlock className="mr-1 h-4 w-4" /> Unlocked
                    </Badge>
                  ) : canUnlock && onClaimReward ? (
                     <button 
                        onClick={() => onClaimReward(reward.id)} 
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center"
                      >
                       <Unlock className="mr-1 h-4 w-4" /> Claim Reward
                     </button>
                  ) : (
                    <Badge variant="destructive">
                      <Lock className="mr-1 h-4 w-4" /> Locked
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RewardDisplay;
