
import google.generativeai as genai
import sys

api_key = sys.argv[1]
try:
    genai.configure(api_key=api_key)
    print("--- AVAILABLE MODELS ---")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"NAME: {m.name}, DISPLAY: {m.display_name}")
except Exception as e:
    print(f"ERROR: {e}")
