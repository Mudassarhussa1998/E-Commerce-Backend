import requests
import json

url = "http://localhost:8000/auth/register"
payload = {
    "name": "Test User",
    "email": "testuser_debug@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "user"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
