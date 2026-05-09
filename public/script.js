const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  const botMsgElement = appendMessage('bot', 'Chef Rumahan sedang berpikir... 🤔');

  try {
    const response = await fetch('/chat/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: userMessage })
    });

    const data = await response.json();

    if (data.result) {
      // Gunakan innerHTML agar bisa membaca tag <b>, <br>, dll
      botMsgElement.innerHTML = formatMarkdown(data.result);
    } else {
      botMsgElement.textContent = "Maaf, terjadi kesalahan pada server.";
    }

  } catch (error) {
    console.error('Error:', error);
    botMsgElement.textContent = "Gagal terhubung ke server.";
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function formatMarkdown(text) {
  let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  htmlText = htmlText.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  htmlText = htmlText.replace(/\n/g, '<br>');
  return htmlText;
}