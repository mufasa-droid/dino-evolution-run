import { context, requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button');
if (startButton instanceof HTMLButtonElement) {
  startButton.addEventListener('click', (event) => {
    void requestExpandedMode(event, 'game');
  });
}

const greetingElement = document.getElementById('greeting');
if (greetingElement instanceof HTMLElement && context.username) {
  greetingElement.textContent = `Ready, u/${context.username}?`;
}
