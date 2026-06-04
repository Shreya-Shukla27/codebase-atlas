from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required keys — fail fast if missing
    GITHUB_TOKEN: str
    ANTHROPIC_API_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


try:
    settings = Settings()
except Exception as e:
    # Provide a clearer error message and stop startup
    raise RuntimeError(
        f"Failed to load environment settings: {e}.\n\nCreate a `.env` file in the `backend` folder or set the required environment variables. See backend/.env.example for an example."
    )
