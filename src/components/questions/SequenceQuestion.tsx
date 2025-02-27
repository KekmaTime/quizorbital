import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "../ui/card";
import { GripVertical } from "lucide-react";

interface SequenceQuestionProps {
  question: {
    items: string[];
  };
  selectedAnswer: string[];
  onSelectAnswer: (answer: string[]) => void;
}

export const SequenceQuestion = ({ question, selectedAnswer, onSelectAnswer }: SequenceQuestionProps) => {
  const [sequence, setSequence] = useState<string[]>(selectedAnswer || [...question.items]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sequence);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSequence(items);
    onSelectAnswer(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="sequence">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {sequence.map((item, index) => (
              <Draggable key={item} draggableId={item} index={index}>
                {(provided) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="p-3 flex items-center gap-3"
                  >
                    <div {...provided.dragHandleProps}>
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <span>{item}</span>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}; 