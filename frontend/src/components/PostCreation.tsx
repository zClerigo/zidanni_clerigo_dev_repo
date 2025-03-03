import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./hooks/use-toast";
import { Input } from "./ui/input";
import { Upload, Video, X } from 'lucide-react';
import { supabase } from "../lib/supabaseClient";

interface NodeOutputs {
  ghKzVCyuWrJQotqSpbLa?: string;
  f3s3npsBulYXuRFVk3bq?: string;
  cC3GP5c3BfeQTGWitCTR?: string;
  [key: string]: string | undefined;
}

interface ApiResponse {
  message: string;
  result: {
    node_outputs: NodeOutputs;
    messages: Record<string, unknown>;
    execution_log: string[];
  };
}

interface Movie {
  success: boolean;
  status: string;
  url: string;
  duration: number;
  message: string;
}

interface MovieResponse {
  success: boolean;
  movie?: Movie;
}

interface SceneDetail {
  id: number;
  description: string;
  duration: string;
  notes: string;
  videoFile: File | null;
}

interface VideoElement {
  type: string;
  src?: string;
  fit?: string;
  volume?: number;
}

interface UploadedScene {
  videoUrl: string;
  projectId: string;
  comment: string;
  duration: number;
  'background-color'?: string;
  elements: VideoElement[];
}

interface SceneTemplate {
  comment: string;
  duration: number;
  'background-color'?: string;
  elements: VideoElement[];
}

interface VideoTemplate {
  resolution: string;
  quality: string;
  scenes: SceneTemplate[];
}

interface Scene {
  videoUrl?: string;
  projectId?: string;
  // ... other scene properties ...
}

