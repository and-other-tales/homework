import { NextRequest, NextResponse } from 'next/server';

// Direct OpenAI API Chat endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, model, apiKey: clientApiKey } = await request.json();
    
    // Get the API key from environment variables first
    // For security reasons, we prefer a server-side environment variable
    let apiKey = process.env.OPENAI_API_KEY;
    
    // Fall back to client-provided API key if server doesn't have one
    if (!apiKey && clientApiKey) {
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
    
    // Use the specified model or default to gpt-3.5-turbo
    const chatModel = model || "gpt-3.5-turbo";
    
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
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    // Handle API response
    if (!response.ok) {
      const errorData = await response.json();
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