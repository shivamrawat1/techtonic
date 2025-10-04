# interview_app/openai_client.py
import os
import time
from openai import OpenAI


class OpenAIClient:
    def __init__(self):
        # Initialize OpenAI client with API key from environment variables
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.assistant = None
        self.selected_question = None
        self.thread = None  # Store the thread ID for the entire interview session

    def create_assistant(self):
        """Create an assistant for conducting technical interviews."""
        try:
            question_context = (
                f"The selected LeetCode question is: {self.selected_question}\n\n"
                if self.selected_question
                else ""
            )

            assistant = self.client.beta.assistants.create(
                name="Technical Interview Assistant",
                instructions=(
                    f"You are an expert technical interviewer conducting a mock coding interview for {question_context}. "
                    f"Your primary role is to ask structured questions that help the candidate systematically work through the problem. "
                    f"Do not provide hints, solutions, or leading suggestions—let the candidate drive the discussion. If their response "
                    f"is vague or lacks depth, ask follow-up questions to encourage them to clarify, elaborate, or consider additional aspects.\n\n"
                    f"Guide the candidate through the interview in a structured manner:\n\n"
                    f"1. Understanding the Problem (U in UMPIRE): Start by ensuring the candidate fully understands and can accurately "
                    f"restate the problem. Ask them to clarify any ambiguous details and provide input/output examples to demonstrate comprehension.\n\n"
                    f"2. Identifying Constraints & Edge Cases (U in UMPIRE): Prompt the candidate to think critically about constraints, "
                    f"edge cases, and assumptions that could impact their approach. If they overlook key aspects, ask targeted questions to guide them.\n\n"
                    f"3. Matching the Problem to Data Structures & Algorithms (M in UMPIRE): Ask the candidate to identify the underlying "
                    f"problem type (e.g., sorting, graph traversal, dynamic programming). Encourage them to connect the problem to relevant "
                    f"patterns or known approaches. If they suggest multiple approaches, ask about trade-offs in terms of efficiency and feasibility.\n\n"
                    f"4. Planning the Solution (P in UMPIRE): Have the candidate outline their thought process and walk through different "
                    f"potential approaches. Ask them to justify their choices, considering alternatives and evaluating their efficiency before "
                    f"committing to an implementation.\n\n"
                    f"5. Implementing the Solution (I in UMPIRE): Once they have articulated a clear plan, prompt them to begin coding. "
                    f"Do not provide coding hints but ensure they stay on track by asking them to explain each part as they write.\n\n"
                    f"6. Reviewing & Testing (R in UMPIRE): After implementation, have the candidate walk through their code with test cases, "
                    f"verifying correctness and debugging if necessary. Ask them how they would handle additional cases.\n\n"
                    f"7. Evaluating Complexity & Optimization (E in UMPIRE): Finally, prompt the candidate to analyze their solution's time "
                    f"and space complexity. Ask whether their approach is optimal and explore alternative strategies.\n\n"
                    f"Maintain a natural, engaging conversation where each question builds on the candidate's responses. Ensure that the "
                    f"interview remains structured and logical, allowing the candidate to showcase their problem-solving skills while thinking "
                    f"critically at every stage. MAKE SURE TO NOT GIVE ANY HINTS OR SOLUTIONS. YOU ARE ONLY SUPPOSED TO ASK QUESTIONS. ALSO DO NOT REITEATE WHAT THE CANDIDATE SAID. The responses should not be more than 60 words."
                ),
                model="gpt-4o",
                temperature=0.1,
            )
            pass
            return assistant
        except Exception:
            raise Exception

    def initialize_interview(self, question):
        """Initialize the interview with a selected question."""
        try:
            self.selected_question = question
            self.assistant = self.create_assistant()

            # Create a new thread for the entire interview session
            self.thread = self.client.beta.threads.create()
            pass

            # Add an initial system message to start the interview
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content="Welcome me to the interview and then start.",
            )
        except Exception:
            raise Exception

    def get_response(self, user_message):
        """Get a response from the assistant based on the user's message."""
        try:
            if not self.thread:
                # If thread doesn't exist for some reason, create one
                self.thread = self.client.beta.threads.create()
                pass

            # Add the user message to the existing thread
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id, role="user", content=user_message
            )
            pass

            # Run the assistant on the thread
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread.id, assistant_id=self.assistant.id
            )
            pass

            # Poll the run until it completes or fails
            max_retries = 30
            retries = 0
            while (
                run.status not in ["completed", "failed", "cancelled", "incomplete"]
                and retries < max_retries
            ):
                time.sleep(1)
                run = self.client.beta.threads.runs.retrieve(
                    thread_id=self.thread.id, run_id=run.id
                )
                pass
                retries += 1

            if run.status == "completed":
                # Retrieve the assistant's reply
                messages = self.client.beta.threads.messages.list(
                    thread_id=self.thread.id
                )
                pass

                # Find the assistant's messages
                assistant_messages = [
                    msg for msg in messages.data if msg.role == "assistant"
                ]
                if assistant_messages:
                    assistant_reply = assistant_messages[
                        0
                    ]  # Get the most recent assistant message
                    # Extract the text content from the message
                    assistant_message = "".join(
                        content_item.text.value
                        for content_item in assistant_reply.content
                        if content_item.type == "text"
                    )
                    pass
                    return assistant_message
                else:
                    pass
                    return "No assistant response found."
            elif run.status == "failed":
                pass
                return f"Run failed with error: {run.last_error}"
            else:
                pass
                return f"Error: Run status is {run.status}."
        except Exception as e:
            pass
            return f"An error occurred: {str(e)}"
