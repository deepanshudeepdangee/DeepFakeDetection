from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)

# Load the model
model = tf.keras.models.load_model('bestie_model.h5')

def preprocess_image(image):
    # Resize image to match model's expected sizing
    image = image.resize((128, 128))
    # Convert to numpy array
    img_array = np.array(image)
    # Normalize pixel values
    img_array = img_array / 255.0
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/detect')
def detect():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if the post request has the file part
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
            
        file = request.files['image']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if not file:
            return jsonify({'error': 'No image provided'}), 400

        # Read the image
        image = Image.open(io.BytesIO(file.read()))
        
        # Preprocess the image
        processed_image = preprocess_image(image)
        
        # Make prediction
        prediction = model.predict(processed_image)
        
        # Get the probability of being fake
        fake_probability = float(prediction[0][0])
        real_probability = 1 - fake_probability
        
        # Determine if the image is fake or real
        # If fake_probability > 0.5, it's fake; otherwise, it's real
        is_fake = fake_probability > 0.5
        confidence = fake_probability if is_fake else real_probability
        
        # Invert the prediction if needed (if model is trained with opposite labels)
        is_fake = not is_fake
        
        return jsonify({
            'is_fake': bool(is_fake),
            'confidence': float(confidence)
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")  # Add this line for debugging
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 