const PostCreation: React.FC = () => {
  const [prompt, setPrompt] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [apiResponse, setApiResponse] = React.useState<NodeOutputs | null>(null);
  const [scenes, setScenes] = React.useState<SceneDetail[]>([]);
  const [videoSubmitResponse, setVideoSubmitResponse] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [videoUrl, setVideoUrl] = React.useState<string>("");
  const [checkingStatus, setCheckingStatus] = React.useState<boolean>(false);
  const [videoProjectId, setVideoProjectId] = React.useState<string>("");
  const { toast } = useToast();
  const [videoTemplate, setVideoTemplate] = useState<VideoTemplate | null>(null);
  const json2videoApiKey = "iCtf6GfyIieBk2AMtyKS28KqALDjGPKvgaCAMtB2";
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');

  const extractScenes = (content: string): string[] => {
    const scenes = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Look for lines that describe scenes or actions
      if (
        line.includes('[') && 
        line.includes(']') || 
        line.startsWith('POV:') ||
        line.includes('Caption:') ||
        line.includes('Voiceover:')
      ) {
        scenes.push(line.trim());
      }
    }
    
    return scenes;
  };

  const initializeScenes = (content: string) => {
    const extractedScenes = extractScenes(content);
    const initialScenes = extractedScenes.map((scene, index) => ({
      id: index + 1,
      description: scene,
      duration: '',
      notes: '',
      videoFile: null
    }));
    setScenes(initialScenes);
  };

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
          id: "67bac23ed774ddacb1121d00",
          deploymentId: "67bb044c732073aa549e7320",
          prompt: prompt,
          chatHistory: [],
          projectId: null
        })
      });
      
      const data: ApiResponse = await response.json();
      console.log('Raw API Response:', data);
      
      if (data.message === "Graph executed successfully") {
        setApiResponse(data.result.node_outputs);
        if (data.result.node_outputs.cC3GP5c3BfeQTGWitCTR) {
          initializeScenes(data.result.node_outputs.cC3GP5c3BfeQTGWitCTR);
        }
      } else {
        console.error('API did not execute successfully:', data.message);
        toast({
          title: "Error",
          description: "Failed to generate TikTok content. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while generating content.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScene = (id: number, field: keyof SceneDetail, value: string | File | null) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === id ? { ...scene, [field]: value } : scene
      )
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, sceneId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Error",
          description: "Please upload a video file",
          variant: "destructive"
        });
        return;
      }
      
      // Update scene with file
      updateScene(sceneId, 'videoFile', file);
      
      toast({
        title: "Success",
        description: `Video uploaded for Scene ${sceneId}`,
      });
    }
  };

  const removeVideo = (sceneId: number) => {
    updateScene(sceneId, 'videoFile', null);
  };

  const createVideo = async (jsonScript: any) => {
    try {
      const response = await fetch('https://api.json2video.com/v2/movies', {
        method: 'POST',
        headers: {
          'x-api-key': 'your-json2video-api-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonScript)
      });

      const data = await response.json();
      if (data.success) {
        setVideoProjectId(data.project);
        return data.project;
      } else {
        throw new Error('Failed to create video');
      }
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  };

  const checkVideoStatus = async (projectId: string): Promise<MovieResponse> => {
    try {
      const response = await fetch(`https://api.json2video.com/v2/movies?project=${projectId}`, {
        method: 'GET',
        headers: {
          'x-api-key': 'your-json2video-api-key'
        }
      });

      const data = await response.json();
      console.log('Video Status:', data);
      return data as MovieResponse;
    } catch (error) {
      console.error('Error checking video status:', error);
      throw new Error('Failed to check video status');
    }
  };

  const pollVideoStatus = async (projectId: string, accessToken: string) => {
    try {
      const response = await fetch(`/api/proxy/movie-status/${projectId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get video status: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Video status:', data);

      if (data.status === 'processing') {
        setProcessingStatus('Processing video...');
        setTimeout(() => pollVideoStatus(projectId, accessToken), 5000);
      }

      if (data.status === 'completed') {
        console.log('Video completed:', data);
        setProcessingStatus('Video completed!');
        if (data.url) {
          setFinalVideoUrl(data.url);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setProcessingStatus(`Error checking video status: ${errorMessage}`);
      console.error('Error polling video status:', error);
    }
  };
  
  const handleSubmitVideos = async () => {
    const incompletedScenes = scenes.filter(scene => !scene.videoFile);
    
    if (incompletedScenes.length > 0) {
      toast({
        title: "Missing Videos",
        description: `Please upload videos for scenes: ${incompletedScenes.map(s => s.id).join(', ')}`,
        variant: "destructive"
      });
      return;
    }
  
    setSubmitting(true);
    try {

      // First API call to get video info
      const videoMetadata = scenes.map(scene => ({
        sceneId: scene.id,
        description: scene.description,
        duration: scene.duration,
        notes: scene.notes,
        videoDetails: {
          name: scene.videoFile?.name,
          size: scene.videoFile?.size,
          type: scene.videoFile?.type
        }
      }));
  
      const combinedPrompt = JSON.stringify({
        originalScript: apiResponse?.cC3GP5c3BfeQTGWitCTR,
        scenes: videoMetadata
      });
  
      const response = await fetch("https://fungitest.fungiproject.xyz/test/graphs/run", {
        method: "POST",
        headers: {
          "Authorization": "ApiKey hm_pGatOIBjHsDIs4tXiheBUNaB71YdZCiYFAIblfUlOp4",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: "67bafee81acf89a1e5a454c4",
          deploymentId: "67bb044c732073aa549e7320",
          prompt: combinedPrompt,
          chatHistory: [],
          projectId: null
        })
      });
  
      const data = await response.json();
      console.log('First API Response:', data);
      
      if (data.message === "Graph executed successfully") {
        setVideoSubmitResponse(JSON.stringify(data.result.node_outputs, null, 2));
  
        // Parse the JSON template from the API response
        const videoTemplate = JSON.parse(data.result.node_outputs['4xNYvgQs8VQflvy577q1']) as VideoTemplate;
        console.log('Video Template:', videoTemplate);
  
        // Debug: Log the scenes that need videos
        const scenesWithVideo = videoTemplate.scenes.filter(scene => 
          scene.elements.some(element => element.type === 'video')
        );
        console.log('Scenes requiring video:', scenesWithVideo);
  
        // Debug: Log the available video files
        console.log('Available video files:', scenes.map(s => ({
          id: s.id,
          fileName: s.videoFile?.name,
          fileSize: s.videoFile?.size
        })));
  
        // Get the session token
        
        // Upload each video and get their URLs
        const uploadedScenes = await Promise.all(
          scenesWithVideo.map(async (scene, index) => {
            const videoFile = scenes[index]?.videoFile;
            if (!videoFile) return null;

            const formData = new FormData();
            formData.append('file', videoFile);

            const response = await fetch('/api/proxy/video-upload/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer AOISFSI`,
              },
              body: formData
            });

            if (!response.ok) {
              throw new Error(`Failed to upload video for scene ${index + 1}: ${await response.text()}`);
            }

            const data = await response.json();
            return {
              ...scene,
              videoUrl: data.video_url,
              projectId: data.project_id
            } as UploadedScene;
          })
        );

        // Filter out any null scenes
        const validScenes = uploadedScenes.filter((scene): scene is UploadedScene => 
          scene !== null && typeof scene.videoUrl === 'string'
        );
        
        if (validScenes.length === 0) {
          throw new Error('No valid scenes to process');
        }

        // Create the final template with all scenes
        const finalTemplate = {
          resolution: 'full-hd',
          quality: 'high',
          scenes: validScenes.map(scene => ({
            duration: 5,
            elements: [{
              type: 'video',
              src: scene.videoUrl,
              fit: 'cover',
              volume: 1
            }]
          }))
        };

        setProcessingStatus('Creating final video...');

        // Send the template to create the movie
        const createResponse = await fetch('/api/proxy/create-movie/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ASA`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(finalTemplate)
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Create movie response:', errorText);
          throw new Error(`Failed to create movie: ${createResponse.statusText}`);
        }

        const result = await createResponse.json();
        console.log('Movie creation response:', result);

        // Start polling for video status
        if (result.project) {
          pollVideoStatus(result.project, "aAS");
        }

        toast({
          title: "Success",
          description: "Video created successfully",
        });
      } else {
        throw new Error('Failed to process videos');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setProcessingStatus(`Error: ${errorMessage}`);
      console.error('Error submitting videos:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderVideoPreview = () => {
    if (!videoUrl) return null;

    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <span>🎥</span> Generated Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              controls
              className="w-full rounded-lg"
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      </div>
    );
  };

  const formatContent = (content: string) => {
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      if (section.includes('["#')) {
        try {
          const hashtags = JSON.parse(section);
          return (
            <div key={index} className="flex flex-wrap gap-2 my-2">
              {hashtags.map((tag: string, tagIndex: number) => (
                <span key={tagIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          );
        } catch {
          return <p key={index} className="my-2">{section}</p>;
        }
      }
      return <p key={index} className="my-2">{section}</p>;
    });
  };

  const renderSceneEditor = () => {
    if (!scenes.length) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <span>🎬</span> Scene Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {scenes.map((scene) => (
              <div key={scene.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Scene {scene.id}</span>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-700">{scene.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (seconds)
                      </label>
                      <Input
                        type="text"
                        value={scene.duration}
                        onChange={(e) => updateScene(scene.id, 'duration', e.target.value)}
                        placeholder="e.g., 3.5"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <Input
                        type="text"
                        value={scene.notes}
                        onChange={(e) => updateScene(scene.id, 'notes', e.target.value)}
                        placeholder="Add filming notes..."
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scene Video
                    </label>
                    {scene.videoFile ? (
                      <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                        <Video className="w-4 h-4" />
                        <span className="text-sm flex-1 truncate">{scene.videoFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(scene.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, scene.id)}
                          className="hidden"
                          id={`video-upload-${scene.id}`}
                        />
                        <label
                          htmlFor={`video-upload-${scene.id}`}
                          className="flex items-center gap-2 cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors p-2 rounded text-sm text-blue-600"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Video
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="space-y-4">
              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-600">
                  Total Scenes: {scenes.length}
                </p>
                <p className="text-sm text-gray-600">
                  Estimated Duration: {scenes.reduce((acc, scene) => acc + (Number(scene.duration) || 0), 0).toFixed(1)}s
                </p>
              </div>
              <Button 
                onClick={handleSubmitVideos}
                className="w-full"
                disabled={scenes.some(scene => !scene.videoFile)}
              >
               {submitting ? "Processing Videos..." : "Submit All Videos"}
              </Button>
              {videoSubmitResponse && (
                <div className="mt-4">
                  <h4 className="font-medium text-lg mb-2">Processing Results:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    {videoSubmitResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResponse = (response: NodeOutputs | null) => {
    if (!response) return null;

    const sections = [
      {
        title: "Social Media Post",
        content: response.ghKzVCyuWrJQotqSpbLa,
        icon: "📱"
      },
      {
        title: "TikTok Script",
        content: response.cC3GP5c3BfeQTGWitCTR,
        icon: "🎥"
      },
    ];

    return (
      <div className="space-y-8">
        {sections.map((section, index) => (
          section.content && (
            <div key={index} className="border-b pb-8 last:border-b-0">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span>{section.icon}</span>
                {section.title}
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="prose max-w-none">
                  {formatContent(section.content)}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-black">TikTok Content Creator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Tell us about your business (e.g., 'I want to create a TikTok post for my cookie business')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-black"
            />
            <Button
              onClick={generateResponse}
              disabled={loading || !prompt}
              className="w-full"
            >
              {loading ? "Generating Content..." : "Generate TikTok Content"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {apiResponse && (
        <>
          <Card>
            <CardContent className="pt-6">
              {renderResponse(apiResponse)}
            </CardContent>
          </Card>
          {renderSceneEditor()}
          {renderVideoPreview()}
          {processingStatus && (
            <div className="mt-4">
              <p>{processingStatus}</p>
            </div>
          )}
          {finalVideoUrl && (
            <div className="mt-4">
              <a href={finalVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                View Final Video
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostCreation;