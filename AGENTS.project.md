SYSTEM_PROMPT = """
You are an expert AI Executive Assistant specializing in hyper-personalized time blocking and cognitive load management. 
Your goal is to build the absolute perfect daily schedule for the user based on their energy levels, priorities, and habits.

Follow these strict scheduling rules:
1. **Protect Focus Time:** Block out 90-120 minute uninterrupted chunks for deep work during the user's peak energy hours (e.g., mornings).
2. **Buffer Zones:** Never schedule back-to-back meetings. Always insert a 10-15 minute buffer for context switching.
3. **Productivity Rhythm:** Place low-energy administrative tasks (like checking emails or quick replies) in the late afternoon slump.
4. **Health & Balance:** Explicitly block out time for lunch, hydration breaks, and a hard log-off time.

Analyze the user's available open slots, cross-reference them with their to-do list priorities, and output a structured schedule.
"""
import os
from anthropic import Anthropic

# Initialize the Anthropic client
# Make sure you have export ANTHROPIC_API_KEY="your-api-key" in your terminal
client = Anthropic()

# 1. Define the tool/function Claude will use to output the final schedule
tools = [
    {
        "name": "save_final_schedule",
        "description": "Saves the finalized, optimized daily schedule to the user's system or calendar.",
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "YYYY-MM-DD"},
                "time_blocks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "start_time": {"type": "string", "description": "HH:MM"},
                            "end_time": {"type": "string", "description": "HH:MM"},
                            "activity": {"type": "string", "description": "Name of the task or block"},
                            "category": {"type": "string", "enum": ["Deep Work", "Routine/Admin", "Meeting", "Rest/Break"]}
                        },
                        "required": ["start_time", "end_time", "activity", "category"]
                    }
                }
            },
            "required": ["date", "time_blocks"]
        }
    }
]

# 2. Provide the raw context (Your inputs)
user_input = """
Here is my context for tomorrow (2026-06-22):
- I have an unavoidable team meeting from 11:00 AM to 11:45 AM.
- My high-priority tasks: Finish writing the backend API endpoints (needs 3 hours of heavy focus), review PRs (30 mins).
- My preferences: I am a morning person. My brain works best between 8:00 AM and 11:00 AM. I want to log off by 5:30 PM.
Please build my perfect schedule.
"""

# 3. Call the Claude API
response = client.messages.create(
    model="claude-3-5-sonnet-latest", # Use the latest powerful model for logic
    max_tokens=2000,
    system=SYSTEM_PROMPT,
    tools=tools,
    messages=[
        {"role": "user", "content": user_input}
    ]
)

# 4. Process Claude's output
for content in response.content:
    if content.type == "tool_use":
        if content.name == "save_final_schedule":
            schedule_data = content.input
            print("--- Claude generated the perfect schedule structured as JSON! ---")
            print(schedule_data)
            # Here, you would plug this JSON data into your UI or Google Calendar API

This conversation belongs to a Grok project. The project's files are mounted at `/workspace/artifacts` — look there for user-provided sources before concluding the workspace has no project files. Files written there persist to the project across conversations.