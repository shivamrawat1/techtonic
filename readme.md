A web application for generating custom newsletters on latest news and research that matches your interest.

## Prerequisites

- Python 3.12.4
- pip (Python package installer)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shivamrawat1/pitchmycode.git
```

2. Navigate to the project directory:
```bash
cd pitchmycode
```

3. Create and activate a virtual environment:
- On Mac:
```bash
python -m venv venv
source venv/bin/activate
```

- On Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

4. Install the required packages:
```bash
pip install -r requirements.txt
```

5. Set Up Environment Variables using the .env.local file

6. Run Migrations
```bash
python manage.py migrate
```

7. Create a Superuser (Optional)
```bash
python manage.py createsuperuser
```
Follow the prompts to set up an admin account.

8. Collect Static Files (If Required)
```bash
python manage.py collectstatic --noinput
```

9. Run the application:
```bash
python manage.py runserver
```
By default, this will run the server on http://127.0.0.1:8000/

