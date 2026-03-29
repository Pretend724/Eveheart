import argparse
import os
import torch
import torch.optim as optim
from tqdm import tqdm
from torch.utils.data import DataLoader
from dataset import Dataset  # 这里改成官方原版的 Dataset！
from model import TransformerVAE
from utils import save_checkpoint, load_checkpoint

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_root', type=str, default='./data')
    parser.add_argument('--batch_size', type=int, default=2)
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--lr', type=float, default=1e-4)
    parser.add_argument('--resume', type=str, default=None)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # 加载官方原版数据集
    train_dataset = Dataset(os.path.join(args.data_root, 'train'))
    val_dataset = Dataset(os.path.join(args.data_root, 'val'))

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    model = TransformerVAE().to(device)
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    criterion = torch.nn.MSELoss()

    start_epoch = 0
    if args.resume:
        start_epoch = load_checkpoint(args.resume, model, optimizer)

    for epoch in range(start_epoch, args.epochs):
        model.train()
        train_loss = 0
        pbar = tqdm(train_loader)
        
        for data in pbar:
            audio = data['audio'].to(device)
            face = data['face'].to(device)

            optimizer.zero_grad()
            output, mu, logvar = model(audio)
            loss = criterion(output, face)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            pbar.set_description(f'Epoch {epoch+1}/{args.epochs} Loss: {loss.item():.4f}')

        print(f'Epoch {epoch+1} 训练完成，平均损失: {train_loss/len(train_loader):.4f}')

        save_checkpoint({
            'epoch': epoch + 1,
            'state_dict': model.state_dict(),
            'optimizer': optimizer.state_dict(),
        }, filename=f'checkpoint_epoch{epoch+1}.pth')

if __name__ == '__main__':
    main()
