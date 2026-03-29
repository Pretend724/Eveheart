import os
import numpy as np
import torch
from torch.utils.data import Dataset
import librosa

class SimpleReactionDataset(Dataset):
    def __init__(self, data_root, split='train'):
        self.split_root = os.path.join(data_root, split)
        self.face_dir = os.path.join(self.split_root, '3D_FV_files')
        self.audio_dir = os.path.join(self.split_root, 'Audio_files')
        self.samples = self._collect_samples()
        print(f"✅ 找到 {len(self.samples)} 个样本")

    def _collect_samples(self):
        samples = []
        # 遍历所有 3D 面部文件（npy/npz）
        for face_root, _, face_files in os.walk(self.face_dir):
            for face_file in face_files:
                if not (face_file.endswith('.npy') or face_file.endswith('.npz')):
                    continue
                # 计算相对路径
                rel_path = os.path.relpath(face_root, self.face_dir)
                base_name = os.path.splitext(face_file)[0]
                # 匹配音频
                audio_file = f"{base_name}.wav"
                audio_path = os.path.join(self.audio_dir, rel_path, audio_file)
                if os.path.exists(audio_path):
                    samples.append({
                        'face_path': os.path.join(face_root, face_file),
                        'audio_path': audio_path,
                        'fmt': 'npz' if face_file.endswith('.npz') else 'npy'
                    })
        return samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        # 加载音频
        wav, _ = librosa.load(sample['audio_path'], sr=16000)
        audio = torch.tensor(wav, dtype=torch.float32)
        # 加载3D面部
        if sample['fmt'] == 'npz':
            face = np.load(sample['face_path'])['arr_0']
        else:
            face = np.load(sample['face_path'])
        face = torch.tensor(face, dtype=torch.float32)
        return {'audio': audio, 'face': face}
