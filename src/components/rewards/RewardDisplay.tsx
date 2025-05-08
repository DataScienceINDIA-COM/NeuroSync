
import type { Reward } from "@/types/reward";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Lock, Unlock, Sparkles } from "lucide-react";

interface RewardDisplayProps {
  rewards: Reward[];
  neuroPoints: number; 
  onClaimReward?: (rewardId: string) => void;
}

export function RewardDisplay({ rewards, neuroPoints, onClaimReward }: RewardDisplayProps) {
  if (!rewards || rewards.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-accent"/>Treat Yo Self! 💅</CardTitle> {/* GenZ vibe */}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">No goodies yet, fam. Keep grinding those VibePoints to cop some! 🚀</p> {/* GenZ vibe */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-accent" />
          Unlockable Drops ✨
        </CardTitle>
        <CardDescription>Score VibePoints (VP) by smashing quests, then snag these fire treats! 🔥</CardDescription> {/* GenZ vibe */}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const canUnlock = neuroPoints >= reward.pointsRequired;
            return (
              <Card key={reward.id} className={`flex flex-col justify-between p-4 rounded-xl shadow-md transition-all hover:shadow-lg ${reward.isUnlocked ? 'border-2 border-green-500 bg-green-500/10' : canUnlock ? 'border-2 border-yellow-500 bg-yellow-500/10' : 'opacity-80 bg-card'}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-primary-foreground">{reward.name}</h3>
                    <Badge variant={reward.type === 'virtual' ? 'secondary' : 'outline'} className="capitalize">
                      {reward.type} Drop
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                  <p className="text-sm font-medium">
                    Costs: <span className="text-accent font-bold">{reward.pointsRequired} VP</span>
                  </p>
                </div>
                <div className="mt-4">
                  {reward.isUnlocked ? (
                    <div className="flex items-center justify-center text-green-600 font-semibold p-2 rounded-md bg-green-500/20">
                      <Unlock className="mr-2 h-5 w-5" /> Unlocked! Slay! 🎉 {/* GenZ vibe */}
                    </div>
                  ) : canUnlock && onClaimReward ? (
                     <Button 
                        onClick={() => onClaimReward(reward.id)} 
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        size="sm"
                      >
                       <Sparkles className="mr-2 h-4 w-4" /> Cop It! 🛍️ {/* GenZ vibe */}
                     </Button>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground font-medium p-2 rounded-md bg-muted/50">
                      <Lock className="mr-2 h-4 w-4" /> Locked (Sadge 😔) {/* GenZ vibe */}
                    </div>
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
