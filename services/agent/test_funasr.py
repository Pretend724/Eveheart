from load_model import load_voice_model

model = load_voice_model()

res = model.generate(
    input="test.wav",
)

print(res)
