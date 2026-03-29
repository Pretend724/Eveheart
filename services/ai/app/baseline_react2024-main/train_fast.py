import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm
from simple_dataset import SimpleReactionDataset

class FinalModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(1, 128, batch_first=True, bidirectional=True)
        self.out = nn.Linear(256, 58)

    def forward(self, x):
        x = x.unsqueeze(-1)
        feat, _ = self.lstm(x)
        out = self.out(feat)
        return out, None, None

def main():
    data_root = "./data"
    device = torch.device("cpu")

    train_dataset = SimpleReactionDataset(data_root, split="train")
    train_loader = DataLoader(train_dataset, batch_size=1, shuffle=True)

    model = FinalModel().to(device)
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    criterion = nn.MSELoss()

    print("🚀 训练开始！")
    for epoch in range(10):
        model.train()
        total_loss = 0
        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/10")

        for batch in pbar:
            audio = batch["audio"].to(device)
            face = batch["face"].to(device)

            # 自动对齐长度
            min_len = min(audio.shape[1], face.shape[1])
            audio = audio[:, :min_len]
            face = face[:, :min_len]

            pred, _, _ = model(audio)
            loss = criterion(pred, face)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            pbar.set_postfix(loss=f"{loss.item():.4f}")

        avg_loss = total_loss / len(train_loader)
        print(f"✅ Epoch {epoch+1} 平均损失: {avg_loss:.6f}")
        torch.save(model.state_dict(), "final_model.pth")

if __name__ == "__main__":
    main()
