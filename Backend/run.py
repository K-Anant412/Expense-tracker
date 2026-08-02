import os
from App import create_app

env_setting = os.getenv("FLASK_ENV", "development")
app = create_app(env_setting)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)