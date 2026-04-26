import requests
import cv2
import numpy as np
from paddleocr import PaddleOCR

# 🔧 PUT YOUR ESP IP HERE
ESP_URL = "http://10.206.163.196/capture"

ocr = PaddleOCR(use_angle_cls=False, lang='en')

response = requests.get(ESP_URL)

if response.status_code == 200:
    img_array = np.frombuffer(response.content, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    cv2.imwrite("captured.jpg", img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2)

    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    cv2.imwrite("processed.jpg", thresh)

    print("Image captured")

    result = ocr.ocr("processed.jpg")

    text = ""
    for line in result:
        for word in line:
            text += word[1][0] + " "

    print("Extracted Text:")
    print(text)

else:
    print("Failed to get image")