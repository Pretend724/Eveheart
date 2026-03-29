import torch
import torch.nn as nn
import torch.nn.functional as F

class TransformerVAE(nn.Module):
    def __init__(self, input_dim=80, output_3dmm_dim=56, output_emotion_dim=25, d_model=256, nhead=4, num_layers=2, window_size=16):
        super().__init__()
        self.window_size = window_size
        self.output_3dmm_dim = output_3dmm_dim
        self.output_emotion_dim = output_emotion_dim

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.ReLU(),
            nn.Linear(d_model, d_model)
        )

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, dim_feedforward=d_model*2,
            dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        self.mu_layer = nn.Linear(d_model, d_model)
        self.logvar_layer = nn.Linear(d_model, d_model)

        self.decoder = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Linear(d_model, output_3dmm_dim + output_emotion_dim)
        )

    def reparameterize(self, mu, logvar):
        if self.training:
            std = torch.exp(0.5 * logvar)
            eps = torch.randn_like(std)
            return eps * std + mu
        else:
            return mu

    def forward(self, audio):
        B, T = audio.shape
        audio = audio.unsqueeze(-1)
        feat = self.encoder(audio)
        feat = self.transformer(feat)

        mu = self.mu_layer(feat)
        logvar = self.logvar_layer(feat)
        z = self.reparameterize(mu, logvar)

        output = self.decoder(z)
        pred_3dmm = output[..., :self.output_3dmm_dim]
        pred_emotion = output[..., self.output_3dmm_dim:]

        return pred_3dmm, mu, logvar
