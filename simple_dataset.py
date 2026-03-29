import os
import numpy as np
import torch
from torch.utils.data import Dataset
import librosa

class SimpleReactionDataset(Dataset):
    def __init__(self, data_root, split='train'):
        self.root = os.path.join(data_root, split)
        self.audio_dir = os.path.join(self.root, 'Audio_files')
        self.face_dir = os.path.join(self.root, '3D_FV_files')
        self.files = [f for f in os.listdir(self.audio_dir) if f.endswith('.wav') and os.path.exists(os.path.join(self.face_dir, f.replace('.wav', '.npz')))]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        fname = self.files[idx]
        audio_path = os.path.join(self.audio_dir, fname)
        wav, _ = librosa.load(audio_path, sr=16000)
        audio = torch.tensor(wav, dtype=torch.float32)
        face_path = os.path.join(self.face_dir, fname.replace('.wav', '.npz'))
        face = np.load(face_path)['arr_0']
        face = torch.tensor(face, dtype=torch.float32)
        return {'audio': audio, 'face': face}
