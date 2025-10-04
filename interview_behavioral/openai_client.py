# interview_app/openai_client.py
import os
import time
from openai import OpenAI

class OpenAIClient:
    def __init__(self):
        # Initialize OpenAI client with API key from environment variables
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.assistant = None
        self.resume = None
        self.job_description = None
        self.thread = None  # Store the thread ID for the entire interview session

    def create_assistant(self):
        """Create an assistant for conducting behavioral interviews."""
        try:
            context = (
                f"CANDIDATE'S RESUME:\n{self.resume}\n\n"
                f"JOB DESCRIPTION:\n{self.job_description}\n\n"
            ) if self.resume and self.job_description else ""
            
            assistant = self.client.beta.assistants.create(
                name="Behavioral Interview Assistant",
                instructions=(
                    f"You are an expert behavioral interviewer conducting an interview with {context}. Your task is to ask behavioral questions that are highly relevant to the candidate's resume and the job description. Ask one question at a time, ensuring a logical flow between questions based on the candidate's responses. If their answer is vague or lacks depth, ask follow-up or clarifying questions to encourage them to provide more detail or concrete examples. Do not simply move to the next question; instead, build on their responses to create a structured and engaging interview. The goal is to make the conversation feel seamless and insightful, rather than a disconnected series of questions. Begin by asking a strong behavioral question that aligns with their experience and the job role, then guide the conversation naturally based on their responses."
                ),
                model="gpt-4o",
                temperature=0.1,
            )
            return assistant
        except Exception as e:
            return None

    def initialize_interview(self, resume, job_description):
        """Initialize the interview with a resume and job description."""
        self.resume = resume
        self.job_description = job_description
        self.assistant = self.create_assistant()
        
        # Create a new thread for the entire interview session
        try:
            self.thread = self.client.beta.threads.create()
            
            # Add an initial system message to start the interview
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content="Welcome me to the interview and ask me your first question."
            )
        except Exception:
            pass

    def get_response(self, user_message):
        """Get a response from the assistant based on the user's message."""
        try:
            if not self.thread:
                # If thread doesn't exist for some reason, create one
                self.thread = self.client.beta.threads.create()
               
            
            # Add the user message to the existing thread
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content=user_message
            )
          

            # Run the assistant on the thread
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread.id,
                assistant_id=self.assistant.id
            )
           

            # Poll the run until it completes or fails
            max_retries = 30
            retries = 0
            while run.status not in ['completed', 'failed', 'cancelled', 'incomplete'] and retries < max_retries:
                time.sleep(1)
                run = self.client.beta.threads.runs.retrieve(thread_id=self.thread.id, run_id=run.id)
               
                retries += 1

            if run.status == 'completed':
                # Retrieve the assistant's reply
                messages = self.client.beta.threads.messages.list(thread_id=self.thread.id)
               

                # Find the assistant's messages
                assistant_messages = [msg for msg in messages.data if msg.role == 'assistant']
                if assistant_messages:
                    assistant_reply = assistant_messages[0]  # Get the most recent assistant message
                    # Extract the text content from the message
                    assistant_message = ''.join(
                        content_item.text.value for content_item in assistant_reply.content if content_item.type == 'text'
                    )
                  
                    return assistant_message
                else:
                   
                    return 'No assistant response found.'
            elif run.status == 'failed':
        
                
                return f'Run failed with error: {run.last_error}'
            else:
                
                return f'Error: Run status is {run.status}.'

        except Exception as e:
           
            return f'An error occurred: {str(e)}'
