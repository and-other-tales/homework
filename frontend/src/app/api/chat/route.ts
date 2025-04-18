import { NextRequest, NextResponse } from 'next/server';

// Direct OpenAI API Chat endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, model, apiKey: clientApiKey } = await request.json();
    
    // Get the API key from environment variables first
    // For security reasons, we prefer a server-side environment variable
    let apiKey = process.env.OPENAI_API_KEY;
    
    console.log("Server-side OPENAI_API_KEY available:", !!apiKey);
    
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
    
    try {
      // Call OpenAI API directly
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: chatModel,
          messages: [
            { role: "system", content: "You are a helpful assistant for the Homework project. You can help with web searches, website crawling, dataset creation from GitHub repositories or websites, and knowledge graph management." },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return NextResponse.json(
          {
            error: true,
            message: `OpenAI API error: ${errorData.error?.message || response.statusText}`
          },
          { status: response.status }
        );
      }
      
      // Parse and return the OpenAI response
      const data = await response.json();
      const assistantResponse = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
      return NextResponse.json({ 
        message: assistantResponse,
        model: chatModel,
        tokenUsage: data.usage
      });
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      return NextResponse.json(
        { 
          error: true,
          message: apiError instanceof Error ? 
            `Error communicating with OpenAI: ${apiError.message}` : 
            "Error communicating with OpenAI API"
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