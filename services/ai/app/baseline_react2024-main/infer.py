import torch
import torch.nn as nn
import librosa

class FinalModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(1, 128, batch_first=True, bidirectional=True)
        self.out = nn.Linear(256, 58)

    def forward(self, x):
        x = x.unsqueeze(-1)
        feat, _ = self.lstm(x)
        out = self.out(feat)
        return out

def load_model():
    model = FinalModel()
    model.load_state_dict(torch.load("final_model.pth", map_location="cpu"))
    model.eval()
    return model

def predict_audio(model, wav_path):
    wav, _ = librosa.load(wav_path, sr=16000)
    audio = torch.FloatTensor(wav).unsqueeze(0)
    with torch.no_grad():
        pred = model(audio)
    return pred.squeeze().cpu().numpy()