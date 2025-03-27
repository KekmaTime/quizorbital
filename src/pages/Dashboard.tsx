import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plus } from "lucide-react";

const Dashboard = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        <Card className="p-8 text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create a New Quiz</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Go directly to the quiz creation page to get started.
          </p>
          <Button asChild className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
            <Link to="/quiz/create">
              <Plus className="mr-2 h-4 w-4" /> Create Quiz
            </Link>
          </Button>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard; 