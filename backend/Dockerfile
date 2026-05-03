FROM python:3.11-slim

ENV PYTHONUTF8=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH

WORKDIR /app

COPY --chown=user:user requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Pre-fetch TrustMark model weights so the first user request isn't blocked
# by a 200 MB download.
RUN python -c "from trustmark import TrustMark; TrustMark(verbose=False, model_type='Q', use_ECC=False, secret_len=100)"

COPY --chown=user:user . .

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
