# interview_app/openai_client.py
import os
import time
from openai import OpenAI

class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.assistant = self.create_assistant()

    def create_assistant(self):
        try:
            assistant = self.client.beta.assistants.create(
                name="UMPIRE Interview Assistant",
                instructions=(
                    "You are an expert technical interviewer conducting a LeetCode interview. "
                    "Your job is to direct the interviewee to structure their responses using the UMPIRE method. "
                    "Start by asking the user what Leetcode question they want to work on and then direct them to answer "
                    "the question using the UMPIRE method. Direct them through each step of the UMPIRE method."
                ),
                model="gpt-4",
            )
            print(f"Assistant created with ID: {assistant.id}")
            return assistant
        except Exception as e:
            print(f"Error creating assistant: {e}")
            return None

    def get_response(self, user_message):
        try:
            # Create a new thread with the user's message
            thread = self.client.beta.threads.create(
                messages=[
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            )
            print(f"Thread created with ID: {thread.id}")

            # Run the assistant on the thread
            run = self.client.beta.threads.runs.create(
                thread_id=thread.id,
                assistant_id=self.assistant.id
            )
            print(f"Run started with ID: {run.id}")

            # Poll the run until it completes or fails
            max_retries = 30
            retries = 0
            while run.status not in ['completed', 'failed', 'cancelled', 'incomplete'] and retries < max_retries:
                time.sleep(1)
                run = self.client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
                print(f"Polling run status: {run.status}")
                retries += 1

            if run.status == 'completed':
                # Retrieve the assistant's reply
                messages = self.client.beta.threads.messages.list(thread_id=thread.id)
                print(f"Messages retrieved: {messages.data}")

                # Find the assistant's messages
                assistant_messages = [msg for msg in messages.data if msg.role == 'assistant']
                if assistant_messages:
                    assistant_reply = assistant_messages[-1]  # Get the last assistant message
                    # Extract the text content from the message
                    assistant_message = ''
                    for content_item in assistant_reply.content:
                        if content_item.type == 'text':
                            assistant_message += content_item.text.value
                    print(f"Assistant's response: {assistant_message}")
                    return assistant_message
                else:
                    print("No assistant response found.")
                    return 'No assistant response found.'
            elif run.status == 'failed':
                # Print the last error for debugging
                print(f"Run failed with error: {run.last_error}")
                return f'Run failed with error: {run.last_error}'
            else:
                print(f"Error: Run status is {run.status} after polling.")
                return f'Error: Run status is {run.status}.'

        except Exception as e:
            print(f"An error occurred: {e}")
            return f'An error occurred: {str(e)}'
