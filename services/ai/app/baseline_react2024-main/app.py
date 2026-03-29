from flask import Flask, Response, jsonify, request
import cv2
import torch
import numpy as np

app = Flask(__name__)

class FinalModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = torch.nn.LSTM(1, 128, batch_first=True, bidirectional=True)
        self.out = torch.nn.Linear(256, 58)
    def forward(self, x):
        x = x.unsqueeze(-1)
        feat, _ = self.lstm(x)
        out = self.out(feat)
        return out

model = FinalModel()
try:
    model.load_state_dict(torch.load("final_model.pth", map_location='cpu'))
except:
    pass
model.eval()

face_params = np.zeros(58, dtype=np.float32)

def gen_frames():
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            break

        h, w = frame.shape[:2]
        x1 = int(100 + face_params[0] * 20)
        y1 = int(100 + face_params[1] * 20)
        x2 = int(w-100 + face_params[10] * 20)
        y2 = int(h-100 + face_params[20] * 20)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, "Live Camera + AI Face", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>实时摄像头</title>
    <style>
        body{text-align:center; background:#111; color:white; padding-top:30px;}
        img{max-width:90%; border-radius:10px; border:3px solid #0ff;}
    </style>
</head>
<body>
    <h1>🎥 实时摄像头</h1>
    <img src="/video_feed" width="800">
</body>
</html>
'''

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
