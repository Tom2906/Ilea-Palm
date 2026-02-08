using System.Text.Json;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/day-in-life")]
public class DayInLifeController : ControllerBase
{
    private readonly ICompanySettingsService _settings;

    private const string SystemPrompt = """
        You are a professional writer assisting residential care workers in transforming their rough notes
        into polished "Day in the Life" observations for children and young people. These observations
        focus on relationship dynamics, emotional wellbeing, and how adults support the young person.

        **Your role:** Take basic information provided by the adult and expand it into a rich, detailed
        narrative that captures the quality of relationships, emotional states, and PACE-informed practice.

        **Essential rules:**
        - Always use "adult" (never "staff" or "care worker")
        - Preserve any speech marks/direct quotes exactly as provided
        - Use PACE language (Playfulness, Acceptance, Curiosity, Empathy) throughout
        - Write in third person, natural voice (as if the adult wrote it themselves, not robotic)
        - Use reflective language: "appeared", "seemed", "demonstrated"
        - Focus on relationship quality, not just events

        **When the adult provides basic information, intelligently expand it by:**
        1. Adding observational detail about how the young person presented
        2. Describing how adults built/maintained relationships
        3. Showing PACE principles in action (validation, curiosity, empathy, playfulness)
        4. Noting transitions and how the young person managed them
        5. Capturing emotional states with behavioral evidence
        6. Describing adult responses that supported co-regulation
        7. Weaving relationship observations throughout (not as separate sections)

        **Structure the narrative chronologically:**
        - Flow naturally through the day
        - Each paragraph covers a period/activity
        - Relationship dynamics and emotional states woven into events
        - Specific adult names and their responses included
        - Direct quotes preserved in speech marks
        - Significant moments (disclosures, breakthroughs, struggles) given appropriate weight

        **Expand basic input intelligently:**
        - If they say "Blake had breakfast" → describe how he engaged, who was with him, mood indicators
        - If they say "went to park" → add how adults supported, what he enjoyed, emotional responses
        - If they mention an incident → describe repair strategies, relationship impact, adult responses
        - If quotes are provided → preserve exactly and add context about tone/body language

        **First response:** Greet the adult warmly and ask them to share the young person's name and
        any notes they have about the day (can be rough bullet points, brief descriptions, or detailed
        narrative). Let them know you'll transform it into a professional observation.

        **After receiving their input:** Produce a complete, polished narrative matching professional
        care observation standards. Mark it with "--- FINAL DOCUMENT ---" at the top. If critical
        information is missing (e.g., no adult names, no sense of mood), ask one focused question
        before generating the final document.
        """;

    public DayInLifeController(ICompanySettingsService settings)
    {
        _settings = settings;
    }

    [HttpPost("chat")]
    public async Task Chat([FromBody] ChatRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) { Response.StatusCode = 401; return; }
        if (!User.HasPermission("day_in_life.use")) { Response.StatusCode = 403; return; }

        // Get AI config from DB
        var companySettings = await _settings.GetAsync();
        var aiProvider = companySettings.AiProvider?.ToLowerInvariant();
        var aiModel = companySettings.AiModel;
        var aiApiKey = companySettings.AiApiKey;

        if (string.IsNullOrEmpty(aiApiKey) || string.IsNullOrEmpty(aiProvider) || string.IsNullOrEmpty(aiModel))
        {
            Response.StatusCode = 503;
            await Response.WriteAsync("AI is not configured. Please configure AI settings in the Settings page.");
            return;
        }

        // Create chat client based on provider
        IChatClient chatClient;
        try
        {
            chatClient = aiProvider switch
            {
                "anthropic" => new Anthropic.SDK.AnthropicClient(aiApiKey).Messages.AsBuilder().Build(),
                "openai" => new OpenAI.OpenAIClient(aiApiKey).GetChatClient(aiModel).AsIChatClient(),
                "gemini" => new Google.GenAI.Client(apiKey: aiApiKey).AsIChatClient(aiModel),
                _ => throw new InvalidOperationException($"Unknown AI provider: {aiProvider}")
            };
        }
        catch (Exception ex)
        {
            Response.StatusCode = 500;
            await Response.WriteAsync($"Failed to initialize AI client: {ex.Message}");
            return;
        }

        // Build message list
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, SystemPrompt)
        };

        foreach (var msg in request.Messages)
        {
            var role = msg.Role.ToLowerInvariant() == "assistant" ? ChatRole.Assistant : ChatRole.User;
            messages.Add(new ChatMessage(role, msg.Content));
        }

        // Set up SSE response
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        var options = new ChatOptions
        {
            ModelId = aiModel
        };

        await foreach (var update in chatClient.GetStreamingResponseAsync(messages, options, HttpContext.RequestAborted))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                var json = JsonSerializer.Serialize(new { content = update.Text });
                await Response.WriteAsync($"data: {json}\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
        }

        await Response.WriteAsync("data: [DONE]\n\n", HttpContext.RequestAborted);
        await Response.Body.FlushAsync(HttpContext.RequestAborted);
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestConnection()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var companySettings = await _settings.GetAsync();
        var aiProvider = companySettings.AiProvider?.ToLowerInvariant();
        var aiModel = companySettings.AiModel;
        var aiApiKey = companySettings.AiApiKey;

        if (string.IsNullOrEmpty(aiApiKey) || string.IsNullOrEmpty(aiProvider) || string.IsNullOrEmpty(aiModel))
        {
            return BadRequest(new { success = false, message = "AI configuration is incomplete" });
        }

        try
        {
            IChatClient chatClient = aiProvider switch
            {
                "anthropic" => new Anthropic.SDK.AnthropicClient(aiApiKey).Messages.AsBuilder().Build(),
                "openai" => new OpenAI.OpenAIClient(aiApiKey).GetChatClient(aiModel).AsIChatClient(),
                "gemini" => new Google.GenAI.Client(apiKey: aiApiKey).AsIChatClient(aiModel),
                _ => throw new InvalidOperationException($"Unknown AI provider: {aiProvider}")
            };

            var testMessage = new ChatMessage(ChatRole.User, "Hello, this is a test. Please respond with 'OK'.");
            var response = await chatClient.GetResponseAsync(testMessage);

            return Ok(new { success = true, message = "Connection successful", response = response.Text });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Connection failed: {ex.Message}" });
        }
    }
}
