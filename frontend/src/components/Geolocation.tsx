import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./hooks/use-toast";

interface ApiResponse {
  knKl50iY8zkLZQuJuQvw?: string;
  jj58SyH0An5oiFwJblA7?: string;
  ['2mTDks2aTUSk7IqudoxW']?: string;
}

const Geolocation = () => {
  const [prompt, setPrompt] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [apiResponse, setApiResponse] = React.useState<ApiResponse | null>(null);
  const { toast } = useToast();

  const generateResponse = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://fungitest.fungiproject.xyz/test/graphs/run", {
        method: "POST",
        headers: {
          "Authorization": "ApiKey hm_pGatOIBjHsDIs4tXiheBUNaB71YdZCiYFAIblfUlOp4",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: "67babd68d774ddacb1121cf1",
          deploymentId: "67bb044c732073aa549e7320",
          prompt: prompt,
          chatHistory: [],
          projectId: null
        })
      });
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      if (data.message === "Graph executed successfully") {
        setApiResponse(data.result.node_outputs);
      } else {
        console.error('API did not execute successfully:', data.message);
        toast({
          title: "Error",
          description: "Failed to analyze location. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while analyzing the location.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = (response: ApiResponse | null) => {
    if (!response) return null;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-2">Location Analysis</h3>
          <div className="whitespace-pre-line">{response.knKl50iY8zkLZQuJuQvw}</div>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Target Persona Analysis</h3>
          <div className="whitespace-pre-line">{response.jj58SyH0An5oiFwJblA7}</div>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">TikTok Posting Schedule</h3>
          <div className="whitespace-pre-line">{response['2mTDks2aTUSk7IqudoxW']}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-black">Business Location Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Tell us about your business (e.g., 'I want to start a cookie business')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-black"
            />
            <Button
              onClick={generateResponse}
              disabled={loading || !prompt}
              className="w-full"
            >
              {loading ? "Analyzing..." : "Analyze Location"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {apiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-black"></CardTitle>
          </CardHeader>
          <CardContent>
            {renderResponse(apiResponse)}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Geolocation;