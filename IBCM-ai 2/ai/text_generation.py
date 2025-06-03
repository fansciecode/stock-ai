from transformers import pipeline

generator = pipeline("text-generation", model="gpt2")  # You can swap for a better model

def generate_event_description(title, category, context=""):
    prompt = f"Create an engaging event description for a {category} event titled '{title}'. {context}"
    result = generator(prompt, max_length=100, num_return_sequences=1)
    return result[0]['generated_text'] 