import os
from App import create_app

env = os.getenv("FLASK_ENV", "production")
app = create_app(env)

if __name__ == "__main__":
    app.run()