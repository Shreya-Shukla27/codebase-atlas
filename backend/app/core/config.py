from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()