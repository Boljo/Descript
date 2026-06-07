FROM python:3.12-slim
RUN pip install anthropic
COPY analyze.py /analyze.py
COPY system_prompt.md /system_prompt.md
ENTRYPOINT ["python", "/analyze.py"]