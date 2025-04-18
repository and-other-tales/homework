import { NextRequest, NextResponse } from 'next/server';

// Direct OpenAI API Chat endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, model, apiKey: clientApiKey, agentMode } = await request.json();
    
    // Get the API key from environment variables first
    // For security reasons, we prefer a server-side environment variable
    let apiKey = process.env.OPENAI_API_KEY;
    
    console.log("Server-side OPENAI_API_KEY available:", !!apiKey);
    console.log("Agent mode:", agentMode ? "enabled" : "disabled");
    
    // Check if the client is telling us to use the server-side key
    if (clientApiKey === "USE_SERVER_KEY") {
      // Just continue using server-side key
      console.log("Client requested to use server-side key");
    }
    // Fall back to client-provided API key if server doesn't have one and client provided a real key
    else if (!apiKey && clientApiKey && clientApiKey !== "USE_SERVER_KEY") {
      apiKey = clientApiKey;
      console.log("Using client-provided API key");
    }
    
    // For development/testing - if no API key is available, create a mock response
    if (!apiKey) {
      // Instead of returning an error, simulate a successful response
      console.log("No API key available, providing mock response");
      return NextResponse.json({
        message: "This is a simulated response since no OpenAI API key is configured. Your message was: \"" + message + "\"",
        model: model || "mock-model",
        tokenUsage: { total_tokens: 150 }
      });
    }
    
    console.log("Using OpenAI API with model:", model || "gpt-3.5-turbo");
    
    // Use the specified model or default to gpt-3.5-turbo
    const chatModel = model || "gpt-3.5-turbo";
    
    // Prepare the API endpoint - if agent mode use backend, otherwise direct OpenAI
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
    let body: any = {
      model: chatModel,
      messages: [
        { role: "system", content: "You are a helpful assistant for the Homework project. You can help with web searches, website crawling, dataset creation from GitHub repositories or websites, and knowledge graph management." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // If agent mode is enabled, use the backend API instead
    if (agentMode) {
      // Use backend API endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      endpoint = `${backendUrl}/chat`;
      
      // Update headers and body for backend API
      headers = {
        "Content-Type": "application/json",
      };
      
      body = {
        message: message,
        use_agent: true,
        api_key: apiKey,
        model: chatModel
      };
      
      console.log("Using backend API endpoint for agent mode:", endpoint);
    }
    
    try {
      // Call the appropriate API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });
      
      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        return NextResponse.json(
          {
            error: true,
            message: `API error: ${errorData.error?.message || errorData.message || response.statusText}`
          },
          { status: response.status }
        );
      }
      
      // Parse the response
      const data = await response.json();
      
      // For agent mode, we need to handle tool calls
      if (agentMode && data.tool_usage) {
        return NextResponse.json({
          message: data.message || "Agent used a tool to assist with your request.",
          model: chatModel,
          toolName: data.tool_name,
          toolUsage: true,
          toolInput: data.tool_input,
          toolOutput: data.tool_output,
          taskId: data.task_id,
          taskDescription: data.task_description
        });
      }
      
      // For regular OpenAI response
      if (!agentMode) {
        const assistantResponse = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
        
        return NextResponse.json({ 
          message: assistantResponse,
          model: chatModel,
          tokenUsage: data.usage
        });
      }
      
      // For agent mode without tool calls
      return NextResponse.json({
        message: data.message || data.content || "Agent processed your request.",
        model: chatModel
      });
      
    } catch (apiError) {
      console.error('Error calling API:', apiError);
      return NextResponse.json(
        { 
          error: true,
          message: apiError instanceof Error ? 
            `Error communicating with API: ${apiError.message}` : 
            "Error communicating with API"
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { 
        error: true,
        message: error instanceof Error ? error.message : "Unknown error processing chat request" 
      },
      { status: 500 }
    );
  }
}