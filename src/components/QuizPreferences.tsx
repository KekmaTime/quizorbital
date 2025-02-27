
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const QuizPreferences = () => {
  return (
    <Card className="w-full max-w-xl mx-auto backdrop-blur-sm bg-white/80">
      <CardHeader>
        <CardTitle>Quiz Preferences</CardTitle>
        <CardDescription>
          Customize your quiz experience according to your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="questions">Number of Questions</Label>
          <Input type="number" id="questions" placeholder="Enter number" min="1" max="50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input type="number" id="timeLimit" placeholder="Enter time limit" min="1" />
        </div>
        <Button className="w-full">Save Preferences</Button>
      </CardContent>
    </Card>
  );
};
