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
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { useQuiz } from "@/lib/QuizContext";
import { QuestionType, QuestionTypeDistribution, QuizPreferencesType, DifficultyLevel } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import { Brain, Check, FileText, ToggleLeft } from "lucide-react";

export function QuizPreferences() {
  const { state, setSettings } = useQuiz();
  const [questionDistribution, setQuestionDistribution] = useState<QuestionTypeDistribution[]>([
    { type: "multiple-choice", percentage: 40 },
    { type: "true-false", percentage: 20 },
    { type: "multiple-select", percentage: 20 },
    { type: "descriptive", percentage: 20 },
  ]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.Medium);
  const [timeLimit, setTimeLimit] = useState(0); // 0 means no time limit

  // Update the quiz context when preferences change
  useEffect(() => {
    const totalPercentage = questionDistribution.reduce((sum, item) => sum + item.percentage, 0);
    
    // Only update if the total percentage is 100%
    if (totalPercentage === 100) {
      setSettings({
        numQuestions,
        difficulty,
        timeLimit,
        questionTypeDistribution: questionDistribution
      });
    }
  }, [questionDistribution, numQuestions, difficulty, timeLimit, setSettings]);

  // Update a specific question type's percentage
  const updateDistribution = (type: QuestionType, newPercentage: number) => {
    // Calculate the current total percentage
    const currentTotal = questionDistribution.reduce(
      (sum, item) => sum + (item.type === type ? 0 : item.percentage),
      0
    );
    
    // Ensure the new total doesn't exceed 100%
    if (currentTotal + newPercentage > 100) {
      newPercentage = 100 - currentTotal;
    }
    
    // Update the distribution
    const newDistribution = questionDistribution.map((item) =>
      item.type === type ? { ...item, percentage: newPercentage } : item
    );
    
    setQuestionDistribution(newDistribution);
  };

  // Function to set all questions to a single type
  const setSingleQuestionType = (type: QuestionType) => {
    const updatedDistribution = questionDistribution.map(item => ({
      type: item.type,
      percentage: item.type === type ? 100 : 0
    }));
    
    setQuestionDistribution(updatedDistribution);
    
    toast({
      title: `Question Type Set`,
      description: `All questions will be of type: ${type}`,
    });
  };

  // Calculate remaining percentage to allocate
  const remainingPercentage = 100 - questionDistribution.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quiz Preferences</CardTitle>
        <CardDescription>Customize your quiz settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Number of questions */}
        <div className="space-y-2">
          <Label htmlFor="num-questions">Number of Questions</Label>
          <Input
            id="num-questions"
            type="number"
            min={1}
            max={50}
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
          />
        </div>

        {/* Quick selection buttons */}
        <div className="space-y-2">
          <Label>Quick Question Type Selection</Label>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSingleQuestionType("true-false")}
            >
              <ToggleLeft className="h-4 w-4 mr-1" />
              All True/False
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSingleQuestionType("multiple-choice")}
            >
              <Brain className="h-4 w-4 mr-1" />
              All Multiple Choice
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSingleQuestionType("multiple-select")}
            >
              <Check className="h-4 w-4 mr-1" />
              All Multiple Select
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSingleQuestionType("descriptive")}
            >
              <FileText className="h-4 w-4 mr-1" />
              All Descriptive
            </Button>
          </div>
        </div>

        {/* Difficulty level */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select 
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as DifficultyLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DifficultyLevel.Beginner}>Beginner</SelectItem>
              <SelectItem value={DifficultyLevel.Easy}>Easy</SelectItem>
              <SelectItem value={DifficultyLevel.Medium}>Medium</SelectItem>
              <SelectItem value={DifficultyLevel.Hard}>Hard</SelectItem>
              <SelectItem value={DifficultyLevel.Expert}>Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time limit */}
        <div className="space-y-2">
          <Label htmlFor="time-limit">Time Limit (minutes): {timeLimit === 0 ? 'No Limit' : timeLimit}</Label>
          <div className="flex gap-4 items-center">
            <Input
              id="time-limit"
              type="number"
              min={0}
              max={120}
              className="w-20"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
            />
            <Slider
              value={[timeLimit]}
              min={0}
              max={120}
              step={5}
              onValueChange={(value) => setTimeLimit(value[0])}
              className="flex-1"
            />
          </div>
        </div>

        {/* Question type distribution */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Question Type Distribution</Label>
            <span className={`text-sm ${remainingPercentage === 0 ? 'text-green-500' : 'text-red-500'}`}>
              {remainingPercentage === 0 ? 'Total: 100%' : `Remaining: ${remainingPercentage}%`}
            </span>
          </div>

          {questionDistribution.map((item) => (
            <div key={item.type} className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center">
                  {item.type === "multiple-choice" && <Brain className="h-4 w-4 mr-2 text-primary" />}
                  {item.type === "true-false" && <ToggleLeft className="h-4 w-4 mr-2 text-primary" />}
                  {item.type === "multiple-select" && <Check className="h-4 w-4 mr-2 text-primary" />}
                  {item.type === "descriptive" && <FileText className="h-4 w-4 mr-2 text-primary" />}
                  <Label className="font-normal">{item.type}</Label>
                </div>
                <span className="text-sm">{item.percentage}%</span>
              </div>
              <Slider
                value={[item.percentage]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => updateDistribution(item.type, value[0])}
              />
            </div>
          ))}
        </div>
          
        <Button className="w-full" onClick={() => {
          if (remainingPercentage !== 0) {
            toast({
              title: "Invalid distribution",
              description: "Question type distribution must total 100%",
              variant: "destructive",
            });
          } else {
            setSettings({
              numQuestions,
              difficulty,
              timeLimit,
              questionTypeDistribution: questionDistribution
            });
            toast({
              title: "Preferences saved",
              description: "Your quiz preferences have been updated",
            });
          }
        }}>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
