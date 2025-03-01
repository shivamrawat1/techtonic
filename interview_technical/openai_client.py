# interview_app/openai_client.py
import os
import time
import logging
from openai import OpenAI

class OpenAIClient:
    def __init__(self):
        # Initialize OpenAI client with API key from environment variables
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.assistant = None
        self.selected_question = None
        self.thread = None  # Store the thread ID for the entire interview session
        
        # Set up logging
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)

    def create_assistant(self):
        """Create an assistant for conducting technical interviews."""
        try:
            question_context = (
                f"The selected LeetCode question is: {self.selected_question}\n\n"
                if self.selected_question else ""
            )
            
            assistant = self.client.beta.assistants.create(
                name="Technical Interview Assistant",
                instructions=(
                    f"You are an expert technical interviewer conducting a mock coding interview. {question_context}"
                    "As an interviewer, guide the candidate through a structured approach to solving the problem:"
                    "\n\n1. First, help them fully understand the problem by asking clarifying questions and discussing examples."
                    "\n2. Then, encourage them to identify constraints, edge cases, and requirements before coding."
                    "\n3. Then, ask them to outline their approach and discuss potential solutions before implementation."
                    "\n4. When they're ready to code, provide guidance as needed but let them work through the solution."
                    "\n5. After implementation, prompt them to walk through their code with test cases to verify correctness."
                    "\n6. Finally, discuss the time and space complexity of their solution and explore optimization opportunities if any."
                    "\n\nMake the interview conversational and engaging. Ask one question at a time, "
                    ".Begin by welcoming the candidate and introducing the problem."
                ),
                model="gpt-4o",
                temperature=0.1,
            )
            self.logger.info(f"Assistant created with ID: {assistant.id}")
            return assistant
        except Exception as e:
            self.logger.error(f"Error creating assistant: {e}")
            return None

    def initialize_interview(self, question):
        """Initialize the interview with a selected question."""
        try:
            self.selected_question = question
            self.assistant = self.create_assistant()
            
            # Create a new thread for the entire interview session
            self.thread = self.client.beta.threads.create()
            self.logger.info(f"New interview thread created with ID: {self.thread.id}")
            
            # Add an initial system message to start the interview
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content="Welcome me to the interview, and ask me read the problem statement on the question description section."
            )
        except Exception as e:
            self.logger.error(f"Error initializing interview: {e}")

    def get_response(self, user_message):
        """Get a response from the assistant based on the user's message."""
        try:
            if not self.thread:
                # If thread doesn't exist for some reason, create one
                self.thread = self.client.beta.threads.create()
                self.logger.info(f"Created new thread with ID: {self.thread.id} because no thread existed")
            
            # Add the user message to the existing thread
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content=user_message
            )
            self.logger.info(f"Added user message to thread {self.thread.id}")

            # Run the assistant on the thread
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread.id,
                assistant_id=self.assistant.id
            )
            self.logger.info(f"Run started with ID: {run.id}")

            # Poll the run until it completes or fails
            max_retries = 30
            retries = 0
            while run.status not in ['completed', 'failed', 'cancelled', 'incomplete'] and retries < max_retries:
                time.sleep(1)
                run = self.client.beta.threads.runs.retrieve(thread_id=self.thread.id, run_id=run.id)
                self.logger.info(f"Polling run status: {run.status}")
                retries += 1

            if run.status == 'completed':
                # Retrieve the assistant's reply
                messages = self.client.beta.threads.messages.list(thread_id=self.thread.id)
                self.logger.info(f"Messages retrieved: {len(messages.data)} messages")

                # Find the assistant's messages
                assistant_messages = [msg for msg in messages.data if msg.role == 'assistant']
                if assistant_messages:
                    assistant_reply = assistant_messages[0]  # Get the most recent assistant message
                    # Extract the text content from the message
                    assistant_message = ''.join(
                        content_item.text.value for content_item in assistant_reply.content if content_item.type == 'text'
                    )
                    self.logger.info(f"Assistant's response length: {len(assistant_message)} characters")
                    return assistant_message
                else:
                    self.logger.warning("No assistant response found.")
                    return 'No assistant response found.'
            elif run.status == 'failed':
                # Print the last error for debugging
                self.logger.error(f"Run failed with error: {run.last_error}")
                return f'Run failed with error: {run.last_error}'
            else:
                self.logger.error(f"Error: Run status is {run.status} after polling.")
                return f'Error: Run status is {run.status}.'
        except Exception as e:
            self.logger.error(f"An error occurred: {e}")
            return f'An error occurred: {str(e)}'
